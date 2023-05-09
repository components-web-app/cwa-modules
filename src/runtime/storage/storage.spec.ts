import { describe, vi, test, expect } from 'vitest'
import { SpyFn } from 'tinyspy'
import { Storage } from './storage'
import { MercureStore } from './stores/mercure/mercure-store'
import { ResourcesStore } from './stores/resources/resources-store'
import { FetcherStore } from './stores/fetcher/fetcher-store'
import { ApiDocumentationStore } from './stores/api-documentation/api-documentation-store'
import { AuthStore } from './stores/auth/auth-store'

type TestStore = { name: string }
type StoreMock = SpyFn<[], TestStore>

vi.mock('./stores/resources/resources-store', () => {
  return {
    ResourcesStore: vi.fn<[], TestStore>(() => ({ name: 'ResourcesStore' }))
  }
})
vi.mock('./stores/fetcher/fetcher-store', () => {
  return {
    FetcherStore: vi.fn<[], TestStore>(() => ({ name: 'FetcherStore' }))
  }
})
vi.mock('./stores/mercure/mercure-store', () => {
  return {
    MercureStore: vi.fn<[], TestStore>(() => ({ name: 'MercureStore' }))
  }
})
vi.mock('./stores/api-documentation/api-documentation-store', () => {
  return {
    ApiDocumentationStore: vi.fn<[], TestStore>(() => ({ name: 'ApiDocumentationStore' }))
  }
})

vi.mock('./stores/auth/auth-store', () => {
  return {
    AuthStore: vi.fn<[], TestStore>(() => ({ name: 'AuthStore' }))
  }
})

describe('Storage is initialised properly', () => {
  const storeName = 'mystore'
  test('Stores are initialised', () => {
    const storage = new Storage(storeName)

    // @ts-ignore
    const resourcesStoreMock:StoreMock = ResourcesStore
    // @ts-ignore
    const fetcherStoreMock:StoreMock = FetcherStore
    // @ts-ignore
    const mercureStoreMock:StoreMock = MercureStore
    // @ts-ignore
    const apiDocumentationStoreMock:StoreMock = ApiDocumentationStore
    // @ts-ignore
    const authStoreMock:StoreMock = AuthStore

    expect(resourcesStoreMock).toBeCalledWith(storeName)
    expect(fetcherStoreMock).toBeCalledWith(storeName)
    expect(mercureStoreMock).toBeCalledWith(storeName)
    expect(apiDocumentationStoreMock).toBeCalledWith(storeName)
    expect(authStoreMock).toBeCalledWith(storeName)

    expect(storage.stores).toStrictEqual({
      resources: resourcesStoreMock.mock.results[0].value,
      fetcher: fetcherStoreMock.mock.results[0].value,
      mercure: mercureStoreMock.mock.results[0].value,
      apiDocumentation: apiDocumentationStoreMock.mock.results[0].value,
      auth: authStoreMock.mock.results[0].value
    })
  })
})
