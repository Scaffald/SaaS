import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  external: ['react', '@tanstack/react-query'],
})
