import { afterEach, describe, expect, test, vi } from 'vitest'
import routeMiddleware from './route-middleware'

function createToRoute (cwa?: boolean|undefined) {
  return {
    name: '',
    path: '/',
    fullPath: '/',
    query: {},
    hash: '',
    matched: [],
    params: {},
    meta: {
      cwa
    },
    redirectedFrom: undefined
  }
}

describe('Test route middleware', () => {
  test('Test route middleware is enabled by default', () => {
    const toRoute = createToRoute()
    routeMiddleware(toRoute)
  })
  test('Test route middleware can be set to true', () => {
    const toRoute = createToRoute(true)
    routeMiddleware(toRoute)
  })
  test('Test route middleware can be disabled', () => {
    const toRoute = createToRoute(false)
    routeMiddleware(toRoute)
  })
})
