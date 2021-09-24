<template>
  <div class="cwa-form-view">
    <component
      :is="appliedChildProxy || formViewComponent"
      v-bind="formViewProps"
      :view-data="viewData"
    >
      <template v-if="formViewComponent === 'div'">
        <div class="cwa-form-view-not-found">
          <p class="has-color-primary">Form View Block Not Found</p>
          <p>Searched:</p>
          <pre>{{ blockPrefixComponents }}</pre>
          <p>Excluded:</p>
          <pre>{{ excludeComponents }}</pre>
          <p>Available:</p>
          <pre>{{ formViewComponents }}</pre>
        </div>
      </template>
      <template #default="{ viewData, childProxy }">
        <form-view
          v-if="appliedChildProxy && appliedChildProxy !== formViewComponent"
          v-bind="$props"
          :applied-child-proxy="childProxy"
        />
        <form-view
          v-for="childViewName of children"
          v-else
          :key="`${formViewPath.join('-')}//${childViewName}`"
          v-bind="formViewProps"
          :form-view-path="getChildFormViewPath(childViewName)"
          :view-data="viewData"
          :applied-child-proxy="childProxy"
        />
      </template>
    </component>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import FormViewMixin from '../../../../mixins/FormViewMixin'

export default Vue.extend({
  name: 'FormView',
  components: {
    CwaFormForm: () => import('./FormView/Form.vue'),
    CwaFormText: () => import('./FormView/Text.vue'),
    CwaFormChoice: () => import('./FormView/Choice.vue'),
    CwaFormCheckbox: () => import('./FormView/Checkbox.vue'),
    CwaFormRepeated: () => import('./FormView/Repeated.vue'),
    CwaFormCollectionEntry: () => import('./FormView/CollectionEntry.vue'),
    CwaFormCollection: () => import('./FormView/Collection.vue'),
    CwaFormCollectionEntryText: () =>
      import('./FormView/CollectionEntryText.vue'),
    CwaFormSubmit: () => import('./FormView/Submit.vue')
  },
  mixins: [FormViewMixin],
  computed: {
    children() {
      if (this.blockPrefixes.includes('collection')) {
        return this.formView.children.slice(1)
      }
      return this.formView.children
    }
  }
})
</script>

<style lang="sass">
.cwa-form-view
  .cwa-form-view-not-found
    padding: 1rem
    background: $cwa-grid-item-background
    color: $cwa-color-text-light
    margin-bottom: 1.5rem
</style>
