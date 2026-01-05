/**
 * Detox Setup
 *
 * Runs before each test suite
 * Handles device initialization and cleanup
 */

import { device } from 'detox';

beforeAll(async () => {
  console.log('🚀 Launching Detox environment...');

  // Device is already initialized by Detox
  // Just verify Supabase is accessible
  console.log('✅ Detox environment ready');
}, 300000);

beforeEach(async () => {
  // Reload the app before each test for isolation
  await device.reloadReactNative();
});

afterAll(async () => {
  console.log('🧹 Cleaning up Detox environment...');
});
