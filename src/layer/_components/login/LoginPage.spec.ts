// @vitest-environment nuxt
import { describe, expect, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { mockComponent } from 'nuxt-vitest/utils'
import LoginPage from './LoginPage.vue'

vi.mock('../../../runtime/templates/components/main/Logo.vue', () => ({
  default: {
    name: 'CwaLogo'
  }
}))

interface ILoginMeta {
  submitButtonText: string;
  submitting: boolean;
  error?: string;
  slotContent?: string;
}

function createWrapper ({
  submitButtonText,
  submitting,
  error = '',
  slotContent = ''
}: ILoginMeta) {
  mockComponent('CwaUtilsAlertWarning', () => ({
    name: 'CwaUtilsAlertWarning'
  }))

  return shallowMount(LoginPage, {
    props: {
      submitButtonText,
      submitting,
      error
    },
    slots: {
      default: slotContent
    },
    global: {
      renderStubDefaultSlot: true
    }
  })
}

describe('LoginPage', () => {
  describe('emits', () => {
    test('should emit on form submit', async () => {
      const wrapper = createWrapper({
        submitting: true,
        submitButtonText: 'Submit'
      })
      const form = wrapper.find('form')

      await form.trigger('submit')

      expect(wrapper.emitted('submit')?.length).toEqual(1)
    })
  })

  describe('snapshots', () => {
    test('should match snapshot IF form is submitting', () => {
      const wrapper = createWrapper({
        submitting: true,
        submitButtonText: 'Submit',
        slotContent: '<div>Test form content</div>'
      })

      expect(wrapper.element).toMatchSnapshot()
    })

    test('should match snapshot IF form has errors', () => {
      const wrapper = createWrapper({
        submitting: false,
        submitButtonText: 'Submit',
        error: 'Something went wrong, try submitting form again',
        slotContent: '<div>Test form content</div>'
      })

      expect(wrapper.element).toMatchSnapshot()
    })
  })
})