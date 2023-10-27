import { describe, expect, vi, test } from 'vitest'
import { ref } from 'vue'
import * as cwaComposable from '#cwa/runtime/composables/cwa'
import * as cwaResourceManageable from '#cwa/runtime/composables/cwa-resource-manageable'
import { useCwaResource } from '#cwa/runtime/composables/cwa-resource'

vi.mock('vue', async () => {
  const mod = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...mod,
    onMounted: vi.fn(fn => fn())
  }
})

describe('CWA resources composable', () => {
  const mockCwa = {
    admin: {
      eventBus: {
        emit: vi.fn()
      }
    },
    resources: {
      getResource: vi.fn()
    }
  }
  const mockManager = { mock: 'manager' }

  vi.spyOn(cwaComposable, 'useCwa').mockImplementation(() => mockCwa)

  test('should return an object with manager IF no disabling option is provided', () => {
    const spy = vi.spyOn(cwaResourceManageable, 'useCwaResourceManageable').mockImplementation(() => mockManager)
    const mockIri = 'mock-iri'
    const styles = 'styles'
    const result = useCwaResource(mockIri, { styles })

    expect(result.manager).toEqual(mockManager)
    expect(spy).toHaveBeenCalledWith(mockIri, { styles })
  })

  test('should return an object with manager as undefined IF disabling option is provided', () => {
    const spy = vi.spyOn(cwaResourceManageable, 'useCwaResourceManageable').mockImplementation(() => mockManager)
    const mockIri = 'mock-iri'
    const result = useCwaResource(mockIri, { manager: { disabled: true } })

    expect(result).toHaveProperty('manager')
    expect(result.manager).toBeUndefined()
    expect(spy).not.toHaveBeenCalled()
  })

  test('should emit an eventbus event on mounted if manager is disabled', () => {
    vi.spyOn(cwaResourceManageable, 'useCwaResourceManageable').mockImplementation(() => mockManager)
    const mockIri = ref('mock-iri')

    useCwaResource(mockIri, { manager: { disabled: true } })

    expect(mockCwa.admin.eventBus.emit).toHaveBeenCalledWith('componentMounted', mockIri.value)
  })

  test('should return object containing function to get resource by iri provided into composable', () => {
    vi.spyOn(cwaResourceManageable, 'useCwaResourceManageable').mockImplementation(() => mockManager)

    const mockIri = ref('mock-iri')
    const mockResource = ref({ mock: 'resource' })

    const result = useCwaResource(mockIri)

    mockCwa.resources.getResource.mockReturnValueOnce(mockResource)

    expect(result.getResource).toBeDefined()
    expect(result.getResource().value).toEqual(mockResource.value)
    expect(mockCwa.resources.getResource).toHaveBeenCalledWith(mockIri.value)
  })
})