<template>
  <select :multiple="vars.multiple">
    <option>Option</option>
  </select>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

export default Vue.extend({
  mixins: [FormViewBlockMixin]
})
</script>
