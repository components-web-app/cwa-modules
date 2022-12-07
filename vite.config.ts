import { defineConfig } from 'vitest/config'
import NuxtVitest from 'vite-plugin-nuxt-test'

export default defineConfig({
  plugins: [NuxtVitest()],
  test: {
    deps: {
      inline: ['@nuxt/test-utils']
    },
    // clearMocks: true,
    typecheck: { checker: 'vue-tsc' },
    coverage: {
      provider: 'c8',
      include: ['src/**'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
      all: true
    }
  }
})
