import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@scaffald/ui',
    'react-native',
    'react-native-web',
    'react-native-svg',
    'lucide-react-native',
    '@react-native-async-storage/async-storage',
  ],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'react-native$': 'react-native-web',
    }
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...(config.resolve.extensions ?? []),
    ]
    return config
  },
}

export default nextConfig
