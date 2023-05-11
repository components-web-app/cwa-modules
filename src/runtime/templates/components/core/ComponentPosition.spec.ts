import { describe, expect, test, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import * as cwa from '../../../composables/cwaComponent'
import ResourceLoader from './ResourceLoader.vue'
import ComponentPosition from './ComponentPosition.vue'

const mockComponentName = 'test'

function createWrapper () {
  // @ts-ignore
  vi.spyOn(cwa, 'useCwaResource').mockImplementation(() => ({
    value: {
      data: {
        component: mockComponentName
      }
    }
  }))

  return shallowMount(ComponentPosition, {
    props: {
      iri: mockComponentName
    }
  })
}

describe('ComponentPosition', () => {
  test('should display ResourceLoader component with componentIri', () => {
    const wrapper = createWrapper()

    expect(wrapper.findComponent(ResourceLoader)).toBeDefined()
    expect(wrapper.findComponent(ResourceLoader).props().iri).toEqual(mockComponentName)
    expect(wrapper.element).toMatchSnapshot()
  })
})