/**
 * Vitest configuration for forsured-web
 * Standalone config - uses mocks for @unicornlove/ui to avoid react-native deps
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * Plugin to handle type-only exports and prevent SSR transform issues
 * This prevents Rollup from trying to parse type exports during SSR transform
 */
function handleTypeExportsForSSR(): Plugin {
  return {
    name: 'handle-type-exports-ssr',
    enforce: 'pre',
    transform(code, id, options) {
      // Skip SSR transformation entirely for test files
      // Tests don't need SSR, and this prevents Rollup parsing errors
      if (options?.ssr && (id.includes('.test.') || id.includes('.spec.'))) {
        return null; // Let regular transform handle it
      }
      
      // For SSR transforms, strip type-only exports to prevent parsing errors
      if (options?.ssr) {
        // Remove type-only export statements that Rollup can't parse
        const stripped = code.replace(/^export\s+type\s+.*from\s+['"][^'"]+['"];?\s*$/gm, '');
        if (stripped !== code) {
          return { code: stripped, map: null };
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    handleTypeExportsForSSR(),
    react({
      // Use SWC for faster transforms and better TypeScript support
      jsxRuntime: 'automatic',
    }),
  ],
  // Disable SSR for tests - tests run in jsdom, not SSR environment
  ssr: {
    noExternal: ['@unicornlove/beyond-ui'],
  },
  resolve: {
    alias: {
      // Local app alias
      '@': resolve(packageRoot, 'src'),
      // Use mock for @unicornlove/ui to avoid react-native dependency chain
      '@unicornlove/ui': resolve(packageRoot, 'src/test/__mocks__/@unicornlove/ui.tsx'),
      // Use mock for @unicornlove/beyond-ui to avoid react-native dependency chain
      '@unicornlove/beyond-ui': resolve(packageRoot, 'src/test/__mocks__/@unicornlove/beyond-ui.tsx'),
      // Shim expo-router (forsured-web uses react-router-dom)
      'expo-router': resolve(packageRoot, 'src/shims/expo-router-shim.ts'),
      // Point to source for forsured packages (not yet built)
      '@unicornlove/compliance': resolve(packageRoot, '../../packages/compliance/src/index.ts'),
      '@unicornlove/insurance': resolve(packageRoot, '../../packages/insurance/src/index.ts'),
      '@unicornlove/forsured': resolve(packageRoot, '../../packages/forsured/src/index.ts'),
      '@unicornlove/tasks': resolve(packageRoot, '../../packages/tasks/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
      'tests/performance/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Configure dependency handling for tests
    server: {
      deps: {
        inline: ['@unicornlove/beyond-ui'],
      },
    },
    setupFiles: [resolve(packageRoot, 'src/test/setup.ts')],
    globalSetup: resolve(packageRoot, 'src/test/globalSetup.ts'),
    globalTeardown: resolve(packageRoot, 'src/test/globalTeardown.ts'),
    testTimeout: 10000,
    // Ensure proper cleanup
    teardownTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    // Force exit after tests complete
    passWithNoTests: true,
  },
});
