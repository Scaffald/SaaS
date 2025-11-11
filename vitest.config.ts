import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, type UserConfig } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))
const coverageReportsDirectory = resolve(workspaceRoot, 'coverage')

type VitestPlugin = NonNullable<UserConfig['plugins']>[number]
const plugins: VitestPlugin[] = [react() as unknown as VitestPlugin]

export default defineConfig({
  root: workspaceRoot,
  plugins,
  resolve: {
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      { find: '@app/core', replacement: resolve(workspaceRoot, 'packages/core') },
      { find: '@app/ui', replacement: resolve(workspaceRoot, 'packages/ui') },
      { find: '@app/supabase', replacement: resolve(workspaceRoot, 'packages/supabase') },
      { find: '@app/schemas', replacement: resolve(workspaceRoot, 'packages/schemas/src') },
      {
        find: '@testing-library/react-native',
        replacement: resolve(workspaceRoot, 'test/mocks/testing-library-react-native.ts'),
      },
      {
        find: 'expo-constants',
        replacement: resolve(workspaceRoot, 'test/mocks/expo-constants.ts'),
      },
      { find: '@app/styleguide', replacement: resolve(workspaceRoot, 'packages/ui/src/styleguide') },
    ],
    conditions: ['browser', 'module', 'import', 'default'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['{apps,packages}/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/.tamagui/**',
      'packages/supabase/functions/trpc/__tests__/**',
    ],
    setupFiles: [resolve(workspaceRoot, 'test/setup.ts')],
    server: {
      deps: {
        inline: ['@testing-library/react-native', 'expo-router'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: coverageReportsDirectory,
      include: [
        'packages/core/utils/api.ts',
        'packages/core/utils/getBaseUrl.ts',
        'packages/core/utils/getLocalhost.*.ts',
        'packages/core/utils/slugify.ts',
        'packages/core/utils/useAdaptiveLoading.ts',
        'packages/core/utils/useAllOrganizations.ts',
        'packages/core/utils/useDebounce.ts',
        'packages/core/utils/useOrganizations.ts',
        'packages/core/utils/useUser.ts',
        'packages/core/utils/supabase/**/*.ts',
        'packages/core/utils/auth/useProtectedRoute.ts',
        'packages/core/features/discover/utils/**/*.ts',
        'packages/ui/src/components/image-picker/utils/**/*.ts',
        'packages/ui/src/components/image-picker/__tests__/**/*.ts',
        'packages/schemas/src/profile/**/*.ts',
      ],
      exclude: [
        'test/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/.expo/**',
        '**/.tamagui/**',
        '**/__tests__/**/fixtures/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'packages/supabase/functions/trpc/__tests__/**',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
})

