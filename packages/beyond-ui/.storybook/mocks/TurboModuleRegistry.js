// Mock for react-native/Libraries/TurboModule/TurboModuleRegistry
// TurboModules are a React Native optimization that doesn't apply to web
module.exports = {
  TurboModuleRegistry: {
    get: function(moduleName) {
      console.warn(`TurboModuleRegistry.get("${moduleName}") called in web environment - returning null`)
      return null
    },
    getEnforcing: function(moduleName) {
      console.warn(`TurboModuleRegistry.getEnforcing("${moduleName}") called in web environment - returning null`)
      return null
    }
  }
}
