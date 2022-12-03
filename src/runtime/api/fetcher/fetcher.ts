import bluebird from 'bluebird'
import { $fetch, createFetchError, FetchContext, FetchError, FetchResponse } from 'ohmyfetch'
import { RouteLocationNormalizedLoaded } from 'vue-router'
import consola from 'consola'
import { CwaResourcesInterface, ResourcesStore } from '../../storage/stores/resources/resources-store'
import { CwaResource, CwaResourceTypes, getResourceTypeFromIri } from '../../resource-types'
import Mercure from '../mercure'
import ApiDocumentation from '../api-documentation'
import { FetcherStore } from '../../storage/stores/fetcher/fetcher-store'
import FetchStatus from './fetch-status'
import preloadHeaders from './preload-headers'

interface FetchEventInterface {
  path: string
  preload?: Array<string>
}

type TypeToNestedPropertiesMap = {
  [T in CwaResourceTypes]: Array<string>;
}

export const resourceTypeToNestedResourceProperties: TypeToNestedPropertiesMap = {
  [CwaResourceTypes.ROUTE]: ['pageData', 'page'],
  [CwaResourceTypes.PAGE]: ['layout', 'componentGroups'],
  [CwaResourceTypes.PAGE_DATA]: ['page'],
  [CwaResourceTypes.LAYOUT]: ['componentGroups'],
  [CwaResourceTypes.COMPONENT_GROUP]: ['componentPositions'],
  [CwaResourceTypes.COMPONENT_POSITION]: ['component'],
  [CwaResourceTypes.COMPONENT]: ['componentGroups']
}

export interface CwaFetcherAsyncResponse extends Promise<FetchResponse<CwaResource|any>> {}

export class Fetcher {
  private readonly apiUrl: string
  private readonly fetcherStoreDefinition: FetcherStore
  private readonly resourcesStoreDefinition: ResourcesStore
  private readonly currentRoute: RouteLocationNormalizedLoaded
  private readonly mercure: Mercure
  private readonly apiDocumentation: ApiDocumentation
  private readonly fetchStatus: FetchStatus

  constructor (apiUrl: string, fetcherStore: FetcherStore, resourcesStore: ResourcesStore, currentRoute: RouteLocationNormalizedLoaded) {
    this.apiUrl = apiUrl
    this.fetcherStoreDefinition = fetcherStore
    this.resourcesStoreDefinition = resourcesStore
    this.currentRoute = currentRoute

    this.mercure = new Mercure()
    this.apiDocumentation = new ApiDocumentation()
    this.fetchStatus = new FetchStatus(this.fetcherStoreDefinition)
  }

  /**
   * Public interfaces for fetching
   */

  public async fetchRoute (path: string): Promise<CwaFetcherAsyncResponse|undefined> {
    const startFetch = this.fetchStatus.startFetch(path)
    if (startFetch !== true) {
      if (startFetch !== false) {
        return startFetch
      }
      return
    }

    // we do not need to wait for this, it will fetch everything from the manifest while we traverse the fetches
    // thereby not relying on this manifest to resolve everything, but an enhancement to fetch everything we can in a batch
    this.fetchRoutesManifest(path).then((endpoints) => {
      if (endpoints) {
        consola.success('Route manifest fetch complete')
        consola.trace(endpoints)
      } else {
        consola.warn('Route manifest fetch did not resolve any endpoints')
      }
    })

    let data: CwaResource|undefined
    try {
      const response = await this.fetchAndSaveResource({
        path: `/_/routes/${path}`
      })
      if (!response) {
        return
      }
      data = response._data
      return response
    } finally {
      // todo: do we need to handle if it was a redirect from prop data?.redirectPath
      this.fetchStatus.finishFetch({
        path,
        success: data !== undefined,
        pageIri: data?.pageData || data?.page
      })
    }
  }

  private async fetchRoutesManifest (path: string): Promise<Array<string>|undefined> {
    let response: FetchResponse<any>|undefined
    try {
      response = await this.doFetch({ path: `/_/routes_manifest/${path}` })
      if (!response) {
        return
      }
      const manifestResources = response._data.resource_iris
      await this.fetchBatch({ paths: manifestResources })
      return manifestResources
    } catch (error) {
      // noop
    }
  }

  public async fetchPage (pageIri: string): Promise<CwaFetcherAsyncResponse|undefined> {
    const startFetch = this.fetchStatus.startFetch(pageIri)
    if (startFetch !== true) {
      if (startFetch !== false) {
        return startFetch
      }
      return
    }

    let data: CwaResource|undefined
    try {
      const response = await this.fetchAndSaveResource({
        path: pageIri
      })
      if (!response) {
        return
      }
      data = response._data
      return response
    } finally {
      this.fetchStatus.finishFetch({
        path: pageIri,
        success: data !== undefined,
        pageIri
      })
    }

    this.fetchStatus.finishFetch({ path: pageIri, success: false, pageIri })
  }

  public async fetchAndSaveResource ({ path, preload }: FetchEventInterface): Promise<CwaFetcherAsyncResponse|undefined> {
    const startFetch = this.fetchStatus.startFetch(path)
    if (startFetch !== true) {
      if (startFetch !== false) {
        return startFetch
      }
      return
    }

    if (!preload) {
      preload = this.getPreloadHeadersForPath(path)
    }

    let response: FetchResponse<any>|undefined
    try {
      response = await this.doFetch({ path, preload })
    } catch (error) {
      if (error instanceof FetchError) {
        // 404 can be expected, components which are draft some users may not have access to, we can ignore 404s
        if (error.statusCode === 404) {
          return
        }
        // network request error
        if (!error.response) {
          console.error('[NETWORK ERROR]')
        }
        console.error(error.message, JSON.stringify(error))
      }
      // throw error
    }

    if (response?._data) {
      this.resourcesStore.saveResource({
        resource: response._data
      })
      await this.fetchNestedResources(response._data)
    }

    this.fetchStatus.finishFetch({ path, success: !!response?._data })
    return response
  }

  /**
   * Internal: fetching
   */
  private fetchBatch ({ paths }: { paths: Array<string> }): bluebird<(CwaFetcherAsyncResponse|undefined)[]> {
    return bluebird
      .map(
        paths,
        (path: string) => {
          return this.fetchAndSaveResource({ path })
        },
        { concurrency: 500 }
      )
  }

  private fetchNestedResources (resource: any): bluebird<(CwaFetcherAsyncResponse|undefined)[]>|undefined {
    // check resource type
    const type = getResourceTypeFromIri(resource['@id'])
    if (!type) {
      return
    }
    const nestedIris = []
    const nestedPropertiesToFetch = resourceTypeToNestedResourceProperties[type]
    for (const prop of nestedPropertiesToFetch) {
      const propIris = resource[prop]
      if (!propIris) {
        continue
      }
      if (Array.isArray(propIris)) {
        nestedIris.push(...propIris)
      } else {
        nestedIris.push(propIris)
      }
    }
    return this.fetchBatch({ paths: nestedIris })
  }

  private doFetch ({ path, preload }: FetchEventInterface): CwaFetcherAsyncResponse|undefined {
    // pass front-end query parameters to back-end as well
    const finalUrl = this.appendQueryToPath(path)

    // check if this endpoint is already being called in the current request batch
    const existingFetch = this.fetchStatus.getFetchingPathPromise(finalUrl)
    if (existingFetch) {
      return existingFetch
    }

    // Apply common required headers
    const requestHeaders = {
      path: this.fetchStatus.path,
      accept: 'application/ld+json,application/json'
    } as { path: string; accept: string; preload?: string }
    // Preload headers for Vulcain prefetching support
    if (preload) {
      requestHeaders.preload = preload.join(',')
    }

    // Fetch the endpoint
    const fetchPromise: CwaFetcherAsyncResponse = $fetch.raw<any>(finalUrl, {
      baseURL: this.apiUrl,
      onResponse: (context: FetchContext & { response: FetchResponse<CwaResource> }): Promise<void> | void => {
        const linkHeader = context.response.headers.get('link')
        if (linkHeader) {
          this.mercure.setMercureHubFromLinkHeader(linkHeader)
          this.apiDocumentation.setDocsPathFromLinkHeader(linkHeader)
        }
        return context.response._data
      },
      onRequestError (ctx: FetchContext & { error: Error }): Promise<void> | void {
        throw createFetchError<undefined>(ctx.request, ctx.error)
      }
    })
    this.fetchStatus.addEndpoint(finalUrl, fetchPromise)
    return fetchPromise
  }

  private appendQueryToPath (path: string): string {
    const queryObj = this.currentRoute.query
    if (!queryObj) {
      return path
    }
    const queryKeys = Object.keys(queryObj)
    if (!queryKeys.length) {
      return path
    }

    const queryString = queryKeys
      .map((key: string) => key + '=' + queryObj[key])
      .join('&')
    const delimiter = path.includes('?') ? '&' : '?'
    return `${path}${delimiter}${queryString}`
  }

  /**
   * Internal: getters
   */
  private get resourcesStore (): CwaResourcesInterface {
    return this.resourcesStoreDefinition.useStore()
  }

  private getPreloadHeadersForPath (path: string): Array<string>|undefined {
    const resourceType = getResourceTypeFromIri(path)
    if (!resourceType) {
      return
    }
    return preloadHeaders[resourceType]
  }
}
