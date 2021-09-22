import Vue from 'vue'
import { FormView } from '@cwa/nuxt-module/core/vuex/FormsVuexModule'
import _debounce from 'lodash.debounce'
import consola from 'consola'
import FormViewPropsMixin from './FormViewPropsMixin'

export default Vue.extend({
  mixins: [FormViewPropsMixin],
  data() {
    return {
      validatingDebouncedFn: null,
      validateDelay: 350,
      displayErrors: true
    }
  },
  computed: {
    value: {
      get() {
        return this.metadata.value
      },
      set(newValue) {
        this.$cwa.forms.setValue(this.storeId, newValue)
      }
    },
    form(): FormView {
      return this.$cwa.forms.getView({ formId: this.formId })
    },
    inputAttr() {
      return Object.assign({}, this.vars.attr, {
        disabled: this.vars.disabled,
        name: this.vars.name,
        id: this.vars.id,
        required: this.vars.required
      })
    },
    validationSupported() {
      const formMetadata = this.form.metadata
      return !(
        formMetadata.apiDisabled ||
        formMetadata.realtimeValidateDisabled ||
        formMetadata.proxy ||
        [null, '', '#'].includes(this.form.metadata.action)
      )
    },
    classNames() {
      const submitting = this.metadata.validation.submitting
      return {
        'is-validating': submitting,
        'has-errors':
          this.metadata.errored ||
          (!submitting && this.vars.valid === false && this.displayErrors),
        'is-valid': !submitting && this.vars.valid
      }
    }
  },
  watch: {
    value(newValue) {
      this.$emit('input', newValue)
    }
  },
  methods: {
    validate(delay) {
      return new Promise((resolve, reject) => {
        if (this.validatingDebouncedFn) {
          this.validatingDebouncedFn.resolve('Cancelled')
          this.validatingDebouncedFn.call.cancel()
        }
        this.validatingDebouncedFn = {
          resolve,
          reject,
          call: _debounce(
            async () => {
              try {
                resolve(await this.$cwa.forms.validate(this.storeId))
              } catch (error) {
                reject(error)
              }
            },
            delay >= 0 ? delay : this.validateDelay
          )
        }
        this.validatingDebouncedFn.call()
      }).catch((error) => {
        consola.error(error)
      })
    }
  }
})
