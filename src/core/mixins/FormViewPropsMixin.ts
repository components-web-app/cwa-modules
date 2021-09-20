import Vue from 'vue'
import type { PropType } from 'vue'
import { UnqiueArray } from '../../utils'
import { FormViewInterface } from './FormViewMixin'

export default Vue.extend({
  props: {
    formView: {
      type: Object as PropType<FormViewInterface>,
      required: true
    },
    formId: {
      type: String,
      required: true
    },
    formType: {
      type: String,
      required: true
    },
    excludeComponents: {
      type: Array as PropType<string[]>,
      required: false,
      default() {
        return []
      }
    }
  },
  computed: {
    formViewProps() {
      return {
        excludeComponents: UnqiueArray([
          'CwaFormForm',
          ...this.excludeComponents
        ]),
        formId: this.formId,
        formType: this.formType
      }
    },
    vars() {
      return this.formView.vars
    }
  }
})
