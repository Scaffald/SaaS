import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ['packages/scaffald-cli/**/*.{test,spec}.{ts,tsx}'],
  },
})
