import { computed, reactive, watch } from 'vue'
import type { FetchError } from 'ofetch'
import { ResourcesStore } from '../storage/stores/resources/resources-store'
import CwaFetch from '../api/fetcher/cwa-fetch'
import FetchStatusManager from '../api/fetcher/fetch-status-manager'
import type {
  DeleteResourceEvent,
  SaveNewResourceEvent,
  SaveResourceEvent
} from '../storage/stores/resources/actions'
import type { ErrorStore } from '../storage/stores/error/error-store'
import type { CwaResource } from './resource-utils'
import type { CwaErrorEvent } from '../storage/stores/error/state'

export interface ApiResourceEvent {
  endpoint: string
  data: any
  source?: string
}

interface RequestHeaders extends Record<string, string> {}

interface RequestOptions {
  headers: RequestHeaders
  method: 'POST'|'PATCH'
}

export class ResourcesManager {
  private cwaFetch: CwaFetch
  private resourcesStoreDefinition: ResourcesStore
  private fetchStatusManager: FetchStatusManager
  private errorStoreDefinition: ErrorStore
  private requestsInProgress = reactive<{ [id: string]: ApiResourceEvent }>({})

  constructor (cwaFetch: CwaFetch, resourcesStoreDefinition: ResourcesStore, fetchStatusManager: FetchStatusManager, errorStoreDefinition: ErrorStore) {
    this.cwaFetch = cwaFetch
    this.resourcesStoreDefinition = resourcesStoreDefinition
    this.fetchStatusManager = fetchStatusManager
    this.errorStoreDefinition = errorStoreDefinition
  }

  public mergeNewResources () {
    return this.resourcesStore.mergeNewResources()
  }

  public get requestCount () {
    return computed(() => Object.values(this.requestsInProgress).length)
  }

  public getWaitForRequestPromise (endpoint: string, property: string, source?: string) {
    const hasRequestConflict = () => {
      if (!this.requestsInProgress.value) {
        return false
      }
      for (const apiResourceEvent of Object.values(this.requestsInProgress.value)) {
        if (apiResourceEvent.endpoint === endpoint && apiResourceEvent.data?.[property] && (!source || apiResourceEvent.source !== source)) {
          return true
        }
      }
      return false
    }
    return new Promise<void>((resolve) => {
      if (!hasRequestConflict()) {
        resolve()
        return
      }
      const unwatch = watch(this.requestsInProgress, () => {
        // look for current events processing which are not from the same source, but are for the same resource and property
        if (hasRequestConflict()) {
          return
        }
        unwatch()
        resolve()
      })
    })
  }

  public createResource (event: ApiResourceEvent) {
    const args = [
      event.endpoint,
      { ...this.requestOptions('POST'), body: event.data }
    ]
    return this.doResourceRequest(event, args)
  }

  public updateResource (event: ApiResourceEvent) {
    const args = [
      event.endpoint,
      { ...this.requestOptions('PATCH'), body: event.data }
    ]
    return this.doResourceRequest(event, args)
  }

  private async doResourceRequest (event: ApiResourceEvent, args: [ string, any ]) {
    if (event.source) {
      this.requestsInProgress[event.source] = args
    }
    try {
      const resource = await this.cwaFetch.fetch<CwaResource>(...args)
      this.saveResource({
        resource
      })
      return resource
    } catch (err) {
      this.errorStore.error(event, err as FetchError<any>)
    } finally {
      if (event.source) {
        delete this.requestsInProgress[event.source]
      }
    }
  }

  public errors (): CwaErrorEvent[] {
    return this.errorStore.getErrors
  }

  public hasErrors (): boolean {
    return this.errorStore.hasErrors
  }

  // @internal - just used in reset-password.ts - should be private and refactored for that use case
  public saveResource (event: SaveResourceEvent|SaveNewResourceEvent) {
    return this.resourcesStore.saveResource(event)
  }

  public deleteResource (event: DeleteResourceEvent) {
    return this.resourcesStore.deleteResource(event)
  }

  private requestOptions (method: 'POST'|'PATCH'): RequestOptions {
    const headers: {
      accept: string
      path?: string
      'Content-Type'?: string
    } = {
      accept: 'application/ld+json,application/json'
    }
    if (this.fetchStatusManager.primaryFetchPath) {
      headers.path = this.fetchStatusManager.primaryFetchPath
    }
    if (method === 'PATCH') {
      headers['Content-Type'] = 'application/merge-patch+json'
    }
    return {
      method,
      headers
    }
  }

  private get resourcesStore () {
    return this.resourcesStoreDefinition.useStore()
  }

  private get errorStore () {
    return this.errorStoreDefinition.useStore()
  }
}
