import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import baseConfig from '../../vitest.config'
import { mergeConfig } from 'vitest/config'
import type { Config } from 'vitest'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const sharedConfig = baseConfig as Config

const packageConfig: Config = {
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
}

export default mergeConfig(sharedConfig, packageConfig)

