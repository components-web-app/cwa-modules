<template>
  <div class="cwa-form-view">
    <component
      :is="formViewComponent"
      v-bind="formViewProps"
      :form-view="formView"
    >
      <div v-if="formViewComponent === 'div'" class="cwa-form-view-not-found">
        <p class="has-color-primary">Form View Block Not Found</p>
        <p>Searched:</p>
        <pre>{{ pascalBlockPrefixes }}</pre>
        <p>Excluded:</p>
        <pre>{{ excludeComponents }}</pre>
        <p>Available:</p>
        <pre>{{ formViewComponents }}</pre>
      </div>
      <form-view
        v-for="childFormView of formView.children"
        :key="childFormView['@id']"
        v-bind="formViewProps"
        :form-view="childFormView"
      />
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
    CwaFormRepeated: () => import('./FormView/Repeated.vue'),
    CwaFormSubmit: () => import('./FormView/Submit.vue')
  },
  mixins: [FormViewMixin]
})
</script>

<style lang="sass">
.cwa-form-view
  .cwa-form-view-not-found
    padding: 1rem
    background: $cwa-grid-item-background
    color: $cwa-color-text-light
</style>
