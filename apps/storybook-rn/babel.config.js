module.exports = (api) => {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      '@babel/plugin-transform-class-static-block',
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
