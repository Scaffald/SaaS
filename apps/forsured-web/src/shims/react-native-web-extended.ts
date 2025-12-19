/**
 * Extended react-native-web shim that re-exports everything from react-native-web
 * and adds missing exports that native-only packages expect
 *
 * This is used as the alias target for 'react-native' imports
 */

// Re-export everything from react-native-web
export * from 'react-native-web';

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
