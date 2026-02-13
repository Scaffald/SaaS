import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

const packageConfig = {
  root: workspaceRoot,
  test: {
    include: ['packages/scf-core/**/*.{test,spec}.{ts,tsx}'],
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

export default mergeConfig(baseConfig, packageConfig)
