<template>
  <wrapper :label="vars.label" :label-attr="vars.label_attr" :vars="vars">
    <input v-bind="inputAttr" :type="inputType" />
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'
import Wrapper from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/_Wrapper.vue'

export default Vue.extend({
  components: { Wrapper },
  mixins: [FormViewBlockMixin],
  computed: {
    inputType() {
      if (this.vars.block_prefixes.includes('password')) {
        return 'password'
      }
      return 'text'
    }
  }
})
</script>
