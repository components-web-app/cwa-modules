<template>
  <form :action="vars.action" v-bind="vars.attr" @submit.prevent="submitForm">
    <slot></slot>
    <span class="help">* required</span>
  </form>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

export default Vue.extend({
  mixins: [FormViewBlockMixin],
  // prevent unnecessary call to initialise this as a form view
  created() {},
  methods: {
    submitForm() {
      this.$cwa.forms.submit(this.storeId)
    }
  }
})
</script>
