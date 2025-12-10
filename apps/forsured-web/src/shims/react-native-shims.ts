// Shims for React Native internal modules that don't exist in react-native-web
// These are required by react-native-reanimated and react-native-svg for web builds

// ReactFabric shim - used by react-native-reanimated
export const findNodeHandle = () => null;
export const findHostInstance_DEPRECATED = () => null;

// TurboModuleRegistry shim - used by react-native-reanimated, react-native-svg, react-native-worklets
// This is a no-op registry for web that returns null for all module requests
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => {
    // Return a proxy that returns null for any method call
    return new Proxy({}, {
      get: () => () => null,
    });
  },
};

// codegenNativeComponent shim - used by react-native-svg
const codegenNativeComponent = (name: string) => {
  // Return a no-op component for web
  return () => null;
};

export default codegenNativeComponent;
