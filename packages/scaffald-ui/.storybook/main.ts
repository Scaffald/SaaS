import type { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  webpackFinal: async (config) => {
    // React Native Web alias support
    config.resolve = config.resolve || {}

    // Prioritize .web.tsx and .web.ts extensions for web builds
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ]

    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      // Alias react-native-svg to a mock for web to avoid React Native internals
      'react-native-svg': require.resolve('./mocks/react-native-svg.jsx'),
      // Alias lucide-react-native to lucide-react for web compatibility
      'lucide-react-native': 'lucide-react',
      // Mock React Native internal modules that don't have web equivalents
      'react-native/Libraries/ReactNative/requireNativeComponent': require.resolve('./mocks/requireNativeComponent.js'),
      'react-native/Libraries/Alert/RCTAlertManager': require.resolve('./mocks/RCTAlertManager.js'),
      'react-native/Libraries/TurboModule/TurboModuleRegistry': require.resolve('./mocks/TurboModuleRegistry.js'),
    }

    // Ensure TypeScript files are processed by babel-loader
    if (config.module?.rules) {
      const rules = config.module.rules

      // Add babel-loader for React Native .js files (to handle Flow syntax)
      rules.push({
        test: /\.js$/,
        include: /node_modules\/react-native\//,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              presets: [
                [require.resolve('@babel/preset-env'), { targets: { browsers: ['last 2 versions'] } }],
                [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
                [require.resolve('@babel/preset-flow'), { allowDeclareFields: true }],
              ],
            },
          },
        ],
      })

      // Find the rule that handles TypeScript files
      const tsRule = rules.find((rule: any) => {
        if (rule && typeof rule === 'object' && rule.test) {
          return rule.test.toString().includes('tsx?')
        }
        return false
      })

      // If no TypeScript rule exists, add one
      if (!tsRule) {
        rules.push({
          test: /\.(ts|tsx)$/,
          exclude: /node_modules\/(?!(@scaffald\/ui))/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                presets: [
                  [require.resolve('@babel/preset-env'), { targets: { browsers: ['last 2 versions'] } }],
                  [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
                  require.resolve('@babel/preset-typescript'),
                ],
              },
            },
          ],
        })
      }

      // Add babel-loader for .storybook mocks with JSX
      rules.push({
        test: /\.(js|jsx)$/,
        include: /\.storybook\/mocks/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              presets: [
                [require.resolve('@babel/preset-env'), { targets: { browsers: ['last 2 versions'] } }],
                [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
              ],
            },
          },
        ],
      })
    }

    return config
  },
}

export default config

