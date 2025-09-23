import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, mergeConfig } from 'vitest/config'

import { createWorkspaceVitestConfig } from '../../vitest.workspace'

export default defineConfig(async () => {
  const baseConfig = await createWorkspaceVitestConfig({ environment: 'jsdom' })
  const packageDir = dirname(fileURLToPath(import.meta.url))

  return mergeConfig(baseConfig, {
    resolve: {
      alias: {
        '@tamagui/animations-moti': resolvePath(packageDir, 'test/mocks/tamaguiAnimationsMock.ts'),
        '@tamagui/animations-react-native': resolvePath(
          packageDir,
          'test/mocks/tamaguiAnimationsMock.ts'
        ),
        'react-native': 'react-native-web',
      },
    },
    test: {
      setupFiles: ['./vitest.setup.ts'],
    },
  })
})
