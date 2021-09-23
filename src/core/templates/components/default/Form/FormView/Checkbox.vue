<template>
  <wrapper v-bind="wrapperProps">
    <cwa-checkboxes v-bind="$props" />
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'
import Wrapper from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/_Wrapper.vue'
import CwaCheckboxes from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/Choice/CwaCheckboxes.vue'

export default Vue.extend({
  components: { CwaCheckboxes, Wrapper },
  mixins: [FormViewBlockMixin]
})
</script>
