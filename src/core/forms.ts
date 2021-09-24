import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { Store } from 'vuex'
import _get from 'lodash.get'
import FormsVuexModule, {
  FormExtraSubmitData,
  FormView,
  ViewMetadata,
  ViewVars
} from './vuex/FormsVuexModule'

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

  public addChildView(id: FormViewId, formView: FormView) {
    this.ctx.store.commit(`${this.namespacePrefix}/addChildView`, {
      ...id,
      formView
    })
  }

  setValue(id: FormViewId, value: any) {
    this.setMetadata(id, { key: 'value', value })
  }

  setChecked(id: FormViewId, value: any) {
    this.setMetadata(id, { key: 'value', value })
  }

  setDisplayErrors(id: FormViewId, value: boolean) {
    this.setMetadata(id, {
      metadataPath: ['validation'],
      key: 'displayErrors',
      value
    })
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

  async validate(
    { formId, path }: FormViewId,
    extraData: FormExtraSubmitData[] = null
  ) {
    await this.ctx.store.dispatch(`${this.namespacePrefix}/validate`, {
      formId,
      path,
      extraData
    })
  }

  convertPathToSubmitPath({ formId, path }: FormViewId) {
    const partPath = []
    return path.reduce(
      (setPath, name) => {
        partPath.push(name)
        if (name !== 'children') {
          const currentFormView: FormView = _get(this.state[formId], partPath)
          setPath.push(currentFormView.vars.name)
        }
        return setPath
      },
      [this.state[formId].vars.full_name]
    )
  }
}
