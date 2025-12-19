/**
 * Test setup for encryption tests
 */

import { beforeAll, afterEach, vi } from "vitest";

// Set up test environment variables
beforeAll(() => {
  process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
  process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  process.env.VITE_ENCRYPTION_KEY_ID = "test-key-id";
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock crypto.randomBytes for Node.js environment
if (typeof crypto === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.crypto = require("crypto").webcrypto as Crypto;
}
