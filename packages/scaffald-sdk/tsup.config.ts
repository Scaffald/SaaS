import { defineConfig } from 'tsup'

export default defineConfig([
  // Core SDK bundle
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false, // Temporarily disabled until @types/node is properly resolved
    clean: true,
    sourcemap: true,
    minify: true,
    splitting: true, // Enable code splitting for better tree-shaking
    treeshake: {
      preset: 'smallest', // Aggressive tree-shaking
      propertyReadSideEffects: false,
    },
    outDir: 'dist',
    external: ['react', '@tanstack/react-query'],
    esbuildOptions(options) {
      options.mangleProps = /^_/ // Mangle private properties
      options.legalComments = 'none' // Remove comments
      options.target = 'es2020' // Target modern browsers
    },
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.js',
      }
    },
  },
  // React package bundle
  {
    entry: ['src/react/index.ts'],
    format: ['esm', 'cjs'],
    dts: false, // Temporarily disabled until @types/node is properly resolved
    sourcemap: true,
    minify: true,
    splitting: true, // Enable code splitting
    treeshake: {
      preset: 'smallest',
      propertyReadSideEffects: false,
    },
    outDir: 'dist/react',
    external: ['react', '@tanstack/react-query'],
    esbuildOptions(options) {
      options.mangleProps = /^_/
      options.legalComments = 'none'
      options.target = 'es2020'
    },
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.js',
      }
    },
  },
  // OAuth standalone bundle (optional)
  {
    entry: ['src/auth/oauth.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    minify: true,
    splitting: false,
    treeshake: {
      preset: 'smallest',
      propertyReadSideEffects: false,
    },
    outDir: 'dist/oauth',
    esbuildOptions(options) {
      options.mangleProps = /^_/
      options.legalComments = 'none'
      options.target = 'es2020'
    },
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.js',
      }
    },
  },
  // Webhooks standalone bundle (optional)
  {
    entry: ['src/webhooks/verify.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    minify: true,
    splitting: false,
    treeshake: {
      preset: 'smallest',
      propertyReadSideEffects: false,
    },
    outDir: 'dist/webhooks',
    esbuildOptions(options) {
      options.mangleProps = /^_/
      options.legalComments = 'none'
      options.target = 'es2020'
    },
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.js',
      }
    },
  },
])
