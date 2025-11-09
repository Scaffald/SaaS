import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import baseConfig from '../../vitest.config'
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const sharedConfig = baseConfig as UserConfig

export default mergeConfig(
  sharedConfig,
  defineConfig({
    root: workspaceRoot,
    test: {
      include: ['packages/ui/**/*.{test,spec}.{ts,tsx}'],
      watchExclude: ['**/dist/**', '**/.turbo/**'],
    },
    resolve: {
      alias: [
        { find: 'react-native', replacement: 'react-native-web' },
        { find: '@app/ui', replacement: resolve(workspaceRoot, 'packages/ui') },
      ],
    },
  }) as UserConfig,
)

