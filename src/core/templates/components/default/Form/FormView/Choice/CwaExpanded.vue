<template>
  <div :class="classNames" v-bind="inputAttr">
    <div
      v-for="(choice, index) of vars.choices"
      :key="`${vars.id}-choice-${index}`"
    >
      <label :for="`${vars.id}-choice-${index}`" v-bind="choice.attr">
        <input
          :id="`${vars.id}-choice-${index}`"
          v-model="value"
          :value="choice.value"
          :type="inputType"
          @change="validate"
        />
        <span>
          {{ choice.label }}
        </span>
      </label>
    </div>
  </div>
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
  },
  computed: {
    inputType() {
      return this.vars.multiple ? 'checkbox' : 'radio'
    }
  }
})
</script>
