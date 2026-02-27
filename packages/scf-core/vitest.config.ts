import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

const packageConfig = {
  root: workspaceRoot,
  test: {
    watchExclude: ['**/dist/**'],
  },
  resolve: {
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      {
        find: '@scf/core',
        replacement: resolve(workspaceRoot, 'packages/scf-core'),
      },
    ],
  },
}

// mergeConfig concatenates arrays, so we override include after merging to
// avoid picking up test files from every other package in the monorepo.
const merged = mergeConfig(baseConfig, packageConfig)
merged.test.include = ['packages/scf-core/**/*.{test,spec}.{ts,tsx}']

export default merged
