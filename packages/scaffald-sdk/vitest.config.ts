import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, '../../node_modules/react/jsx-runtime'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'scripts/',
        'examples/',
        '**/__tests__/**',
        '**/mocks/**',
        'src/react/index.ts', // Barrel re-exports only
      ],
      thresholds: {
        statements: 65,
        branches: 70,
        functions: 60,
        lines: 65,
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
