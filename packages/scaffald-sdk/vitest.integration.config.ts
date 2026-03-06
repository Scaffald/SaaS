import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Integration test config. Run with:
 *   SCAFFALD_INTEGRATION=1 pnpm exec vitest run --config vitest.integration.config.ts
 *
 * Requires local Supabase and API (e.g. pnpm supa start and serve api).
 * Uses real fetch; no MSW.
 */
export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, '../../node_modules/react/jsx-runtime'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/integration/**/*.integration.test.ts'],
    setupFiles: ['./src/__tests__/integration/integration.setup.ts'],
    testTimeout: 15000,
  },
})
