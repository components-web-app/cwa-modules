<template>
  <div class="cwa-collection-entry row">
    <div class="column">
      <slot :child-proxy="'CwaFormCollectionEntryText'"></slot>
    </div>
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
