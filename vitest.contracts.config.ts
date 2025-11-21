import { fileURLToPath } from 'node:url'
import { resolve as resolvePath } from 'node:path'

import { defineConfig } from 'vitest/config'

import baseConfig from './vitest.config'

export default defineConfig({
  ...baseConfig,
  resolve: {
    ...baseConfig.resolve,
    alias: [
      ...(baseConfig.resolve?.alias ?? []),
      {
        find: 'msw/node',
        replacement: resolvePath(fileURLToPath(new URL('.', import.meta.url)), 'node_modules/msw/lib/node/index.mjs'),
      },
    ],
    conditions: ['node', 'browser', 'module', 'module-sync', 'import', 'default'],
  },
  test: {
    ...baseConfig.test,
    include: ['contracts/**/*.{contract,test,spec}.{ts,tsx}'],
    exclude: [],
    watch: false,
    environment: 'node',
  },
})
