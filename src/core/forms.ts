import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { Store } from 'vuex'
import _get from 'lodash.get'
import FormsVuexModule, { ViewMetadata, ViewVars } from './vuex/FormsVuexModule'

export interface FormViewId {
  formId: string
  path?: string[]
}

export default class Forms {
  private ctx: {
    $axios: NuxtAxiosInstance
    store: Store<any>
    vuexNamespace: string
  }

  private namespacePrefix: string

  public state: any

  constructor({ $axios, store, vuexNamespace }) {
    this.ctx = {
      $axios,
      store,
      vuexNamespace
    }
    this._initState()
  }

  private _initState() {
    const vuexNamespace = '_Forms'

    this.ctx.store.registerModule(
      [this.ctx.vuexNamespace, vuexNamespace],
      FormsVuexModule,
      {
        preserveState: Boolean(
          this.ctx.store.state[this.ctx.vuexNamespace][vuexNamespace]
        )
      }
    )

    this.state = this.ctx.store.state[this.ctx.vuexNamespace][vuexNamespace]
    this.namespacePrefix = `${this.ctx.vuexNamespace}/${vuexNamespace}`
  }

  public init({ component }) {
    this.ctx.store.commit(`${this.namespacePrefix}/init`, { component })
  }

  public getView({ formId, path }: { formId: string; path?: string[] }) {
    const getRawView = () => {
      if (!path || !path.length) {
        return this.state[formId] || {}
      }
      return _get(this.state[formId], path, {})
    }
    const rawView = getRawView()
    return {
      vars: rawView.vars,
      metadata: rawView.metadata || {},
      children: rawView.children ? Object.keys(rawView.children) : []
    } as {
      vars: ViewVars
      metadata: ViewMetadata
      children: string[]
    }
  }

  setValue(id: FormViewId, value: any) {
    this.setMetadata(id, { key: 'value', value })
  }

  setMetadata(
    { formId, path }: FormViewId,
    {
      key,
      value,
      metadataPath
    }: { key: string; value: any; metadataPath?: string[] }
  ) {
    this.ctx.store.commit(`${this.namespacePrefix}/setMetadata`, {
      formId,
      path,
      key,
      value,
      metadataPath
    })
  }

  async validate({ formId, path }: FormViewId) {
    await this.ctx.store.dispatch(`${this.namespacePrefix}/validate`, {
      formId,
      path
    })
  }

  // setFormMetadata(formId, key, value) {
  //   this.ctx.store.commit(`${this.namespacePrefix}/setFormMetadata`, {
  //     formId,
  //     key,
  //     value
  //   })
  //
  //   return value
  // }
  //
  // setViewMetadata(formId, name, key, value) {
  //   this.ctx.store.commit(`${this.namespacePrefix}/setViewMetadata`, {
  //     formId,
  //     name,
  //     key,
  //     value
  //   })
  //
  //   return value
  // }
  //
  // setViewVar(formId, name, key, value) {
  //   this.ctx.store.commit(`${this.namespacePrefix}/setViewVar`, {
  //     formId,
  //     name,
  //     key,
  //     value
  //   })
  //
  //   return value
  // }
  //
}
