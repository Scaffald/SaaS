import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from 'vitest'
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const sharedConfig = baseConfig as Config

export default mergeConfig(
  sharedConfig,
  defineConfig({
    root: workspaceRoot,
    test: {
      include: ['packages/schemas/**/*.{test,spec}.{ts}'],
      watchExclude: ['**/dist/**', '**/.turbo/**'],
    },
    resolve: {
      alias: [
        { find: 'react-native', replacement: 'react-native-web' },
        { find: '@app/schemas', replacement: resolve(workspaceRoot, 'packages/schemas/src') },
      ],
    },
  }) as Config
)
