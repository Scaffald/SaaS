/**
 * Vitest setup file for Scaffald
 * Configures testing environment and matchers
 *
 * REQ-9: Testing Policy
 * Tests run against real Supabase (local instance at localhost:54321).
 * No database mocking - if we own it, we test it directly.
 */

import '@testing-library/jest-dom';
import { afterEach, afterAll, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react-native';

/**
 * Set up environment variables for tests
 * Uses local Supabase instance (pnpm supa start)
 */
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
process.env.TEST_SUPABASE_URL = 'http://localhost:54321';
process.env.TEST_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

/**
 * Mock AsyncStorage for React Native
 * Required for Supabase auth client which uses AsyncStorage for persistence
 */
const asyncStorageData = new Map<string, string>();

const AsyncStorageMock = {
  getItem: vi.fn(async (key: string) => asyncStorageData.get(key) ?? null),
  setItem: vi.fn(async (key: string, value: string) => {
    asyncStorageData.set(key, value);
  }),
  removeItem: vi.fn(async (key: string) => {
    asyncStorageData.delete(key);
  }),
  clear: vi.fn(async () => {
    asyncStorageData.clear();
  }),
  getAllKeys: vi.fn(async () => [...asyncStorageData.keys()]),
  multiGet: vi.fn(async (keys: string[]) =>
    keys.map(key => [key, asyncStorageData.get(key) ?? null])
  ),
  multiSet: vi.fn(async (keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => asyncStorageData.set(key, value));
  }),
  multiRemove: vi.fn(async (keys: string[]) => {
    keys.forEach(key => asyncStorageData.delete(key));
  }),
};

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: AsyncStorageMock,
}));

/**
 * Mock window.matchMedia for jsdom
 * Required for Tamagui components that use media queries
 */
const createMatchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => false),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(createMatchMediaMock),
});

/**
 * Mock ResizeObserver for jsdom
 * Required for some Tamagui components
 */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

/**
 * Mock requestAnimationFrame for jsdom
 * Required for React Native animations and transitions
 */
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

/**
 * Run Mock Validation Framework before all tests
 * REQ-9: Ensures all mocks match their real implementations
 */
beforeAll(async () => {
  const { MockValidationFramework } = await import('./mockValidation');

  const framework = MockValidationFramework.getInstance();

  // Register all mock validators
  const { SentryValidator } = await import('./mockValidation/validators/SentryValidator');
  const { MapboxValidator } = await import('./mockValidation/validators/MapboxValidator');
  const { GoogleSignInValidator } = await import('./mockValidation/validators/GoogleSignInValidator');

  framework.registerValidator(new SentryValidator());
  framework.registerValidator(new MapboxValidator());
  framework.registerValidator(new GoogleSignInValidator());

  // Run mock validation with fail-fast and verbose output
  const results = await framework.validateAll({
    failFast: true,
    verbose: true,
    timeoutMs: 15000,
  });

  // Fail the test suite if mock validation fails
  if (!results.allPassed) {
    throw new Error('Mock validation failed. Fix mocks before running tests.');
  }

  // Verify Supabase is running
  const { verifyDatabaseConnection } = await import('./testDb');
  const isConnected = await verifyDatabaseConnection();

  if (!isConnected) {
    console.warn(
      '\n⚠️  WARNING: Could not connect to Supabase.\n' +
      'Make sure Supabase is running locally:\n' +
      '  pnpm supa:start\n'
    );
  }
});

/**
 * Cleanup after each test
 * Ensures React Native components are unmounted and storage is cleaned
 */
afterEach(() => {
  // Clean up React Testing Library's rendered components
  cleanup();
  // Clear all mock call history but preserve implementations
  vi.clearAllMocks();
  // Clear AsyncStorage between tests to prevent test pollution
  asyncStorageData.clear();
});

/**
 * Final cleanup after all tests complete
 * Ensures vitest properly exits
 */
afterAll(() => {
  // Clear any pending timers
  vi.clearAllTimers();
  // Use real timers if fake timers were enabled
  vi.useRealTimers();
});
