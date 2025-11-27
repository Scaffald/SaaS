// Mock for expo-modules-core
// This module is used by various Expo libraries but requires native module registry
// In test environment, we provide stubs for all the required APIs

const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const mockNativeModuleProxy = new Proxy(
  {},
  {
    get: () => mockLogger,
  }
);

export const NativeModulesProxy = mockNativeModuleProxy;
export const ExpoModulesCoreJSLogger = mockLogger;

export default {
  NativeModulesProxy: mockNativeModuleProxy,
  ExpoModulesCoreJSLogger: mockLogger,
};
