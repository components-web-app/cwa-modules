import Vue from 'vue'
import consola from 'consola'
import { CancelTokenSource } from 'axios'
import type { CwaOptions } from '../'
import ApiError from '../inc/api-error'
import AxiosErrorParser from '../utils/AxiosErrorParser'
import { cwaRouteDisabled } from '../utils'
import MissingDataError from '../inc/missing-data-error'
import { Storage } from './storage'
import { Fetcher } from './fetcher'
import {
  API_EVENTS,
  PublishableToggledEvent,
  COMPONENT_MANAGER_EVENTS
} from './events'
import Forms from './forms'

interface PatchRequest {
  endpoint: string
  tokenSource: CancelTokenSource
}
export default class Cwa {
  public ctx: any
  public options: CwaOptions
  public fetcher: Fetcher
  public forms: Forms
  public $storage: Storage
  public $state
  public $eventBus
  private patchRequests: Array<PatchRequest> = []

  constructor(ctx, options) {
    if (options.allowUnauthorizedTls && ctx.isDev) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    this.$eventBus = new Vue()

    this.ctx = ctx

    this.options = options

    /**
     * init storage
     */
    options.initialState = {}
    const storage = new Storage(ctx, options)
    this.$storage = storage
    this.$state = storage.state

    /**
     * init fetcher
     */
    this.fetcher = new Fetcher(
      {
        $axios: this.ctx.$axios,
        error: this.ctx.error,
        apiUrl: this.ctx.$config.API_URL_BROWSER || this.ctx.$config.API_URL,
        storage,
        router: this.ctx.app.router,
        redirect: this.ctx.redirect
      },
      {
        fetchConcurrency: this.options.fetchConcurrency
      }
    )

    /**
     * init forms
     */
    this.forms = new Forms({
      $axios: this.ctx.$axios,
      store: this.ctx.store,
      vuexNamespace: this.options.vuex.namespace
    })

    if (process.client) {
      this.initMercure()
    }
  }

  public get isEditMode() {
    return this.isAdmin && this.$storage.getState('editMode')
  }

  public setEditMode(enabled: boolean) {
    this.$storage.setState('editMode', enabled)
  }

  initMercure(force: boolean = false) {
    ;(force || !cwaRouteDisabled(this.ctx.route)) &&
      this.fetcher.initMercure(this.$state.resources.current)
  }

  public fetchRoute(path) {
    return this.fetcher.fetchRoute(path)
  }

  /**
   * Storage
   */
  get resourcesOutdated() {
    return this.$storage.areResourcesOutdated()
  }

  get resources() {
    return this.$state.resources.current
  }

  // find a resource from local storage or fetch from API
  async findResource(iri) {
    return this.getResource(iri) || (await this.refreshResource(iri))
  }

  findDraftIri(iri: string) {
    return this.$storage.findDraftIri(iri)
  }

  getPublishableIri(iri: string) {
    // is it draft and mapped to show published?
    if (this.$storage.isIriMappedToPublished(iri)) {
      return this.$storage.findPublishedIri(iri) || iri
    }
    return iri
  }

  getPublishedResource(resource: { publishedResource?: string }) {
    const publishedIri = resource?.publishedResource
    if (!publishedIri) {
      return null
    }
    return this.$storage.getResource(publishedIri)
  }

  getDraftResource(resource: { draftResource?: string }) {
    const draftIri = resource?.draftResource
    if (!draftIri) {
      return null
    }
    return this.$storage.getResource(draftIri)
  }

  getResource(iri: string) {
    return this.$storage.getResource(iri)
  }

  get layout() {
    return this.$storage.getState('layout')
  }

  get loadingRoute() {
    return this.$state[Fetcher.loadingRouteKey]
  }

  withError(route, err) {
    this.$storage.setState(
      'error',
      `An error occurred while requesting ${route.path}`
    )
    consola.error(err)
  }

  mergeNewResources() {
    this.$storage.mergeNewResources()
  }

  saveResource(resource: any, category?: string, isNew?: boolean) {
    this.$storage.setResource({ category, isNew, resource })
  }

  // isResourceSaved(resource: object, iri: string) {
  //   const saved = this.$state.resources.current[
  //     this.$storage.getCategoryFromIri(iri)
  //   ][iri]
  //   return JSON.stringify(resource) === JSON.stringify(saved)
  // }

  /**
   * API Requests
   */
  private handleRequestError(error) {
    if (error instanceof ApiError) {
      throw error
    }
    const axiosError = AxiosErrorParser(error)
    const exception = new ApiError(
      axiosError.message,
      axiosError.statusCode,
      axiosError.endpoint,
      axiosError.violations,
      this.ctx.$axios.isCancel(error)
    )
    this.$eventBus.$emit(API_EVENTS.error, exception)
    throw exception
  }

  async getApiDocumentation() {
    if (!this.$state.docsUrl) {
      throw new MissingDataError(
        'Cannot fetch API documentation. The docs URL has not been saved'
      )
    }
    const resolved = await Promise.all([
      this.ctx.$axios.$get(
        this.ctx.$config.API_URL_BROWSER || this.ctx.$config.API_URL
      ),
      this.ctx.$axios.$get(this.$state.docsUrl)
    ])
    return {
      entrypoint: resolved[0],
      docs: resolved[1]
    }
  }

  private async initNewRequest(
    requestFn: Function,
    { eventName, eventParams }: { eventName: string; eventParams: any },
    category: string,
    postUpdate?: Function
  ) {
    this.increaseMercurePendingProcessCount()
    try {
      let resource = await requestFn()
      // if not a successful delete request
      if (resource?.status !== 204 && resource?.['@id']) {
        resource = this.processResource(resource, category)
      }
      if (postUpdate) {
        const newResource = await postUpdate(resource)
        if (newResource) {
          resource = newResource
        }
      }
      return resource
    } catch (error) {
      this.handleRequestError(error)
    } finally {
      this.$eventBus.$emit(eventName, eventParams)
      this.decreaseMercurePendingProcessCount()
    }
  }

  private processResource(resource: any, category?: string) {
    this.saveResource(resource, category)
    return resource
  }

  private async refreshEndpointsArray(
    refreshEndpoints: string[],
    afterPromise: Promise<any> = null
  ) {
    this.increaseMercurePendingProcessCount(refreshEndpoints.length)
    if (afterPromise) {
      await afterPromise
    }
    const promises = []
    for (const refreshEndpoint of refreshEndpoints) {
      promises.push(
        this.ctx.$axios.$get(refreshEndpoint).then((refreshResource) => {
          this.saveResource(refreshResource, null)
          this.decreaseMercurePendingProcessCount()
          this.$eventBus.$emit(API_EVENTS.refreshed, refreshEndpoint)
          consola.debug('Resource refreshed', refreshResource)
        })
      )
    }
    return Promise.all(promises)
  }

  async createResource(
    endpoint: string,
    data: any,
    category?: string,
    refreshEndpoints?: string[]
  ) {
    return await this.initNewRequest(
      async () => {
        const refreshEndpointsSize = refreshEndpoints
          ? refreshEndpoints.length
          : 0
        const postResource = await this.ctx.$axios.$post(endpoint, data)
        if (refreshEndpointsSize) {
          await this.refreshEndpointsArray(refreshEndpoints, postResource)
        }
        this.saveResource(postResource)
        return postResource
      },
      { eventName: API_EVENTS.created, eventParams: endpoint },
      category
    )
  }

  async refreshResources(endpoints: string[]) {
    const promises = []
    endpoints.forEach((endpoint) => {
      promises.push(this.refreshResource(endpoint))
    })
    return await Promise.all(promises)
  }

  async refreshResource(
    endpoint: string,
    category?: string,
    cancelTokenSource?: CancelTokenSource
  ) {
    return await this.initNewRequest(
      async () => {
        const resource = await this.fetcher.fetchItem({
          path: endpoint,
          cancelTokenSource
        })
        this.saveResource(resource)
        return resource
      },
      { eventName: API_EVENTS.refreshed, eventParams: endpoint },
      category
    )
  }

  cancelPendingPatchRequest(
    endpoint: string,
    requestComplete: boolean = false
  ) {
    this.patchRequests = this.patchRequests.filter((pr) => {
      if (pr.endpoint !== endpoint) {
        return true
      }
      if (!requestComplete) {
        pr.tokenSource.cancel('Cancelled due to another pending request')
      }
      return false
    })
  }

  async updateResource(
    endpoint: string,
    data: any,
    category?: string,
    refreshEndpoints?: string[]
  ) {
    if (endpoint.endsWith('/new')) {
      this.$storage.setResource({
        resource: Object.assign(
          { '@id': endpoint },
          this.$storage.getResource(endpoint),
          data
        )
      })
      return
    }
    let patchEndpoint = endpoint
    const draftIri = this.findDraftIri(endpoint)
    const forcedPublishedUpdate =
      draftIri && this.getPublishableIri(draftIri) !== draftIri

    const requestFn = async () => {
      const tokenSource = this.ctx.$axios.CancelToken.source()
      if (forcedPublishedUpdate) {
        patchEndpoint += '?published=true'
      }
      this.cancelPendingPatchRequest(patchEndpoint, false)
      this.patchRequests.push({
        endpoint: patchEndpoint,
        tokenSource
      })
      const patchPromise = this.ctx.$axios.$patch(patchEndpoint, data, {
        headers: {
          'Content-Type': 'application/merge-patch+json'
        },
        cancelToken: tokenSource.token
      })
      this.cancelPendingPatchRequest(patchEndpoint, true)
      return await patchPromise
    }
    const postUpdateHandler = async (newResource) => {
      // we need to do this after the new entity is saved
      // otherwise a new position may reference a resource/component
      // that has not been saved locally yet. So we do it here instead
      // of in the request function
      if (refreshEndpoints && refreshEndpoints.length) {
        await this.refreshEndpointsArray(refreshEndpoints)
      }

      if (forcedPublishedUpdate) {
        return
      }

      // Handle draft mapping
      if (newResource._metadata.published) {
        const draftIri = this.$storage.findDraftIri(newResource['@id'])
        if (draftIri) {
          const iriObj = {
            publishedIri: newResource['@id'],
            draftIri: null
          }
          this.$storage.mapDraftResource(iriObj)
          this.$eventBus.$emit(API_EVENTS.newDraft, iriObj)
          Vue.nextTick(() => {
            this.$storage.deleteResource(draftIri)
          })
        }
      } else if (newResource['@id'] !== endpoint) {
        // returned a draft that is not the same as the endpoint we posted to
        // a new draft to relate to the published resource
        const publishedIri = endpoint
        const draftIri = newResource['@id']
        const iriObj = {
          publishedIri,
          draftIri
        }
        this.$storage.mapDraftResource(iriObj)
        this.$eventBus.$emit(API_EVENTS.newDraft, iriObj)
      }
    }
    return await this.initNewRequest(
      requestFn,
      { eventName: API_EVENTS.updated, eventParams: endpoint },
      category,
      postUpdateHandler
    )
  }

  async deleteResource(id: string) {
    await this.initNewRequest(
      async () => {
        return await this.ctx.$axios.delete(id)
      },
      { eventName: API_EVENTS.deleted, eventParams: id },
      null,
      null
    )
    this.$storage.deleteResource(id)
  }

  increaseMercurePendingProcessCount(requestCount: number = 1) {
    this.$storage.increaseMercurePendingProcessCount(requestCount)
  }

  decreaseMercurePendingProcessCount(requestCount: number = 1) {
    this.$storage.decreaseMercurePendingProcessCount(requestCount)
  }

  /**
   * User / security
   */
  get isAdmin() {
    return this.userHasRole('ROLE_ADMIN')
  }

  get user() {
    return this.ctx.$auth.user
  }

  get currentRoute() {
    return this.$storage.currentRoute
  }

  get currentPageIri() {
    return this.$storage.currentPageIri || this.fetcher.loadedRoute || null
  }

  userHasRole(role) {
    return this.user ? this.user.roles.includes(role) : false
  }

  togglePublishable(draftIri: string, showPublished: boolean) {
    this.$storage.togglePublishable(draftIri, showPublished)
    const publishableIri = this.getPublishableIri(draftIri)
    this.$eventBus.$emit(COMPONENT_MANAGER_EVENTS.publishableToggled, {
      draftIri,
      publishableIri,
      showPublished,
      publishedIri: this.$storage.findPublishedIri(draftIri)
    } as PublishableToggledEvent)
    return publishableIri
  }

  isResourceSame(resource1, resource2): boolean {
    return this.$storage.isResourceSame(resource1, resource2)
  }
}
