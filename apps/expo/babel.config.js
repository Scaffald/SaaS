// temp: ignore bundle error
process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS = 'solito/link,moti'

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
            '@app/core': './app/core',
            '@app/core/*': './app/core/*',
            '@app/ui': './packages/ui',
            '@app/ui/*': './packages/ui/*',
            '@app/api': './packages/api',
            '@app/api/*': './packages/api/*',
            '@app/supabase': './supabase',
            '@app/supabase/*': './supabase/*',
          },
          extensions: ['.js', '.jsx', '.tsx', '.ios.js', '.android.js'],
        },
      ],
      'react-native-reanimated/plugin',
      ...(process.env.EAS_BUILD_PLATFORM === 'android'
        ? []
        : [
            [
              '@tamagui/babel-plugin',
              {
                components: ['@app/ui', 'tamagui'],
                config: '../../packages/ui/src/tamagui.config.ts',
                disable: true,
              },
            ],
          ]),
      ['transform-inline-environment-variables', {}],
    ],
  }
}
