/**
 * Vitest setup file
 * Configures testing environment and matchers
 *
 * REQ-9: Testing Policy
 * Tests run against real Supabase (local instance at localhost:54321).
 * No database mocking - if we own it, we test it directly.
 */

import '@testing-library/jest-dom';
import { afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Set up environment variables for tests
 * Uses local Supabase instance (pnpm supa start)
 */
process.env.VITE_ENCRYPTION_KEY_ID = 'test-key-id';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.CORS_ORIGIN = 'http://localhost:3000';
// Vite env vars for Supabase (used by import.meta.env)
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

/**
 * Mock localStorage and sessionStorage for jsdom
 * Required for Supabase auth client which uses browser storage
 * Prevents "storage.getItem is not a function" errors during auth cleanup
 */
const storageDataLocal = new Map<string, string>();
const storageDataSession = new Map<string, string>();

const createStorageMock = (dataMap: Map<string, string>): Storage => ({
  getItem: (key: string) => dataMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    dataMap.set(key, value);
  },
  removeItem: (key: string) => {
    dataMap.delete(key);
  },
  clear: () => {
    dataMap.clear();
  },
  key: (index: number) => [...dataMap.keys()][index] ?? null,
  get length() {
    return dataMap.size;
  },
});

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(storageDataLocal),
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(storageDataSession),
  writable: true,
  configurable: true,
});

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
  // Clear storage between tests to prevent test pollution
  storageDataLocal.clear();
  storageDataSession.clear();
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
