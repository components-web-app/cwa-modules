import Vue from 'vue'
import type { PropType } from 'vue'
import {
  FormView,
  ViewMetadata,
  ViewVars
} from '@cwa/nuxt-module/core/vuex/FormsVuexModule'
import { UnqiueArray } from '../../utils'

export default Vue.extend({
  props: {
    formId: {
      type: String,
      required: true
    },
    formViewPath: {
      type: Array as PropType<string[]>,
      required: false,
      default() {
        return []
      }
    },
    excludeComponents: {
      type: Array as PropType<string[]>,
      required: false,
      default() {
        return []
      }
    },
    viewData: {
      type: Object,
      required: false,
      default: null
    }
  },
  computed: {
    storeId() {
      return {
        formId: this.formId,
        path: this.formViewPath
      }
    },
    blockPrefixes(): string[] {
      return this.vars.block_prefixes.filter((bp) => {
        return (
          bp !== this.vars.full_name && bp !== this.vars.unique_block_prefix
        )
      })
    },
    formView(): FormView {
      return this.$cwa.forms.getView(this.storeId)
    },
    vars(): ViewVars {
      return this.formView.vars
    },
    metadata(): ViewMetadata {
      return this.formView.metadata
    },
    childNames() {
      return this.formView.children
    },
    formViewProps() {
      return {
        formId: this.formId,
        formViewPath: this.formViewPath,
        excludeComponents: UnqiueArray([
          'CwaFormForm',
          ...this.excludeComponents
        ])
      }
    }
  }
})
