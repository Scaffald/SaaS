// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')
const fs = require('node:fs')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
})

// Watch the monorepo root so changes to packages/* (e.g. @scf/core, @scaffald/ui)
// trigger Fast Refresh without needing a full reload.
const monorepoRoot = path.resolve(__dirname, '../..')
config.watchFolders = [monorepoRoot]

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

// @scaffald/ui must resolve to the SAME files in every bundle. Its package.json
// `exports` offers `source` (src/, TypeScript) and `import` (dist/, a tsup
// bundle). Every client and native bundle picks `source` through the
// conditions above, so Metro applies the platform forks in src/ — the
// `.web.tsx` icon files, `useSidebarState.web.ts`, and so on. The web SERVER
// bundle does not: Expo replaces the condition list with `['node']` for the
// server environment (withMetroMultiPlatform), which leaves only `import`, so
// the server rendered from dist/ — a bundle with no platform forks, i.e. the
// native files. The breadcrumb's Home icon was therefore lucide-react-native
// on the server and lucide-react on the client, the two draw different SVG,
// and React threw the server tree away on every load of /jobs/<slug> and
// /users/<slug> (#786). Pin the package to `source` here, before the
// condition list gets a say, so client and server bundle identical files.
const UI_PACKAGE_DIR = path.resolve(monorepoRoot, 'packages/ui')
const UI_PACKAGE_EXPORTS = require(path.join(UI_PACKAGE_DIR, 'package.json')).exports
function resolveUiPackageSource(moduleName) {
  if (moduleName !== '@scaffald/ui' && !moduleName.startsWith('@scaffald/ui/')) return null
  const subpath =
    moduleName === '@scaffald/ui' ? '.' : `./${moduleName.slice('@scaffald/ui/'.length)}`
  const source = UI_PACKAGE_EXPORTS[subpath]?.source
  return source ? { type: 'sourceFile', filePath: path.join(UI_PACKAGE_DIR, source) } : null
}

// Resolve TypeScript ESM-style `.js` imports (e.g. `./provider.js` → `./provider.tsx`)
// This is needed for workspace packages (like @scaffald/sdk) that use moduleResolution:"bundler"
const originalResolveRequest = config.resolver?.resolveRequest
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    const uiSource = resolveUiPackageSource(moduleName)
    if (uiSource) return uiSource
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
