/**
 * Test setup for all component tests
 * Document upload and storage test setup
 */

// Set up test environment variables IMMEDIATELY at module load time
// (before any imports that might use env validation)
// Only set defaults if not already set (allows integration tests to use real values from .env.local)
// Vite env vars (frontend)
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
}
if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
}
if (!process.env.VITE_ENCRYPTION_KEY_ID) {
  process.env.VITE_ENCRYPTION_KEY_ID = "test-key-id";
}

// Next.js style env vars (for server/tRPC tests)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
}
if (!process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN = "http://localhost:3000";
}
process.env.NODE_ENV = "test";

import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock crypto for Node.js environment
if (typeof crypto === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.crypto = require("crypto").webcrypto as Crypto;
}

// Mock File.prototype.arrayBuffer for Node.js test environment
if (typeof File !== "undefined" && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = async function (this: File) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock window.matchMedia for theme/UI components (used by Select, etc.)
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
