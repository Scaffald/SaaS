/**
 * Vitest Global Teardown
 *
 * Runs after ALL tests complete (success or failure).
 * Ensures proper cleanup of any global resources.
 */

import { MockValidationFramework } from './mockValidation';

/**
 * Global teardown function - runs after all tests complete
 * Cleans up global resources and ensures process exits cleanly
 */
export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Running global teardown...\n');

  try {
    // Reset the mock validation framework
    MockValidationFramework.resetInstance();

    // Clear any module cache that might hold references
    // This helps ensure clean exit

    console.log('✅ Global teardown complete.\n');
  } catch (error) {
    console.error('⚠️ Error during global teardown:', error);
    // Don't throw - we want tests to complete even if teardown has issues
  }
}
