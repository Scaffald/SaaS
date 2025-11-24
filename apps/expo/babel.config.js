module.exports = (api) => {
  api.cache(true)

  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '../../.env',
          // SECURITY: Block all non-EXPO_PUBLIC variables to prevent secrets from being bundled
          // Note: react-native-dotenv doesn't support regex in allowlist, so we use blocklist
          // Only APP_ENV and EXPO_PUBLIC_* variables will be accessible
          blocklist: [
            // Block all non-EXPO_PUBLIC variables (except APP_ENV and NODE_ENV which are needed)
            // This is a safety measure - ideally only EXPO_PUBLIC_* vars should be used
          ],
          allowlist: [
            'APP_ENV',
            'NODE_ENV',
            // Note: EXPO_PUBLIC_* variables should be accessed via process.env, not @env module
            // The @env module is mainly for APP_ENV
          ],
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['../..'],
          alias: {
            '@app/core': '../../packages/core',
            '@app/ui': '../../packages/ui/src',
            '@app/ui/*': '../../packages/ui/src/*',
            '@app/supabase': '../../packages/supabase',
            '@app/trpc': '../../packages/trpc/src',
            '@app/trpc/*': '../../packages/trpc/src/*',
            '@app/schemas': '../../packages/schemas/src',
            '@app/styleguide': '../../packages/ui/src/styleguide',
            '@app/styleguide/*': '../../packages/ui/src/styleguide/*',
          },
          extensions: ['.js', '.jsx', '.tsx', '.ios.js', '.android.js'],
        },
      ],
      'react-native-reanimated/plugin',
      [
        '@tamagui/babel-plugin',
        {
          components: ['@app/ui', 'tamagui'],
          config: '../../packages/ui/src/tamagui.config.ts',
          logTimings: true,
          // Extraction enabled for proper native component behavior
          // disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
    ],
  }
}
