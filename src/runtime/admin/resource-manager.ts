import { computed, createApp, nextTick, ref, shallowRef, watch } from 'vue'
import type { ComponentPublicInstance, Ref, ComputedRef, ShallowRef } from 'vue'
import { consola as logger } from 'consola'
import type { App } from 'vue/dist/vue'
import { AdminStore } from '../storage/stores/admin/admin-store'
import { ResourcesStore } from '../storage/stores/resources/resources-store'
import ComponentFocus from '../templates/components/main/admin/resource-manager/ComponentFocus.vue'
import type { StyleOptions } from './manageable-resource'
import type { ComponentUi, ManagerTab } from '#cwa/module'

interface resourceStackItem {
  iri: string
  domElements: Ref<HTMLElement[]>
  displayName?: string,
  managerTabs?: ManagerTab[],
  ui?: ComponentUi[],
  childIris: ComputedRef<string[]>
  styles?: ComputedRef<StyleOptions>
}

// will be used to have additional properties not sent by the initial addToStack event
export interface ResourceStackItem extends resourceStackItem {
}

interface AddToStackWindowEvent {
  clickTarget: EventTarget | null
}

interface AddToStackEvent extends resourceStackItem, AddToStackWindowEvent {
}

export interface AddResourceEvent {
  addAfter: boolean
  targetIri: string
  resource?: string
}

export default class ResourceManager {
  public readonly forcePublishedVersion: Ref<boolean|undefined> = ref()
  public readonly showManager: Ref<boolean> = ref(false)
  public readonly addResourceTriggered: Ref<undefined|AddResourceEvent> = ref()
  private readonly currentClickTarget: Ref<EventTarget|null> = ref(null)
  private readonly currentResourceStack: ShallowRef<ResourceStackItem[]> = shallowRef([])
  private readonly lastContextTarget: Ref<EventTarget|null> = ref(null)
  private readonly contextResourceStack: ShallowRef<ResourceStackItem[]> = shallowRef([])
  private readonly cachedCurrentStackItem = shallowRef<undefined|ResourceStackItem>()
  private readonly resourceManagerState = ref({} as Record<string, any>)
  private readonly yOffset = 100
  private focusComponent: App|undefined
  private focusWrapper: HTMLElement|undefined
  private focusProxy: ComponentPublicInstance|undefined

  constructor (private adminStoreDefinition: AdminStore, private readonly resourcesStoreDefinition: ResourcesStore) {
    watch(() => this.isEditing, this.listenEditModeChange.bind(this))
    watch(this.currentIri, this.listenCurrentIri.bind(this))
    watch(this.currentStackItem, this.handleCurrentStackItemChange.bind(this))
    watch(this.showManager, newValue => !newValue && this.removeFocusComponent())
  }

  private async handleCurrentStackItemChange (currentStackItem: ResourceStackItem|undefined) {
    this.cachedCurrentStackItem.value = currentStackItem
    await nextTick()
    this.scrollIntoView()
    this.createFocusComponent()
  }

  public getState (prop: string) {
    return this.resourceManagerState.value[prop]
  }

  public setState (prop: string, value: any) {
    Object.assign(this.resourceManagerState.value, { [prop]: value })
  }

  public get contextStack () {
    return computed(() => {
      return this.lastContextTarget.value ? [] : this.contextResourceStack.value
    })
  }

  public get resourceStack () {
    return computed(() => {
      return this.currentClickTarget.value ? [] : this.currentResourceStack.value
    })
  }

  public get isPopulating () {
    return computed(() => !!this.currentClickTarget.value)
  }

  public get isContextPopulating () {
    return computed(() => !!this.lastContextTarget.value)
  }

  public get currentStackItem () {
    return computed(() => {
      if (!this.showManager.value) {
        return
      }
      // processing new stack, keep returning previous
      if (this.currentClickTarget.value) {
        return this.cachedCurrentStackItem.value
      }
      // currentResourceStack is a shallowRef and an array, unless the length changes, it basically doesn't trigger for
      // this computed variable to update. this is an issue when replacing the stack item
      return this.currentClickTarget.value ? undefined : this.currentResourceStack.value[0]
    })
  }

  public get currentIri () {
    return computed(() => {
      const currentStackItem = this.currentStackItem.value
      if (!currentStackItem) {
        return
      }
      const stackIri = currentStackItem.iri
      if (this.forcePublishedVersion.value === undefined) {
        return stackIri
      }
      if (this.forcePublishedVersion.value) {
        return this.resourcesStore.findPublishedComponentIri(stackIri)
      }
      return this.resourcesStore.findDraftComponentIri(stackIri)
    })
  }

  public resetStack (isContext?: boolean) {
    if (isContext) {
      this.lastContextTarget.value = null
      this.contextResourceStack.value = []
      return
    }
    this.currentClickTarget.value = null
    this.currentResourceStack.value = []
  }

  public selectStackIndex (index: number, fromContext?: boolean) {
    if (!this.isEditing) {
      return
    }
    const fromStack = fromContext ? this.contextResourceStack : this.currentResourceStack
    const currentLength = fromStack.value.length
    if (!currentLength) {
      this.showManager.value = false
      return
    }
    if (index < 0 || index > currentLength - 1) {
      logger.error(`Cannot select stack index: '${index}' is out of range`)
      return
    }
    this.currentResourceStack.value = fromStack.value.slice(index)
    this.showManager.value = true
    if (fromContext) {
      this.resetStack(true)
    }
  }

  public addToStack (event: AddToStackEvent|AddToStackWindowEvent, isContext?: boolean) {
    // stack will not have been reset

    const currentTarget = isContext ? this.lastContextTarget : this.currentClickTarget

    const { clickTarget, ...resourceStackItem } = event
    const isResourceClick = ('iri' in resourceStackItem)

    // we are starting a new stack - last click before was a window or has been reset
    if (!currentTarget.value) {
      // If the first item being added to stack is the same IRI as the first item populated into the current stack, cancel, do not repopulate the same stack
      if (!isContext && isResourceClick && this.isItemAlreadyInStack(resourceStackItem.iri, false)) {
        currentTarget.value = clickTarget
        return
      }

      this.resetStack(isContext)
      // clear the context menu on click
      if (!isContext) {
        this.resetStack(true)
      }
    }

    if (!this.isEditing) {
      return
    }

    if (isResourceClick && this.isItemAlreadyInStack(resourceStackItem.iri, isContext) && currentTarget.value) {
      return
    }

    // the last click target is not a resource and finished the chain
    if (!isResourceClick) {
      currentTarget.value = null
      return
    }

    this.insertResourceStackItem(resourceStackItem as ResourceStackItem, isContext)
    currentTarget.value = clickTarget
  }

  // todo: test checking and inserting at correct index
  private insertResourceStackItem (resourceStackItem: ResourceStackItem, isContext?: boolean) {
    const stack = isContext ? this.contextResourceStack : this.currentResourceStack
    const iris = this.resourcesStore.findAllPublishableIris(resourceStackItem.iri)
    const insertAtIndex = stack.value.findIndex((existingStackItem) => {
      const existingItemChildren = existingStackItem.childIris.value
      if (!existingItemChildren) {
        return false
      }
      return existingItemChildren.some((r: string) => iris.includes(r))
    })
    insertAtIndex === -1 ? stack.value.push(resourceStackItem) : stack.value.splice(insertAtIndex, 0, resourceStackItem)
  }

  public redrawFocus () {
    if (!this.focusProxy) {
      return
    }
    // @ts-ignore-next-line
    this.focusProxy.redraw()
  }

  private createFocusComponent () {
    this.removeFocusComponent()
    const stackItem = this.currentStackItem.value
    if (!this.currentIri || !stackItem) {
      return
    }

    this.focusComponent = createApp(ComponentFocus, {
      iri: this.currentIri,
      domElements: stackItem.domElements
    })

    this.focusWrapper = document.createElement('div')
    document.body.appendChild(this.focusWrapper)

    this.focusProxy = this.focusComponent.mount(this.focusWrapper)
  }

  private removeFocusComponent () {
    if (this.focusComponent) {
      const toUnmount = this.focusComponent
      this.focusComponent = undefined
      this.focusProxy = undefined
      toUnmount.unmount()
    }
    if (this.focusWrapper) {
      const toRemove = this.focusWrapper
      this.focusWrapper = undefined
      toRemove.remove()
    }
  }

  private scrollIntoView () {
    let element: undefined|HTMLElement
    let elementOutOfView = false
    const stackItem = this.currentStackItem.value
    if (!stackItem) {
      return
    }

    for (const elCandidate of stackItem.domElements.value) {
      if (elCandidate.nodeType === Node.ELEMENT_NODE) {
        if (!element) {
          element = elCandidate
        }

        if (this.isElementOutsideViewport(element)) {
          elementOutOfView = true
        }
        if (elementOutOfView && element) {
          break
        }
      }
    }

    if (!element || !elementOutOfView) {
      return
    }
    const y = element.getBoundingClientRect().top + window.scrollY - this.yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  private isElementOutsideViewport (el: HTMLElement) {
    const { top, left, bottom, right } = el.getBoundingClientRect()
    const { innerHeight, innerWidth } = window
    return top < this.yOffset || left < 0 || bottom > innerHeight || right > innerWidth
  }

  private listenEditModeChange (isEditing: boolean) {
    if (!isEditing) {
      // if we reset the stack then the resource manager disappears and no item/tabs selected immediately
      this.showManager.value = false
      // can clear the context menu stack though
      this.resetStack(true)
    }
  }

  private listenCurrentIri (newIri: string|undefined, oldIri: string|undefined) {
    if (newIri && oldIri) {
      if (this.resourcesStore.isIriPublishableEquivalent(oldIri, newIri)) {
        return
      }
    }
    this.resetResourceManagerVars()
  }

  private resetResourceManagerVars () {
    this.forcePublishedVersion.value = undefined
    this.resourceManagerState.value = {}
  }

  private isItemAlreadyInStack (iri: string, isContext?: boolean): boolean {
    const stack = isContext ? this.contextResourceStack : this.currentResourceStack
    return !!stack.value.find(el => el.iri === iri)
  }

  private get isEditing () {
    return this.adminStore.state.isEditing
  }

  private get adminStore () {
    return this.adminStoreDefinition.useStore()
  }

  private get resourcesStore () {
    return this.resourcesStoreDefinition.useStore()
  }
}