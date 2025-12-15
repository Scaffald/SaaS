/**
 * Vitest configuration for forsured-web
 * Standalone config - uses mocks for @unicornlove/ui to avoid react-native deps
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Local app alias
      '@': resolve(packageRoot, 'src'),
      // Use mock for @unicornlove/ui to avoid react-native dependency chain
      '@unicornlove/ui': resolve(packageRoot, 'src/test/__mocks__/@unicornlove/ui.tsx'),
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
    setupFiles: [resolve(packageRoot, 'src/test/setup.ts')],
    testTimeout: 10000,
  },
});
