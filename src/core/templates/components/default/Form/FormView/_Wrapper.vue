<template>
  <div class="cwa-input-wrapper">
    <slot name="label">
      <label
        v-if="label"
        v-bind="labelAttr"
        :class="{ 'is-required': vars.required }"
        >{{ label }}</label
      >
    </slot>
    <slot name="default"></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    label: {
      type: String,
      required: false,
      default: null
    },
    labelAttr: {
      type: Object,
      required: false,
      default: null
    },
    vars: {
      type: Object,
      required: true
    }
  }
})
</script>

<style lang="sass">
.cwa-input-wrapper
  label.is-required::after
    content: '*'
</style>
