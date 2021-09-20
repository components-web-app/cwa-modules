import Vue from 'vue'
import FormViewPropsMixin from './FormViewPropsMixin'

export default Vue.extend({
  mixins: [FormViewPropsMixin],
  computed: {
    inputAttr() {
      return Object.assign({}, this.vars.attr, {
        disabled: this.vars.disabled,
        name: this.vars.full_name,
        id: this.vars.id,
        required: this.vars.required
      })
    }
  }
})
