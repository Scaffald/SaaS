import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tokens/index': 'src/tokens/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false, // Using tsc for declaration generation instead
  splitting: false,
  sourcemap: true,
  clean: true,
  skipNodeModulesBundle: true,
  tsconfig: 'tsconfig.json',
  loader: {
    '.js': 'jsx',
  },
  external: [
    'react',
    'react-dom',
    'react-native',
    /^react-native\//,
    /^react-native-/,
    'expo',
    /^expo-/,
  ],
  onSuccess: async () => {
    console.log('✅ @unicornlove/beyond-ui build complete')
  },
})
