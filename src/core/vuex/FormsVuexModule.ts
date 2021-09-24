import Vue from 'vue'
import consola from 'consola'
import _get from 'lodash.get'
import _set from 'lodash.set'
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
    displayErrors?: boolean
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

export interface FormExtraSubmitData {
  path: string[]
  value: any
  fakeValue?: boolean
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
    update(
      state,
      { component, synthesised }: { component: any; synthesised?: string[][] }
    ) {
      const synthAsJson = synthesised
        ? synthesised.map((arr) => JSON.stringify(arr))
        : []
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
        if (
          formView.vars.submitted &&
          !synthAsJson.includes(JSON.stringify(currentPath))
        ) {
          const currentView = _get(root, currentPath)
          // patching collections   does not return all vars, does not return label for text input collections
          // so do not trust full vars returned and merge with the existing vars
          Vue.set(currentView, 'vars', {
            ...currentView.vars,
            ...formView.vars
          })
        }

        loopChildren(formView.children, currentPath)
      }

      // Ignore the top level form, it will be submitted
      // but the action will not be populated and is not relevant anyway for validating a field

      loopChildren(component.formView.children, [])
    },
    addChildView(
      state,
      {
        formId,
        path,
        formView
      }: {
        formId: string
        path: string
        formView: FormView
      }
    ) {
      const setObject = _get(state[formId], path).children
      Vue.set(setObject, formView.vars.full_name, formView)
    },
    deleteView(state, { formId, path }) {
      Vue.delete(_get(state[formId], path.slice(0, -1)), path[path.length - 1])
    }
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
    // }
  },
  actions: {
    async submit({ state, commit }, { formId, path }) {
      const setValidationData = (key, value) => {
        commit('setMetadata', {
          formId,
          path,
          metadataPath: ['validation'],
          key,
          value
        })
      }

      setValidationData('submitting', true)

      const formAction = state[formId].vars.action
      const { data } = await this.$axios.patch(
        formAction,
        {},
        {
          cancelToken: null,
          validateStatus(status) {
            return [422, 200].includes(status)
          }
        }
      )
      console.log(data)

      setValidationData('submitting', false)
    },
    async validate(
      { commit, state },
      {
        formId,
        path,
        extraData
      }: { formId: string; path: string; extraData: FormExtraSubmitData[] }
    ) {
      // local/private function declarations
      const setValidationData = (key, value) => {
        commit('setMetadata', {
          formId,
          path,
          metadataPath: ['validation'],
          key,
          value
        })
      }

      const setSubmitVar = (path, forceValue = undefined) => {
        const submitPath = this.$cwa.forms.convertPathToSubmitPath({
          formId,
          path
        })
        const setValue = forceValue !== undefined ? forceValue : value
        _set(submitObj, submitPath, setValue)
      }

      const formAction = state[formId].vars.action
      const formView: FormView = _get(state[formId], path)
      const value =
        'checked' in formView.metadata
          ? formView.metadata.checked
          : formView.metadata.value

      // skip if we have already got a pending/complete validation for this value
      if (value === formView.metadata.validation.lastValue) {
        return
      }
      setValidationData('lastValue', value)

      // cancel previous request and create new token
      if (formView.metadata.validation.cancelToken) {
        formView.metadata.validation.cancelToken.cancel()
      }
      const cancelToken = axios.CancelToken.source()
      setValidationData('cancelToken', cancelToken)

      setValidationData('submitting', true)
      setValidationData('errored', false)

      const submitObj = {
        [state[formId].vars.full_name]: {}
      }
      setSubmitVar(path)
      if (extraData) {
        for (const submitData of extraData) {
          setSubmitVar(submitData.path, submitData.value)
        }
      }

      try {
        const { data } = await this.$axios.patch(formAction, submitObj, {
          cancelToken: cancelToken.token,
          validateStatus(status) {
            return [422, 200].includes(status)
          }
        })
        commit('update', {
          component: data,
          synthesised: extraData
            ? extraData.filter((ed) => ed.fakeValue === true).map((d) => d.path)
            : null
        })
        setValidationData('submitting', false)
      } catch (error) {
        if (axios.isCancel(error)) {
          return
        }
        setValidationData('errored', true)
        setValidationData('submitting', false)
        consola.error(error)
      }
    }
  }
}
