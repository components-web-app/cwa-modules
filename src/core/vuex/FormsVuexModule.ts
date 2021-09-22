import Vue from 'vue'
import consola from 'consola'
import _get from 'lodash.get'
// import _merge from 'lodash.merge'
import _cloneDeep from 'lodash.clonedeep'
import axios, { CancelTokenSource } from 'axios'

// Disable as these are variables fetched directly from the API
/* eslint-disable camelcase */
export interface ViewVars {
  full_name: string
  name: string
  id: string
  unique_block_prefix: string
  valid: boolean
  submitted: boolean
  required: boolean
  value: any
  errors: any[]
  action?: string
  block_prefixes: string[]
  disabled: boolean
  checked?: boolean
  multiple?: boolean
  attr: {
    [key: string]: any
  }
  label?: string
  label_attr: {
    [key: string]: any
  }
  [key: string]: any
}
/* eslint-enable camelcase */

export interface ViewMetadata {
  value: any
  validation: {
    lastValue: any
    submitting: boolean
    errored: boolean
    cancelToken?: CancelTokenSource
  }
  [key: string]: any
}

export interface FormView {
  vars: ViewVars
  children?: {
    [key: string]: FormView
  }
  metadata: ViewMetadata
}

export default {
  namespaced: true,
  state: () => ({}),
  mutations: {
    setMetadata(state, { formId, path, key, value, metadataPath }) {
      let setObject = _get(state[formId], path)?.metadata
      if (!setObject) {
        consola.error(
          `Cannot find metadata object for form ID '${formId}' and path '${path.join(
            ' -> '
          )}'`
        )
        return
      }
      if (metadataPath) {
        setObject = _get(setObject, metadataPath)
      }
      Vue.set(setObject, key, value)
    },
    init(state, { component }) {
      if (state[component['@id']]) {
        return
      }

      const getFormViewData = (formView) => {
        const children = formView.children
        delete formView.children

        const viewObject: FormView = {
          // nothing is valid until we check it. We don't want everything to display as valid when mounted
          vars: Object.assign({}, formView.vars, {
            valid: null
          }),
          metadata: {
            value: formView.vars.value,
            validation: {
              lastValue: undefined,
              submitting: false,
              errored: false
            }
          }
        }
        if (children.length) {
          viewObject.children = children.reduce(
            (obj, child) => ({
              ...obj,
              [child.vars.full_name]: getFormViewData(child)
            }),
            {}
          )
        }
        return viewObject
      }
      Vue.set(
        state,
        component['@id'],
        getFormViewData(_cloneDeep(component.formView))
      )
    },
    // updates the form view vars from submitted form views using the API Component returned during validation
    update(state, { component }) {
      const root = state[component['@id']]
      if (!root) {
        consola.warn(
          `Cannot update submitted valued for form '${component['@id']}' - it has not been initialised`
        )
        return
      }

      const loopChildren = (children, currentPath) => {
        for (const child of children) {
          getFormViewData(child, [...currentPath, 'children'])
        }
      }

      const getFormViewData = (formView, currentPath) => {
        currentPath = [...currentPath, formView.vars.full_name]
        if (formView.vars.submitted) {
          const currentView = _get(root, currentPath)
          Vue.set(currentView, 'vars', formView.vars)
        }

        loopChildren(formView.children, currentPath)
      }

      // Ignore the top level form, it will be submitted
      // but the action will not be populated and is not relevant anyway for validating a field

      loopChildren(component.formView.children, [])
    }
    // initView(state, { formId, formView }) {
    //   // left for reference when making the checkbox component - should be done there
    //   if (
    //     formView.vars.block_prefixes[1] === 'checkbox' &&
    //     !formView.vars.multiple
    //   ) {
    //     value = formView.vars.checked
    //   } else {
    //     value = formView.vars.value
    //     if (formView.vars.multiple) {
    //       value = Object.values(value)
    //     }
    //   }
    //
    //   // For reference from CWA v1 - need to look at what this is doing and how we pass inputType and children as
    //   // function parameters
    //   // inputData.prototype = inputType === 'collection' ? children[0] : null
    //   // if (inputData.vars.expanded) {
    //   //   inputData.children = children
    //   // } else if (inputType === 'collection') {
    //   //   inputData.children = {}
    //   // }
    // }
  },
  getters: {
    // getFormSubmitData: (state, getters) => (formId) => {
    //   const form = state[formId]
    //   if (!form) {
    //     return {}
    //   }
    //   const getDeepFormData = (children) => {
    //     let submitData = {}
    //     for (const [inputName, child] of Object.entries(children)) {
    //       submitData = _merge(
    //         submitData,
    //         getters.getInputSubmitData({ formId, inputName })
    //       )
    //       // @ts-ignore
    //       const nextChildren = child.children
    //       if (nextChildren) {
    //         submitData = _merge(submitData, getDeepFormData(nextChildren))
    //       }
    //     }
    //     return submitData
    //   }
    //   return Object.assign(
    //     form && form.vars.post_app_proxy ? { _action: form.vars.action } : {},
    //     form.extraData,
    //     getDeepFormData(form.data)
    //   )
    // },
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
  },
  actions: {
    async validate({ commit, state }, { formId, path }) {
      const formAction = state[formId].vars.action
      const formView: FormView = _get(state[formId], path)
      const value = formView.metadata.value
      if (value === formView.metadata.validation.lastValue) {
        return
      }

      const setValidationData = (key, value) => {
        commit('setMetadata', {
          formId,
          path,
          metadataPath: ['validation'],
          key,
          value
        })
      }
      if (formView.metadata.validation.cancelToken) {
        formView.metadata.validation.cancelToken.cancel()
      }
      const cancelToken = axios.CancelToken.source()

      setValidationData('submitting', true)
      setValidationData('cancelToken', cancelToken)
      setValidationData('lastValue', value)
      setValidationData('errored', false)

      // const objPath = [state[formId].vars.full_name, ...path]
      let stateObj = state[formId]
      let lastNestedValue = {}
      const submitObj = {
        [state[formId].vars.full_name]: lastNestedValue
      }
      for (const name of path) {
        stateObj = stateObj[name]
        if (name === 'children') {
          continue
        }
        const nestedValue =
          stateObj.vars.full_name === formView.vars.full_name ? value : {}
        lastNestedValue[stateObj.vars.name] = nestedValue
        lastNestedValue = nestedValue
      }

      try {
        const { data } = await this.$axios.patch(formAction, submitObj, {
          cancelToken: cancelToken.token,
          validateStatus(status) {
            return [422, 200].includes(status)
          }
        })
        commit('update', { component: data })
      } catch (error) {
        if (axios.isCancel(error)) {
          return
        }
        setValidationData('errored', true)
        consola.error(error)
      }

      setValidationData('submitting', false)
    }
  }
}
