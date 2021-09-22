<template>
  <div class="cwa-form-view">
    <component
      :is="formViewComponent"
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
      <template #default="{ viewData }">
        <form-view
          v-for="childViewName of formView.children"
          :key="`${formViewPath.join('-')}//${childViewName}`"
          v-bind="formViewProps"
          :form-view-path="getChildFormViewPath(childViewName)"
          :view-data="viewData"
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
