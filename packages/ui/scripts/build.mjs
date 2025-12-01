#!/usr/bin/env node
import { build } from 'esbuild'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))

const external = [
  'react',
  'react-dom',
  'react-native',
  'tamagui',
  '@tamagui/core',
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

await build({
  entryPoints: [
    'src/index.tsx',
    'src/types/geographic.ts',
    'src/types/phone.ts',
  ],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  external,
  sourcemap: true,
  platform: 'neutral',
  target: 'es2020',
  outExtension: {
    '.js': '.mjs',
  },
}).catch((error) => {
  console.error('Build failed:', error.message)
  process.exit(1)
})

console.log('✅ Build complete!')

