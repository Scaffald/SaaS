const { defineConfig } = require('tsup')

module.exports = defineConfig({
  entry: {
    index: 'src/index.ts',
    'tokens/index': 'src/tokens/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
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
    console.log('✅ @scaffald/ui build complete')
  },
})
