import Vue from 'vue'
import FormViewPropsMixin from './FormViewPropsMixin'

export default Vue.extend({
  mixins: [FormViewPropsMixin],
  props: {
    appliedChildProxy: {
      type: String,
      required: false,
      default: null
    }
  },
  computed: {
    pascalBlockPrefixes() {
      const snakeToPascal = (str) => {
        const pascal = str.replace(/([-_][a-z])/gi, (match) => {
          return match.toUpperCase().replace('-', '').replace('_', '')
        })
        return `${pascal.charAt(0).toUpperCase()}${pascal.substr(1)}`
      }

      return this.blockPrefixes.map((str) => snakeToPascal(str))
    },
    blockPrefixComponents() {
      return this.pascalBlockPrefixes.map((name) => `CwaForm${name}`)
    },
    formViewComponents() {
      return Object.keys(this.$options.components).filter((name) =>
        name.startsWith('CwaForm')
      )
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
  },
  methods: {
    getChildFormViewPath(childViewName) {
      return [...this.formViewPath, 'children', childViewName]
    }
  }
})
