import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import type { Config } from 'vitest'

import { flowRemoveTypesPlugin } from './tests/infrastructure/vitest/plugins/flow-remove'
const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))
const coverageReportsDirectory = resolve(workspaceRoot, 'coverage')
const quietReporterPath = resolve(
  workspaceRoot,
  'tests/infrastructure/vitest/reporters/quiet-progress.ts',
)

type VitestPlugin = NonNullable<Config['plugins']>[number]
const plugins: VitestPlugin[] = [
  react() as unknown as VitestPlugin,
  flowRemoveTypesPlugin(),
]
const reactNativeMockPath = resolve(workspaceRoot, 'tests/infrastructure/vitest/mocks/react-native.ts')

export default defineConfig({
  root: workspaceRoot,
  plugins,
  resolve: {
    alias: [
      {
        find: 'react-native',
        replacement: reactNativeMockPath,
      },
      {
        find: /^react-native\//,
        replacement: reactNativeMockPath,
      },
      { find: '@app/core', replacement: resolve(workspaceRoot, 'packages/core') },
      { find: '@app/ui', replacement: resolve(workspaceRoot, 'packages/ui/src') },
      { find: '@app/supabase', replacement: resolve(workspaceRoot, 'packages/supabase') },
      { find: '@app/schemas', replacement: resolve(workspaceRoot, 'packages/schemas/src') },
      {
        find: '@testing-library/react-native',
        replacement: resolve(workspaceRoot, 'tests/infrastructure/vitest/mocks/testing-library-react-native.ts'),
      },
      {
        find: 'expo-constants',
        replacement: resolve(workspaceRoot, 'tests/infrastructure/vitest/mocks/expo-constants.ts'),
      },
      { find: '@app/styleguide', replacement: resolve(workspaceRoot, 'packages/ui/src/styleguide') },
    ],
    conditions: ['browser', 'module', 'import', 'default'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    watch: false,
    testTimeout: 30_000, // 30 seconds per test
    hookTimeout: 10_000, // 10 seconds for hooks
    include: ['{apps,packages}/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/.tamagui/**',
      'packages/supabase/functions/trpc/__tests__/**',
      'packages/supabase/tests/**',
      'tests/e2e/**',
      'tests/infrastructure/**',
    ],
    setupFiles: [resolve(workspaceRoot, 'tests/infrastructure/vitest/setup.ts')],
    reporters: [quietReporterPath, 'hanging-process'],
    server: {
      deps: {
        inline: [
          '@testing-library/react-native',
          'expo-router',
          'tamagui',
          '@tamagui',
          'react-native',
          /^react-native\//,
        ],
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
        'packages/core/features/profile/utils/**/*.ts',
        'packages/core/features/discover/utils/**/*.ts',
        'packages/core/features/discover/hooks/**/*.ts',
        'packages/core/features/discover/providers/**/*.tsx',
        'packages/core/features/office/applications/hooks/**/*.ts',
        'packages/core/features/office/applications/components/ApplicationsFilters.tsx',
        'packages/core/features/office/cms-slide-form.tsx',
        'packages/core/features/office/components/JobForm.tsx',
        'packages/core/features/office/components/OrganizationForm.tsx',
        'packages/ui/src/components/image-picker/utils/**/*.ts',
        'packages/ui/src/components/image-picker/__tests__/**/*.ts',
        'packages/ui/src/components/image-picker/hooks/**/*.ts',
        'packages/ui/src/components/buttons/**/*.ts',
        'packages/ui/src/components/CustomToast.tsx',
        'packages/ui/src/components/inputs/**/*.ts',
        'packages/ui/src/components/ResponsiveModal.tsx',
        'packages/schemas/src/profile/**/*.ts',
        'packages/schemas/src/common/**/*.ts',
        'packages/schemas/src/jobs/**/*.ts',
      ],
      exclude: [
        'test/**',
        'tests/infrastructure/**',
        'tests/e2e/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/.expo/**',
        '**/.tamagui/**',
        '**/__tests__/**/fixtures/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'packages/supabase/functions/trpc/__tests__/**',
        'packages/supabase/tests/**',
        'packages/schemas/src/**/index.ts',
        'packages/schemas/src/jobs/job-update.schema.ts',
        'packages/schemas/src/jobs/types.ts',
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

