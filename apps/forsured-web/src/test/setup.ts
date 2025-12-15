/**
 * Vitest setup file
 * Configures testing environment and matchers
 */

import '@testing-library/jest-dom';
import { afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Set up environment variables for tests
 */
process.env.VITE_ENCRYPTION_KEY_ID = 'test-key-id';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';
// Vite env vars for Supabase (used by import.meta.env)
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
// Skip Supabase mock validation tests in unit tests (they require real Supabase)
// Set to empty string to run them against a real Supabase instance
process.env.SKIP_SUPABASE_TESTS = 'true';

/**
 * Mock window.matchMedia for jsdom
 * Required for Tamagui components that use media queries
 * Made robust to handle edge cases during test cleanup
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
 * Mock File.prototype.arrayBuffer for jsdom
 * Required for DocumentService which uses file.arrayBuffer() for hash generation
 */
if (typeof File.prototype.arrayBuffer !== 'function') {
  File.prototype.arrayBuffer = function () {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(this);
    });
  };
}

/**
 * Cleanup after each test
 * Ensures React components are unmounted and DOM is cleaned
 */
afterEach(() => {
  // Clean up React Testing Library's rendered components
  cleanup();
  // Clear all mock call history but preserve implementations
  vi.clearAllMocks();
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
  // Note: We don't call vi.restoreAllMocks() as it would remove
  // critical browser API mocks (matchMedia, ResizeObserver) that
  // might still be needed during final component cleanup
});
