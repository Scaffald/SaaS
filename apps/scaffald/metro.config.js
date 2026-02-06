// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
})

// add nice web support with optimizing compiler + CSS extraction
const { withTamagui } = require('@tamagui/metro-plugin')

// Resolve config path - try package first, fallback to source
let configPath
try {
  configPath = require.resolve('@unicornlove/ui/tamagui.config')
} catch {
  // Fallback to source path for monorepo dev
  configPath = path.resolve(__dirname, '../../packages/ui/src/tamagui.config.ts')
}

const finalConfig = withTamagui(config, {
  components: ['@unicornlove/ui', 'tamagui'],
  config: configPath,
  outputCSS: './tamagui-web.css',
})

// Configure minifier to strip console in production
if (process.env.NODE_ENV === 'production') {
  finalConfig.transformer = {
    ...finalConfig.transformer,
    minifierConfig: {
      ...finalConfig.transformer?.minifierConfig,
      compress: {
        ...finalConfig.transformer?.minifierConfig?.compress,
        // Remove console.* calls except error/warn
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // Remove dead code
        dead_code: true,
      },
    },
  }
}

module.exports = finalConfig
