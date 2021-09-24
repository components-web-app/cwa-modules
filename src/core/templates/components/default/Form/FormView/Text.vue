<template>
  <wrapper v-bind="wrapperProps">
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
import {
  FormExtraSubmitData,
  FormView
} from '@cwa/nuxt-module/core/vuex/FormsVuexModule'
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
        'keypress.enter': this.validateText,
        keyup: this.validateText
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
    },
    otherRepeatedViewPath() {
      const repeatedChildren = this.viewData?.repeatedChildren
      if (!repeatedChildren) {
        return null
      }
      const otherPath = repeatedChildren.filter(
        (fullName) => fullName !== this.vars.full_name
      )[0]
      const otherFullPath = this.formViewPath.slice(0, -1)
      otherFullPath.push(otherPath)
      return otherFullPath
    }
  },
  watch: {
    'vars.valid'(newValue) {
      // for a repeated input, the second input will be synthesised but we do not want that input
      // to start displaying errors
      if (newValue === true && this.vars.name !== 'second') {
        this.displayErrors = true
      }
    },
    'metadata.validation.displayErrors'(newValue) {
      this.displayErrors = newValue
    }
  },
  methods: {
    async inputBlur() {
      await this.validateText(0)
      this.displayErrors = true
      if (this.vars.name === 'second' && this.otherRepeatedViewPath) {
        this.$cwa.forms.setDisplayErrors(
          {
            formId: this.formId,
            path: this.otherRepeatedViewPath
          },
          this.displayErrors
        )
      }
    },
    validateText(delay) {
      if (this.otherRepeatedViewPath === null) {
        this.validate(delay)
        return
      }
      this.validateRepeated(delay)
    },
    validateRepeated(delay) {
      // expect 'first' or 'second' for repeated input
      const shortName = this.vars.name
      const otherView: FormView = this.$cwa.forms.getView({
        formId: this.formId,
        path: this.otherRepeatedViewPath
      })
      const otherValue = otherView.metadata.value

      const extraData: FormExtraSubmitData[] = []
      // if it is the first, should we be mocking the second to match the value?
      if (shortName === 'first') {
        // simulate second input
        const submitOtherValue = otherValue || this.value
        extraData.push({
          path: this.otherRepeatedViewPath,
          value: submitOtherValue,
          fakeValue: otherValue === ''
        })
      } else {
        // submit first input too. THe first input will already be displaying errors
        // so we want to prevent showing non-matching password until blurred
        extraData.push({
          path: this.otherRepeatedViewPath,
          value: otherValue
        })
        this.$cwa.forms.setDisplayErrors(
          {
            formId: this.formId,
            path: this.otherRepeatedViewPath
          },
          this.displayErrors
        )
      }

      this.validate(delay, extraData)
    }
  }
})
</script>

<style lang="sass" scoped>
input, textarea
  display: block
</style>
