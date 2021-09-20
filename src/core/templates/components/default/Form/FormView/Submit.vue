<template>
  <wrapper :vars="vars">
    <button v-bind="inputAttr" type="submit">
      {{ vars.label }}
    </button>
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'
import Wrapper from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/_Wrapper.vue'

export default Vue.extend({
  components: { Wrapper },
  mixins: [FormViewBlockMixin]
})
</script>
