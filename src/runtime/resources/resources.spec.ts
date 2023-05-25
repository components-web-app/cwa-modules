import { describe, test, expect } from 'vitest'
import { computed } from 'vue'
import { Resources } from './resources'
import { CwaResourceApiStatuses } from '#cwa/runtime/storage/stores/resources/state'

function createResources () {
  const mockResourcesStore = {
    useStore () {
      return {
        current: {
          currentIds: [] as string[],
          byId: {}
        }
      }
    }
  }

  const mockFetcherStore = {
    useStore () {
      return {
        primaryFetch: {
          fetchingToken: '123' as string | null
        },
        fetches: {},
        resolvedSuccessFetchStatus: computed(() => ({ path: '/test', isPrimary: true, resources: ['1', '2'] }))
      }
    }
  }

  // @ts-ignore
  const resources = new Resources(mockResourcesStore, mockFetcherStore)

  return { resources, resourcesStore: mockResourcesStore, fetcherStore: mockFetcherStore }
}

describe('Resources', () => {
  describe('current ids', () => {
    test('should return current ids BASED on resources store', () => {
      const { resources, resourcesStore } = createResources()
      const mockIds = ['1', '2', '3']

      resourcesStore.useStore = () => ({
        current: {
          byId: {},
          currentIds: mockIds
        }
      })

      expect(resources.currentIds).toEqual(mockIds)
    })
  })

  describe('get resource', () => {
    test('should return resource BASED on its id', () => {
      const { resources, resourcesStore } = createResources()
      const mockId = 'mockedId'
      const mockResource = { test: true }

      resourcesStore.useStore = () => ({
        current: {
          byId: {
            [mockId]: mockResource
          },
          currentIds: []
        }
      })

      expect(resources.getResource(mockId).value).toEqual(mockResource)
    })

    test('should return nothing IF resource with requested id does not exist', () => {
      const { resources, resourcesStore } = createResources()
      const mockId = 'mockedId'

      resourcesStore.useStore = () => ({
        current: {
          byId: {},
          currentIds: []
        }
      })

      expect(resources.getResource(mockId).value).toBeUndefined()
    })
  })

  describe('current resources', () => {
    test('should return formatted resources', () => {
      const { resources, resourcesStore } = createResources()
      const resourceA = { id: 'a', otherData: {} }
      const resourceB = { id: 'b', otherData: {} }
      const resourceC = { id: 'c', otherData: {} }

      resourcesStore.useStore = () => ({
        current: {
          byId: {
            a: resourceA,
            b: resourceB,
            c: resourceC
          },
          currentIds: ['a', 'b', 'c']
        }
      })

      expect(resources.currentResources).toEqual({
        a: resourceA,
        b: resourceB,
        c: resourceC
      })
    })
  })

  describe('page load progress', () => {
    test('should return default progress IF token is not present', () => {
      const { resources, fetcherStore } = createResources()
      const initialStoreState = fetcherStore.useStore()

      fetcherStore.useStore = () => ({
        ...initialStoreState,
        primaryFetch: {
          fetchingToken: null
        }
      })

      expect(resources.pageLoadProgress.value).toEqual({
        resources: [],
        total: 0,
        complete: 0,
        percent: 100
      })
    })

    test('should return progress BASED on resources api statuses', () => {
      const { resources, resourcesStore, fetcherStore } = createResources()
      const initialFetchState = fetcherStore.useStore()
      const initialResourcesState = resourcesStore.useStore()

      fetcherStore.useStore = () => ({
        ...initialFetchState,
        fetches: {
          [initialFetchState.primaryFetch.fetchingToken as string]: {
            path: '/_/routes/mock/route'
          }
        }
      })

      resourcesStore.useStore = () => ({
        ...initialResourcesState,
        current: {
          currentIds: [],
          byId: {
            '/_/routes/mock/route': {
              data: {
                value: {
                  pageData: 'mockData'
                }
              },
              apiState: {
                status: CwaResourceApiStatuses.SUCCESS
              }
            }
          }
        }
      })

      expect(resources.pageLoadProgress.value).toEqual({
        resources: [undefined, undefined, '/_/routes/mock/route', 'mockData'],
        total: 4,
        complete: 2,
        percent: 50
      })
    })
  })
})
