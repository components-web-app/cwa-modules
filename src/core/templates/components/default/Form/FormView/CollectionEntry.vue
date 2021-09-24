<template>
  <div class="row">
    <div class="column">
      <slot :child-proxy="null"></slot>
    </div>
    <div class="column is-narrow">Delete</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'

export default Vue.extend({
  mixins: [FormViewBlockMixin],
  computed: {}
})
</script>
