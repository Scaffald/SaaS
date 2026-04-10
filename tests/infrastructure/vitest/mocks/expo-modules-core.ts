// Mock for expo-modules-core
// This module is used by various Expo libraries but requires native module registry
// In test environment, we provide stubs for all the required APIs
import { vi } from 'vitest'

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

const mockNativeModule = new Proxy(
  {},
  {
    get: () => vi.fn(),
    apply: () => mockNativeModule,
  }
) as Record<string, unknown>;

export const NativeModulesProxy = mockNativeModuleProxy;
export const ExpoModulesCoreJSLogger = mockLogger;
export const requireNativeModule = vi.fn(() => mockNativeModule);
export const requireOptionalNativeModule = vi.fn(() => null);
export const EventEmitter = vi.fn().mockImplementation(() => ({
  addListener: vi.fn(),
  removeAllListeners: vi.fn(),
}));
export const SharedObject = vi.fn();
export const NativeModule = vi.fn();
export const createPermissionHook = vi.fn(() => () => [null, vi.fn(), vi.fn()]);
export const PermissionStatus = { UNDETERMINED: 'undetermined', GRANTED: 'granted', DENIED: 'denied' };

export default {
  NativeModulesProxy: mockNativeModuleProxy,
  ExpoModulesCoreJSLogger: mockLogger,
  requireNativeModule,
  requireOptionalNativeModule,
  EventEmitter,
};
