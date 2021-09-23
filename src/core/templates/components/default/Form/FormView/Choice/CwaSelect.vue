<template>
  <select
    v-model="value"
    :multiple="vars.multiple"
    :class="classNames"
    v-bind="inputAttr"
    @change="validate"
  >
    <option
      v-for="(choice, index) of vars.choices"
      :key="`${vars.id}-choice-${index}`"
      :value="choice.value"
      v-bind="choice.attr"
    >
      {{ choice.label }}
    </option>
  </select>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

export default Vue.extend({
  mixins: [FormViewBlockMixin],
  data() {
    return {
      displayErrors: true
    }
  }
})
</script>
