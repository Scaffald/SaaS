import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.tsx',
    'types/geographic': 'src/types/geographic.ts',
    'types/phone': 'src/types/phone.ts',
  },
  format: ['esm'],
  dts: false, // Disabled due to complex type inference issues with Dialog, Popover, Sheet, and animations
  splitting: false,
  sourcemap: true,
  clean: true,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    // Skip CSS imports that aren't available at build time
    options.loader = {
      ...options.loader,
      '.css': 'empty',
    }
    // Disable type checking completely
    options.tsconfigRaw = {
      compilerOptions: {
        skipLibCheck: true,
        noEmit: true,
      },
    }
  },
  onSuccess: async () => {
    console.log('✅ Build complete - type declarations disabled due to complex type inference')
  },
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
    'expo-router',
    'tamagui',
    '@tamagui/core',
    '@tamagui/animations-moti',
    '@tamagui/animations-react-native',
    '@tamagui/font-inter',
    '@tamagui/helpers-icon',
    '@tamagui/lucide-icons',
    '@tamagui/theme-builder',
    '@tamagui/toast',
    '@tanstack/react-table',
    '@tiptap/core',
    '@tiptap/extension-placeholder',
    '@tiptap/extension-underline',
    '@tiptap/react',
    '@tiptap/starter-kit',
    '@ts-react/form',
    '@hookform/resolvers',
    'react-hook-form',
    'zod',
    'moti',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-dropzone',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
    'awesome-phonenumber',
    '@react-navigation/elements',
  ],
  noExternal: [],
})

