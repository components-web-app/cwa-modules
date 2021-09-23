<template>
  <wrapper v-bind="wrapperProps">
    <div v-if="!vars.expanded">
      <cwa-select v-bind="$props" />
    </div>
    <div v-else-if="vars.multiple">
      <cwa-checkboxes v-bind="$props" />
    </div>
    <div v-else>
      <cwa-radios v-bind="$props" />
    </div>
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'
import Wrapper from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/_Wrapper.vue'

export default Vue.extend({
  components: {
    CwaRadios: () =>
      import(
        '@cwa/nuxt-module/core/templates/components/default/Form/FormView/Choice/CwaRadios.vue'
      ),
    CwaCheckboxes: () =>
      import(
        '@cwa/nuxt-module/core/templates/components/default/Form/FormView/Choice/CwaCheckboxes.vue'
      ),
    CwaSelect: () =>
      import(
        '@cwa/nuxt-module/core/templates/components/default/Form/FormView/Choice/CwaSelect.vue'
      ),
    Wrapper
  },
  mixins: [FormViewBlockMixin]
})
</script>
