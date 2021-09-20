import Vue from 'vue'
import FormViewPropsMixin from './FormViewPropsMixin'

export interface FormViewInterface {}

export default Vue.extend({
  mixins: [FormViewPropsMixin],
  computed: {
    localFormView() {
      const comp = Object.assign({}, this.formView)
      delete comp.children
      return comp
    },
    pascalBlockPrefixes() {
      const snakeToPascal = (str) => {
        const pascal = str.replace(/([-_][a-z])/gi, (match) => {
          return match.toUpperCase().replace('-', '').replace('_', '')
        })
        return `${pascal.charAt(0).toUpperCase()}${pascal.substr(1)}`
      }

      return this.vars.block_prefixes
        .filter((bp) => {
          return (
            bp !== this.vars.full_name && bp !== this.vars.unique_block_prefix
          )
        })
        .map((str) => snakeToPascal(str))
    },
    blockPrefixComponents() {
      return this.pascalBlockPrefixes.map((name) => `CwaForm${name}`)
    },
    formViewComponents() {
      return Object.keys(this.$options.components)
    },
    formViewComponent() {
      let component = 'div'
      for (const bpc of this.blockPrefixComponents) {
        if (this.excludeComponents.includes(bpc)) {
          continue
        }
        if (this.formViewComponents.includes(bpc)) {
          component = bpc
        }
      }

      return component
    }
  }
})
