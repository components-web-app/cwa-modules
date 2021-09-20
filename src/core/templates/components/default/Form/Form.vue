<template>
  <form-view
    :form-view="resource.formView"
    :form-id="resource['@id']"
    :form-type="resource.formType"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ComponentMixin from '@cwa/nuxt-module/core/mixins/ComponentMixin'
import FormView from './FormView.vue'

export default Vue.extend({
  components: { FormView },
  mixins: [ComponentMixin]
})
</script>
