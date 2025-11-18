import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import baseConfig from '../../vitest.config'
import { mergeConfig, type UserConfig } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const sharedConfig = baseConfig as UserConfig

const packageConfig: UserConfig = {
  root: workspaceRoot,
  test: {
    include: ['packages/core/**/*.{test,spec}.{ts,tsx}'],
    watchExclude: ['**/dist/**', '**/.turbo/**'],
  },
  resolve: {
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      { find: '@app/core', replacement: resolve(workspaceRoot, 'packages/core') },
      { find: '@app/ui/components', replacement: resolve(workspaceRoot, 'packages/ui/src/components') },
    ],
  },
}

export default mergeConfig(sharedConfig, packageConfig)

