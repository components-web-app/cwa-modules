import { defineNuxtConfig } from 'nuxt/config'
import CwaModule from '../src/module'

const API_URL = process.env.API_URL || 'https://localhost:8443'
const API_URL_BROWSER = process.env.API_URL_BROWSER || API_URL

export default defineNuxtConfig({
  extends: [
    '../src/layer'
  ],
  modules: [
    CwaModule,
    '@nuxtjs/tailwindcss',
    '@nuxt/image-edge',
    '@nuxt/devtools',
    'nuxt-vitest',
    '@vite-pwa/nuxt'
  ],
  cwa: {
    apiUrl: API_URL,
    apiUrlBrowser: API_URL_BROWSER,
    resources: {
      NavigationLink: {
        name: 'Link',
        tabs: [],
        ui: []
      },
      HtmlContent: {
        name: 'Body Text',
        tabs: [],
        ui: []
      }
    },
    tailwind: {
      base: false
    }
  },
  typescript: {
    tsConfig: {
      include: [
        '../src'
      ],
      exclude: [
        '../**/*.spec.ts',
        '../**/*.test.ts'
      ]
    }
  },
  pwa: {}
})
