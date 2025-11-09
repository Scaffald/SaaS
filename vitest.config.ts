import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))

const plugins: PluginOption[] = [react() as PluginOption]

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
  },
})

