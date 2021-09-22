<template>
  <wrapper :vars="vars" :metadata="metadata" :display-errors="displayErrors">
    <input
      v-if="inputType === 'number'"
      v-model.number="value"
      v-bind="textInputAttr"
      :class="classNames"
      v-on="events"
    />
    <textarea
      v-else-if="lastBlockPrefix === 'textarea'"
      v-model="value"
      v-bind="textInputAttr"
      :class="classNames"
      v-on="events"
    />
    <input
      v-else
      v-model="value"
      v-bind="textInputAttr"
      :class="classNames"
      v-on="events"
    />
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import Wrapper from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/_Wrapper.vue'
import FormViewBlockMixin from '../../../../../mixins/FormViewBlockMixin'

export default Vue.extend({
  components: { Wrapper },
  mixins: [FormViewBlockMixin],
  data() {
    return {
      displayErrors: false
    }
  },
  computed: {
    events() {
      return {
        blur: this.inputBlur,
        'keypress.enter': this.validate,
        keyup: this.validate
      }
    },
    lastBlockPrefix() {
      return this.blockPrefixes[this.blockPrefixes.length - 1]
    },
    textInputAttr() {
      if (this.inputComponentTag === 'textarea') {
        return this.inputAttr
      }
      return {
        ...this.inputAttr,
        type: this.inputType
      }
    },
    inputType() {
      const allowedTypes = [
        'number',
        'url',
        'email',
        'datetime-local',
        'time',
        'date',
        'password'
      ]
      if (allowedTypes.includes(this.lastBlockPrefix)) {
        return this.lastBlockPrefix
      }
      return 'text'
    }
  },
  watch: {
    'vars.valid'(newValue) {
      if (newValue === true) {
        this.displayErrors = true
      }
    }
  },
  methods: {
    async inputBlur() {
      await this.validate(0)
      this.displayErrors = true
    }
  }
})
</script>

<style lang="sass" scoped>
input, textarea
  display: block
</style>
