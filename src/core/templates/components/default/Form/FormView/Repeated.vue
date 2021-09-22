<template>
  <div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

// todo: handle when to display errors and validate both inputs at once... or password on initial and repeat validation on second input

export default Vue.extend({
  mixins: [FormViewBlockMixin],
  computed: {}
})
</script>
