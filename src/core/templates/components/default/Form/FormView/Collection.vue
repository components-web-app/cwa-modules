<template>
  <wrapper v-bind="wrapperProps">
    <button type="button" @click="addEntry">+ Entry</button>
    <slot :child-proxy="'CwaFormCollectionEntry'"></slot>
  </wrapper>
</template>

<script lang="ts">
import Vue from 'vue'
import _clonedeep from 'lodash.clonedeep'
import FormViewBlockMixin from '@cwa/nuxt-module/core/mixins/FormViewBlockMixin'
import Wrapper from '@cwa/nuxt-module/core/templates/components/default/Form/FormView/_Wrapper.vue'

export default Vue.extend({
  components: {
    Wrapper
  },
  mixins: [FormViewBlockMixin],
  methods: {
    getView(path) {
      return this.$cwa.forms.getView({
        formId: this.formId,
        path
      })
    },
    addEntry() {
      // must submit complete object, not names as strings for children
      const processChildren = (view, currentPath) => {
        if (!view.children) {
          return
        }
        view.children = view.children.reduce((obj, childName) => {
          const viewPath = [...currentPath, 'children', childName]
          const childView = _clonedeep(this.getView(viewPath))
          for (const varName of ['label', 'name', 'id', 'full_name']) {
            childView.vars[varName] = childView.vars[varName].replace(
              '__name__',
              newIndex
            )
          }
          obj[childName.replace('__name__', newIndex)] = childView
          if (childView.children) {
            processChildren(childView, viewPath)
          }
          return obj
        }, {})
      }

      const protoPath = [
        ...this.formViewPath,
        'children',
        this.formView.children[0]
      ]
      const view = _clonedeep(this.getView(protoPath))
      const newIndex = this.formView.children.length - 1
      for (const varName of ['label', 'name', 'id', 'full_name']) {
        if (view.vars[varName]) {
          view.vars[varName] = view.vars[varName].replace('__name__', newIndex)
        }
      }
      processChildren(view, protoPath)
      this.$cwa.forms.addChildView(
        {
          formId: this.formId,
          path: this.formViewPath
        },
        view
      )
    }
  }
})

// getInputSubmitData:
//   (state) =>
//   ({ formId, name }) => {
//     // collections are tricky, leave this in for reference when dealing with them
//     // If a collection, we want to ensure the other array values are not null otherwise API will validate
//     // as the first entry always
//     for (const [partIndex, partKey] of searchResult.entries()) {
//       const keyAsNumber = partKey / 1
//       if (!isNaN(keyAsNumber) && Number.isInteger(keyAsNumber)) {
//         let countdown = partKey - 1
//         while (countdown >= 0) {
//           const newSearchResult = searchResult
//           newSearchResult[partIndex] = countdown
//           newSearchResult.length = partIndex + 1
//           _set(submitObj, newSearchResult, {})
//           countdown--
//         }
//       }
//     }
//
//     return submitObj
//   }
</script>
