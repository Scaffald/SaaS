const { getDefaultConfig } = require('expo/metro-config')
const withStorybook = require('@storybook/react-native/metro/withStorybook')
const path = require('path')

// Resolve monorepo root (two levels up from this app)
const workspaceRoot = path.resolve(__dirname, '../..')
const projectRoot = __dirname

const config = getDefaultConfig(projectRoot)

// Watch all packages in the monorepo
config.watchFolders = [workspaceRoot]

// Resolve node_modules from both the app and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Enable symlinks so pnpm workspace links resolve correctly
config.resolver.unstable_enableSymlinks = true

// Deduplicate React and Reanimated — force ALL requires to the workspace root copy.
// extraNodeModules can't beat nested node_modules; resolveRequest can.
const DEDUPE = ['react', 'react-native', 'react-native-reanimated']
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pkg = DEDUPE.find(p => moduleName === p || moduleName.startsWith(p + '/'))
  if (pkg) {
    const rootPkg = path.resolve(workspaceRoot, 'node_modules', pkg)
    const subpath = moduleName.slice(pkg.length) // '' or '/jsx-runtime' etc.
    // Re-resolve from the root package directory so Metro uses the right copy
    return context.resolveRequest(
      { ...context, originModulePath: path.join(rootPkg, 'package.json') },
      moduleName,
      platform
    )
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withStorybook(config, {
  enabled: process.env.STORYBOOK_ENABLED === 'true',
  configPath: path.resolve(__dirname, './.storybook'),
})
