import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  // Disable DTS for now - styled component types require complex bundling
  // Consumers can use source for types or we'll add explicit type annotations later
  dts: false,
  clean: true,
  external: ['react', 'react-dom', 'react-native', '@unicornlove/beyond-ui', 'lucide-react-native', '@tanstack/react-table'],
  treeshake: true,
  sourcemap: true,
})
