import { fileURLToPath } from 'url'
import { join } from 'path'
import { defineNuxtModule, createResolver, addPluginTemplate, installModule, addLayout, extendPages } from '@nuxt/kit'
import { ModuleOptions, NuxtPage } from '@nuxt/schema'
import Bluebird from 'bluebird'

export interface CwaModuleOptions extends ModuleOptions {
  storeName: string
  pagesDepth?: number,
  apiUrlBrowser?: string
  apiUrl?: string
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
        layout: false
      }
    }
    if (currentDepth === 0) {
      page.path = `/${page.path}`
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
    name: '@cwa/nuxt-module',
    configKey: 'cwa',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    storeName: 'cwa'
  },
  async setup (options: CwaModuleOptions, nuxt) {
    Bluebird.config({ cancellation: true })

    const { resolve } = createResolver(import.meta.url)

    // modules
    await installModule('@pinia/nuxt')

    // transpile runtime
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)

    nuxt.options.css.push(resolve('./runtime/templates/assets/main.css'))

    // layouts and pages
    const vueTemplatesDir = fileURLToPath(new URL('./runtime/templates', import.meta.url))
    addLayout({
      src: resolve(vueTemplatesDir, 'layouts', 'cwa-default.vue'),
      filename: join('cwa', 'layouts', 'cwa-default.vue')
    }, 'cwa-default')

    extendPages((pages) => {
      const pageComponent = resolve(vueTemplatesDir, 'cwa-page.vue')
      createDefaultCwaPages(pages, pageComponent, options.pagesDepth || 3)
    })

    // clear options no longer needed and add plugin
    delete options.pagesDepth
    const lodashTemplatesDir = fileURLToPath(new URL('./templates', import.meta.url))
    addPluginTemplate({
      src: resolve(lodashTemplatesDir, 'plugin.template.ts'),
      filename: join('cwa', 'cwa-plugin.ts'),
      options
    })
  }
})
