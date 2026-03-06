// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')
const fs = require('node:fs')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
})

// Prefer 'source' field in package.json exports so workspace packages like @scaffald/ui
// are bundled from TypeScript source directly — no build step needed during development.
config.resolver.unstable_enablePackageExports = true
config.resolver.unstable_conditionNames = [
  'source',
  'react-native',
  'browser',
  'require',
  'default',
]

// Resolve TypeScript ESM-style `.js` imports (e.g. `./provider.js` → `./provider.tsx`)
// This is needed for workspace packages (like @scaffald/sdk) that use moduleResolution:"bundler"
const originalResolveRequest = config.resolver?.resolveRequest
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName.endsWith('.js')) {
      const dir = path.dirname(context.originModulePath)
      const base = path.join(dir, moduleName.slice(0, -3))
      for (const ext of ['.tsx', '.ts']) {
        if (fs.existsSync(base + ext)) {
          return { type: 'sourceFile', filePath: base + ext }
        }
      }
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform)
    }
    return context.resolveRequest(context, moduleName, platform)
  },
}

// Configure minifier to strip console in production
if (process.env.NODE_ENV === 'production') {
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      ...config.transformer?.minifierConfig,
      compress: {
        ...config.transformer?.minifierConfig?.compress,
        // Remove console.* calls except error/warn
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // Remove dead code
        dead_code: true,
      },
    },
  }
}

module.exports = config
