// Mock for react-native/Libraries/ReactNative/requireNativeComponent
// This is a no-op for web since native components don't exist in the browser
module.exports = function requireNativeComponent(viewName) {
  console.warn(`requireNativeComponent("${viewName}") called in web environment - returning View`)
  // Return a basic View component mock
  return function MockNativeComponent() {
    return null
  }
}
