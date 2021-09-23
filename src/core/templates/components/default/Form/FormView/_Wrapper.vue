<template>
  <div class="cwa-input-wrapper">
    <slot name="label">
      <label
        v-if="vars.label"
        v-bind="vars.label_attr"
        :class="{ 'is-required': vars.required }"
        v-html="vars.label"
      />
    </slot>
    <slot name="default"></slot>
    <slot name="errors">
      <ul
        v-if="displayErrors && vars.errors && vars.errors.length"
        class="cwa-input-errors"
      >
        <li
          v-for="(error, errorIndex) of vars.errors"
          :key="`${vars.id}-error-${errorIndex}`"
        >
          {{ error }}
        </li>
      </ul>
    </slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    vars: {
      type: Object,
      required: true
    },
    metadata: {
      type: Object,
      required: true
    },
    displayErrors: {
      type: Boolean,
      required: false,
      default: false
    }
  }
})
</script>

<style lang="sass">
.cwa-input-wrapper
  label.is-required::after
    content: '*'
  .cwa-input-errors
    display: block
    position: relative
    list-style: none
    margin: -1.2rem 0 1.5rem
    padding: 0
    li
      margin: 0
      padding: 0
      color: $cwa-danger
</style>
