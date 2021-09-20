import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { Store } from 'vuex'
import FormsVuexModule from './vuex/FormsVuexModule'

export default class Forms {
  private ctx: {
    $axios: NuxtAxiosInstance
    store: Store<any>
    vuexNamespace: string
  }

  public state: any

  constructor({ $axios, store, vuexNamespace }) {
    this.ctx = {
      $axios,
      store,
      vuexNamespace
    }
    this._initState()
  }

  _initState() {
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
  }
}
