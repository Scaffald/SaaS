// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config')}
 */
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(__dirname, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// https://github.com/supabase/supabase-js/issues/1400#issuecomment-2843653869
config.resolver.unstable_enablePackageExports = false

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Enable inline environment variables for web builds
  inlineRequires: true,
}
config.transformer.minifierPath = require.resolve('metro-minify-terser')

// Web-specific optimizations
config.resolver.platforms = ['native', 'web', 'ios', 'android']

// Ensure proper asset handling for web
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'gif',
  'webp',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2',
]

config.resetCache = true

module.exports = config
