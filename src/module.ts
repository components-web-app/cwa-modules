import {
  defineNuxtModule
} from '@nuxt/kit'
import { ModuleOptions } from '@nuxt/schema'
import { GlobalComponents } from 'vue'

export type GlobalComponentNames = keyof GlobalComponents

export interface CwaResourcesMeta {
  [type:string]: {
    name?: string,
    managerTabs?: GlobalComponentNames[]
  }
}

export interface CwaModuleOptions extends ModuleOptions {
  storeName: string
  pagesDepth?: number,
  apiUrlBrowser?: string
  apiUrl?: string,
  resources?: CwaResourcesMeta
}

export default defineNuxtModule<CwaModuleOptions>({
  meta: {
    name: '@cwa/nuxt3',
    configKey: 'cwa',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    storeName: 'cwa',
    resources: {
      ComponentPosition: {
        name: 'Position'
      },
      ComponentGroup: {
        name: 'Group'
      }
    },
    tailwind: {
      base: true
    }
  },
  setup () {
    console.log('empty module')
  }
})
