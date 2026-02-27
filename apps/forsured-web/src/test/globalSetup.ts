/**
 * Vitest Global Setup
 *
 * Runs mock validation BEFORE any tests execute.
 * If validation fails, tests are halted with clear error messages.
 *
 * This file is referenced in vitest.config.ts as globalSetup.
 * It runs once before all test files are loaded.
 */

import { MockValidationFramework } from './mockValidation';

/**
 * Global setup function - runs before all tests
 * Validates all mocks and halts execution if any fail
 */
export default async function globalSetup(): Promise<void> {
  const framework = MockValidationFramework.getInstance();
  const validators = framework.getValidators();

  // Skip validation if no validators are registered
  // This allows tests to run during initial development
  if (validators.length === 0) {
    console.log('\n⚠️  No mock validators registered. Skipping mock validation.\n');
    return;
  }

  console.log('\n🔍 Running mock validation before tests...\n');

  try {
    const results = await framework.validateAll({
      failFast: true,
      verbose: true,
      timeoutMs: 15000, // TR-2: Total validation time < 15 seconds
    });

    if (!results.allPassed) {
      // Throw error to halt test execution
      throw new Error(
        `Mock validation failed. ${results.failedCount} validator(s) failed.\n` +
        'Tests cannot run until mocks accurately represent real implementations.\n' +
        'See errors above for details on how to fix.'
      );
    }

    console.log('✅ All mocks validated successfully. Proceeding with tests...\n');
  } catch (error) {
    // Re-throw with clear message
    if (error instanceof Error) {
      throw new Error(`Mock Validation Failed:\n${error.message}`);
    }
    throw error;
  }
}

/**
 * Global teardown function - runs after all tests complete
 * Can be used for cleanup if needed
 */
export async function teardown(): Promise<void> {
  // Reset the framework instance for clean state
  MockValidationFramework.resetInstance();
}
