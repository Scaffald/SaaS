import { fileURLToPath } from 'node:url'

import baseConfig from '../../vitest.config'
import { defineConfig, mergeConfig } from 'vitest/config'
import type { Config } from 'vitest'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const sharedConfig = baseConfig as Config

export default mergeConfig(
  sharedConfig,
  defineConfig({
    root: workspaceRoot,
    test: {
      include: ['apps/expo/**/*.{test,spec}.{ts,tsx}'],
      watchExclude: ['**/dist/**', '**/.turbo/**', 'apps/expo/.expo/**'],
    },
    resolve: {
      alias: [
        { find: 'react-native', replacement: 'react-native-web' },
        {
          find: '@testing-library/react-native',
          replacement: fileURLToPath(new URL('../../tests/infrastructure/vitest/mocks/testing-library-react-native.ts', import.meta.url)),
        },
        {
          find: 'expo-constants',
          replacement: fileURLToPath(new URL('../../tests/infrastructure/vitest/mocks/expo-constants.ts', import.meta.url)),
        },
      ],
    },
  }) as Config,
)

