import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

const packageConfig = {
  root: workspaceRoot,
  test: {
    include: ['packages/ui-standalone/**/*.{test,spec}.{ts,tsx}'],
    watchExclude: ['**/dist/**', '**/.turbo/**'],
  },
  resolve: {
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      { find: '@scaffald/tamagui-ui', replacement: resolve(workspaceRoot, 'packages/ui-standalone') },
    ],
  },
}

export default mergeConfig(baseConfig, packageConfig)

