// temp: ignore bundle error
process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS = 'moti'

module.exports = (api) => {
  api.cache(false)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '../../.env',
          blocklist: null,
          allowlist: null,
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
            // define aliases to shorten the import paths
            '@app/core': '../../packages/core',
            '@app/ui': '../../packages/ui',
            '@app/api': '../../packages/api',
            '@app/supabase': '../../supabase',
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
          disableExtraction: false,
        },
      ],
      [
        'transform-inline-environment-variables',
        {
          include: ['EXPO_OS', 'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
        },
      ],
    ],
  }
}
