<template>
  <wrapper class="collection-entry-text" v-bind="wrapperProps">
    <div class="row">
      <div class="column">
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
      </div>
      <div class="column is-narrow">
        <button type="button" @click="deleteEntry">Delete</button>
      </div>
    </div>
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import Text from './Text.vue'

export default Vue.extend({
  extends: Text,
  methods: {
    deleteEntry() {
      this.$cwa.forms.deleteView(this.storeId)
    }
  }
})
</script>

<style lang="sass">
.collection-entry-text
  .row
    align-items: center
    button
      margin-bottom: 1.5rem
</style>
