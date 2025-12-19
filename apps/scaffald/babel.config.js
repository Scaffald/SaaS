const path = require('path')

const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development'
const ENV_FILE_MAP = {
  preview: '.env.preview',
  production: '.env.production',
  staging: '.env.staging',
}
const envFile = ENV_FILE_MAP[APP_ENV] || '.env'
const envPath = path.resolve(__dirname, '..', '..', envFile)
// eslint-disable-next-line no-console
console.log(`[babel] APP_ENV=${APP_ENV} envPath=${envPath}`)

module.exports = (api) => {
  api.cache(true)

  return {
    plugins: [
      [
        'module:react-native-dotenv',
        {
          allowlist: [
            'APP_ENV',
            'NODE_ENV',
            // Note: EXPO_PUBLIC_* variables should be accessed via process.env, not @env module
            // The @env module is mainly for APP_ENV
          ],
          allowUndefined: true,
          // SECURITY: Block all non-EXPO_PUBLIC variables to prevent secrets from being bundled
          // Note: react-native-dotenv doesn't support regex in allowlist, so we use blocklist
          // Only APP_ENV and EXPO_PUBLIC_* variables will be accessible
          blocklist: [
            // Block all non-EXPO_PUBLIC variables (except APP_ENV and NODE_ENV which are needed)
            // This is a safety measure - ideally only EXPO_PUBLIC_* vars should be used
          ],
          envName: 'APP_ENV',
          moduleName: '@env',
          path: envPath,
          safe: false,
          verbose: false,
        },
      ],
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          alias: {
            '@scf/core': '../../packages/scf-core',
            '@scf/schemas': '../../packages/scf-schemas/src',
            '@scf/supabase': '../../packages/supabase',
            '@scf/trpc': '../../packages/scf-trpc/src',
            '@scf/trpc/*': '../../packages/scf-trpc/src/*',
          },
          extensions: ['.js', '.jsx', '.tsx', '.ios.js', '.android.js'],
          root: ['../..'],
        },
      ],
      'react-native-reanimated/plugin',
      [
        '@tamagui/babel-plugin',
        {
          components: ['@unicornlove/ui', 'tamagui'],
          config: '../../packages/ui/src/tamagui.config.ts',
          logTimings: true,
          // Extraction enabled for proper native component behavior
          // disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
    ],
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
  }
}
