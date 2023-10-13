import {
  defineNuxtModule
} from '@nuxt/kit'
import { ModuleOptions, NuxtPage } from '@nuxt/schema'
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

function createDefaultCwaPages (
  pages: NuxtPage[],
  pageComponentFilePath: string,
  maxDepth: number
) {
  function create (currentDepth = 0) {
    const page: NuxtPage = {
      name: `cwaPage${currentDepth}`,
      path: `:cwaPage${currentDepth}*`,
      file: pageComponentFilePath,
      meta: {
        layout: 'cwa-root-layout'
      }
    }
    if (currentDepth === 0) {
      page.path = '/:cwaPage0*'
    }

    if (currentDepth < maxDepth) {
      const child = create(++currentDepth)
      page.children = [child]
    }
    return page
  }
  const pagesTree = create()
  pages.push(pagesTree)
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
  async setup (options: CwaModuleOptions, nuxt) {
    console.log('empty module')
  }
})
