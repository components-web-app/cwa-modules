import { computed, ComputedRef } from 'vue'
import { ResourcesStore } from '../resources/resources-store'
import { CwaResourceApiStatuses } from '../resources/state'
import { CwaResourceTypes } from '../../../resources/resource-utils'
import { CwaFetcherStateInterface } from './state'

export interface CwaFetcherGettersInterface {
  isSuccessfulPrimaryFetchValid: ComputedRef<boolean>
  primaryFetchPath: ComputedRef<string|undefined>
  isFetchChainComplete: ComputedRef<(token: string, onlySuccessful?: boolean) => boolean|undefined>
  isCurrentFetchingToken: ComputedRef<(token: string) => boolean|undefined>
}

export default function (fetcherState: CwaFetcherStateInterface, resourcesStoreDefinition: ResourcesStore): CwaFetcherGettersInterface {
  function validFetchStatus (token: string) {
    const fetchStatus = fetcherState.fetches[token]
    if (!fetchStatus) {
      return
    }

    // validate we have resources
    const resources = fetchStatus.resources
    if (!resources.length) {
      return
    }

    // validate the manifest status has resources (empty array is ok) and no errors on the manifest fetch - not in progress I guess...
    if (fetchStatus.manifest && fetchStatus.manifest.resources === undefined && fetchStatus.manifest.error === undefined) {
      return
    }

    return fetchStatus
  }

  const primaryFetchPath = computed(() => {
    const primaryFetchToken = fetcherState.primaryFetch.fetchingToken || fetcherState.primaryFetch.successToken
    if (!primaryFetchToken) {
      return
    }
    const fetchStatus = fetcherState.fetches[primaryFetchToken]
    return fetchStatus.path
  })
  return {
    primaryFetchPath,
    isSuccessfulPrimaryFetchValid: computed(() => {
      if (!fetcherState.primaryFetch.successToken) {
        return false
      }

      const fetchStatus = validFetchStatus(fetcherState.primaryFetch.successToken)
      if (!fetchStatus) {
        return false
      }

      const resourcesStore = resourcesStoreDefinition.useStore()

      // can check to ensure the main fetch path is successful
      const resourceData = resourcesStore.current.byId[fetchStatus.path]
      // Any errors for the primary resource should result in a re-fetch. In progress handled below
      if (!resourceData || resourceData.apiState.status === CwaResourceApiStatuses.ERROR) {
        return false
      }

      for (const resource of fetchStatus.resources) {
        const resourceData = resourcesStore.current.byId[resource]
        if (!resourceData) {
          throw new Error(`The resource '${resource}' does not exist but is defined in the fetch chain with token '${fetcherState.primaryFetch.successToken}'`)
        }

        if (resourceData.apiState.status === CwaResourceApiStatuses.IN_PROGRESS) {
          return false
        }

        // Some errored results still class as successful. In fact, only server errors are really unsuccessful and would warrant a re-fetch
        if (resourceData.apiState.status === CwaResourceApiStatuses.ERROR) {
          const lastStatusCode = resourceData.apiState.error?.statusCode
          if ((!lastStatusCode || lastStatusCode >= 500)) {
            return false
          }
          continue
        }

        // component positions can be dynamic and different depending on the path
        if (resourceData.data['@type'] === CwaResourceTypes.COMPONENT_POSITION && resourceData.apiState.headers?.path !== primaryFetchPath.value) {
          return false
        }
      }

      return true
    }),
    isFetchChainComplete: computed(() => {
      return (token: string) => {
        const fetchStatus = validFetchStatus(token)
        if (!fetchStatus) {
          return false
        }

        const resourcesStore = resourcesStoreDefinition.useStore()

        for (const resource of fetchStatus.resources) {
          const resourceData = resourcesStore.current.byId[resource]
          if (!resourceData) {
            throw new Error(`The resource '${resource}' does not exist but is defined in the fetch chain with token '${token}'`)
          }

          if (resourceData.apiState.status === CwaResourceApiStatuses.IN_PROGRESS) {
            return false
          }
        }
        return true
      }
    }),
    isCurrentFetchingToken: computed(() => {
      return (token: string) => {
        const fetchStatus = fetcherState.fetches[token]
        if (!fetchStatus) {
          throw new Error(`Failed to check if the token '${token}' is current. It does not exist.`)
        }
        // todo: test
        if (fetchStatus.abort) {
          return false
        }
        return !fetchStatus.isPrimary || token === fetcherState.primaryFetch.fetchingToken
      }
    })
  }
}
