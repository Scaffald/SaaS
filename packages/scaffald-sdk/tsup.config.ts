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
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    external: ['react', '@tanstack/react-query'],
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
    splitting: false,
    treeshake: true,
    outDir: 'dist/react',
    external: ['react', '@tanstack/react-query'],
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.js',
      }
    },
  },
])
