<template>
  <div class="cwa-input-wrapper">
    <button v-bind="inputAttr" type="submit">
      {{ vars.label }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

export default Vue.extend({
  mixins: [FormViewBlockMixin]
})
</script>
