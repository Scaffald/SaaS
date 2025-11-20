import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

const expoConfig = {
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
        replacement: resolve(
          workspaceRoot,
          'tests/infrastructure/vitest/mocks/testing-library-react-native.ts'
        ),
      },
      {
        find: 'expo-constants',
        replacement: resolve(workspaceRoot, 'tests/infrastructure/vitest/mocks/expo-constants.ts'),
      },
    ],
  },
}

export default mergeConfig(baseConfig, expoConfig)
