import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const packageRoot = fileURLToPath(new URL('.', import.meta.url))

const packageConfig = {
  root: workspaceRoot,
  resolve: {
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      {
        find: '@scaffald/ui',
        replacement: resolve(packageRoot, 'src'),
      },
    ],
  },
  test: {
    include: ['packages/beyond-ui/src/**/*.{test,spec}.{ts,tsx}'],
    watchExclude: ['**/dist/**'],
    setupFiles: [resolve(packageRoot, 'vitest.setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '.storybook/',
      ],
    },
  },
}

export default mergeConfig(baseConfig, packageConfig)
