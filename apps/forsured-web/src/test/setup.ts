/**
 * Vitest setup file
 * Configures testing environment and matchers
 *
 * Testing policy
 * Tests run against real Supabase (local instance at localhost:54321).
 * No database mocking - if we own it, we test it directly.
 */

import "@testing-library/jest-dom";
import { afterAll, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { config } from "dotenv";

/**
 * Load environment variables from .env.test file
 * Falls back to hardcoded defaults if file doesn't exist
 * Note: .env.test is in the root directory, not in apps/forsured-web
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from src/test/setup.ts -> src/test -> src -> apps/forsured-web -> apps -> root
const packageRoot = resolve(__dirname, "../../../..");
const envTestPath = resolve(packageRoot, ".env.test");
if (existsSync(envTestPath)) {
  config({ path: envTestPath });
  console.log(`✅ Loaded environment variables from ${envTestPath}`);
} else {
  console.warn(`⚠️  .env.test not found at ${envTestPath}, using defaults`);
}

/**
 * Set up environment variables for tests
 * Uses local Supabase instance (pnpm supa start)
 * Values from .env.test will override these defaults
 */
process.env.VITE_ENCRYPTION_KEY_ID = process.env.VITE_ENCRYPTION_KEY_ID ||
  "test-key-id";
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
// Vite env vars for Supabase (used by import.meta.env)
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL ||
  "http://localhost:54321";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
process.env.VITE_SUPABASE_SERVICE_ROLE_KEY =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Email configuration for tests (can be overridden in .env.test)
process.env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ||
  "test-sendgrid-api-key";
process.env.SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_FROM_ADDRESS || "test@forsured.test";
process.env.SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME ||
  process.env.EMAIL_FROM_NAME || "ForSured Test";

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

Object.defineProperty(window, "localStorage", {
  value: createStorageMock(storageDataLocal),
  writable: true,
  configurable: true,
});

Object.defineProperty(window, "sessionStorage", {
  value: createStorageMock(storageDataSession),
  writable: true,
  configurable: true,
});

/**
 * Mock window.matchMedia for jsdom
 * Required for Beyond UI components that use media queries
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

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(createMatchMediaMock),
});

/**
 * Mock ResizeObserver for jsdom
 * Required for some Beyond UI components
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
if (typeof File.prototype.arrayBuffer !== "function") {
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
