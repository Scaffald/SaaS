// Mock for react-native/Libraries/Utilities/codegenNativeComponent
// No-op for web; native codegen components are not used in the browser
module.exports = function codegenNativeComponent(_componentName) {
  return function MockCodegenComponent() {
    return null;
  };
};
