import { fileURLToPath } from 'node:url'

import baseConfig from '../../vitest.config'
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const sharedConfig = baseConfig as UserConfig

export default mergeConfig(
  sharedConfig,
  defineConfig({
    root: workspaceRoot,
    test: {
      include: ['apps/expo/**/*.{test,spec}.{ts,tsx}'],
      watchExclude: ['**/dist/**', '**/.turbo/**', 'apps/expo/.expo/**'],
    },
    resolve: {
      alias: [{ find: 'react-native', replacement: 'react-native-web' }],
    },
  }) as UserConfig,
)

