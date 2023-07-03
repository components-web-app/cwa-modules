import { getCurrentInstance, onBeforeUnmount, onMounted } from 'vue'
import logger from 'consola'
import ManageableComponent from '../admin/manageable-component'
import { CwaCurrentResourceInterface } from '../storage/stores/resources/state'
import { useCwa } from './cwa'

/**
 * @internal
 * @description Advanced usage - usually this composable will be initialised from useCwaResource where disableManager does not equal true. Primarily separated for the ComponentGroup component
 * @param iri
 */
export const useCwaResourceManageable = (iri?: string) => {
  const proxy = getCurrentInstance()?.proxy
  if (!proxy) {
    logger.error('Cannot initialise manager for resource. Instance is not defined')
    return
  }

  const manageableComponent = new ManageableComponent(proxy, useCwa())

  onMounted(() => {
    if (iri) {
      manageableComponent.init(iri)
    }
  })

  onBeforeUnmount(() => {
    manageableComponent.clear()
  })

  return {
    watcher: (resource: CwaCurrentResourceInterface) => {
      const iri = resource?.data?.['@id']
      iri && manageableComponent.init(iri)
    },
    manager: manageableComponent
  }
}
