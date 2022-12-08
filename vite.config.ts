import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      include: ['**'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', 'vite.config.ts'],
      all: true,
      cleanOnRerun: true
    }
  }
})
