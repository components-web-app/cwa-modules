<template>
  <form>
    <slot></slot>
    <span class="help">* required</span>
  </form>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

export default Vue.extend({
  mixins: [FormViewBlockMixin]
})
</script>
