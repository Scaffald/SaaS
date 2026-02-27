/**
 * Mock Validation Framework
 *
 * Core framework for validating all testing mocks against their real implementations
 * before any tests execute. Implements singleton pattern for global access.
 */

import type {
  MockValidator,
  ValidationResult,
  AggregatedValidationResults,
  ValidationOptions,
  ValidationError,
} from './types';
import { TERMINAL_COLORS } from './types';

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  failFast: true,
  verbose: false,
  timeoutMs: 15000,
};

/**
 * MockValidationFramework - Singleton framework for mock validation
 *
 * Ensures all mocks match their real implementations before tests run.
 * Register validators and execute them in parallel before the test suite.
 */
export class MockValidationFramework {
  private static instance: MockValidationFramework | null = null;
  private validators: MockValidator[] = [];
  private options: Required<ValidationOptions> = { ...DEFAULT_OPTIONS };

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of the framework
   */
  static getInstance(): MockValidationFramework {
    if (!MockValidationFramework.instance) {
      MockValidationFramework.instance = new MockValidationFramework();
    }
    return MockValidationFramework.instance;
  }

  /**
   * Reset the singleton instance (useful for testing the framework itself)
   */
  static resetInstance(): void {
    MockValidationFramework.instance = null;
  }

  /**
   * Register a mock validator
   */
  registerValidator(validator: MockValidator): void {
    // Prevent duplicate registration
    if (this.validators.some(v => v.name === validator.name)) {
      throw new Error(`Validator "${validator.name}" is already registered`);
    }
    this.validators.push(validator);
  }

  /**
   * Get all registered validators
   */
  getValidators(): readonly MockValidator[] {
    return [...this.validators];
  }

  /**
   * Clear all registered validators
   */
  clearValidators(): void {
    this.validators = [];
  }

  /**
   * Set validation options
   */
  setOptions(options: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Execute all registered validators
   * Returns aggregated results and throws if any validation fails
   */
  async validateAll(overrideOptions?: Partial<ValidationOptions>): Promise<AggregatedValidationResults> {
    const opts = { ...this.options, ...overrideOptions };
    const startTime = Date.now();

    if (this.validators.length === 0) {
      return {
        allPassed: true,
        totalDurationMs: 0,
        passedCount: 0,
        failedCount: 0,
        results: [],
      };
    }

    this.log(opts.verbose, `\n${TERMINAL_COLORS.cyan}${TERMINAL_COLORS.bold}Starting Mock Validation${TERMINAL_COLORS.reset}`);
    this.log(opts.verbose, `${TERMINAL_COLORS.dim}Running ${this.validators.length} validator(s)...${TERMINAL_COLORS.reset}\n`);

    const results: ValidationResult[] = [];
    let failed = false;

    // Run validators in parallel for performance
    const validationPromises = this.validators.map(async (validator) => {
      const validatorStart = Date.now();
      try {
        const result = await this.runWithTimeout(
          validator.validate(),
          opts.timeoutMs,
          validator.name
        );
        return result;
      } catch (error) {
        // Handle timeout or other errors
        const duration = Date.now() - validatorStart;
        return {
          success: false,
          mockName: validator.name,
          errors: [{
            field: 'execution',
            expected: 'successful validation',
            actual: error instanceof Error ? error.message : 'unknown error',
            message: `Validator threw an exception: ${error instanceof Error ? error.message : 'unknown error'}`,
          }],
          durationMs: duration,
        } as ValidationResult;
      }
    });

    if (opts.failFast) {
      // Execute in parallel but check results as they come in
      for (const promise of validationPromises) {
        const result = await promise;
        results.push(result);

        if (!result.success) {
          failed = true;
          this.reportSingleResult(result, opts.verbose);
          break; // Stop on first failure in failFast mode
        } else {
          this.reportSingleResult(result, opts.verbose);
        }
      }
    } else {
      // Execute all validators and collect results
      const allResults = await Promise.all(validationPromises);
      results.push(...allResults);

      for (const result of results) {
        this.reportSingleResult(result, opts.verbose);
        if (!result.success) {
          failed = true;
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const passedCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    const aggregated: AggregatedValidationResults = {
      allPassed: !failed,
      totalDurationMs: totalDuration,
      passedCount,
      failedCount,
      results,
    };

    this.reportSummary(aggregated);

    return aggregated;
  }

  /**
   * Run a promise with a timeout
   */
  private async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    validatorName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Validator "${validatorName}" timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Report a single validation result to console
   */
  private reportSingleResult(result: ValidationResult, verbose: boolean): void {
    const { green, red, yellow, reset, bold, dim } = TERMINAL_COLORS;

    if (result.success) {
      console.log(`${green}✓${reset} ${result.mockName} ${dim}(${result.durationMs}ms)${reset}`);
    } else {
      console.log(`${red}✗${reset} ${bold}${result.mockName}${reset} ${dim}(${result.durationMs}ms)${reset}`);

      // Print detailed errors
      for (const error of result.errors) {
        this.reportError(error, verbose);
      }
    }
  }

  /**
   * Report a single validation error with TR-3 format
   */
  private reportError(error: ValidationError, verbose: boolean): void {
    const { red, yellow, dim, reset, cyan } = TERMINAL_COLORS;

    console.log(`\n${red}  Error in: ${error.field}${reset}`);
    console.log(`${dim}  Expected:${reset} ${error.expected}`);
    console.log(`${dim}  Actual:${reset}   ${error.actual}`);

    if (error.message) {
      console.log(`${yellow}  Message:${reset}  ${error.message}`);
    }

    if (error.howToFix && verbose) {
      console.log(`\n${cyan}  How to fix:${reset}`);
      const lines = error.howToFix.split('\n');
      for (const line of lines) {
        console.log(`    ${line}`);
      }
    }
    console.log('');
  }

  /**
   * Report summary of all validation results
   */
  private reportSummary(results: AggregatedValidationResults): void {
    const { green, red, yellow, reset, bold, dim, cyan } = TERMINAL_COLORS;

    console.log(`\n${cyan}${'─'.repeat(50)}${reset}`);
    console.log(`${bold}Mock Validation Summary${reset}`);
    console.log(`${cyan}${'─'.repeat(50)}${reset}\n`);

    console.log(`  Total Time: ${dim}${results.totalDurationMs}ms${reset}`);
    console.log(`  Validators: ${results.passedCount + results.failedCount}`);
    console.log(`  ${green}Passed: ${results.passedCount}${reset}`);

    if (results.failedCount > 0) {
      console.log(`  ${red}Failed: ${results.failedCount}${reset}`);
    }

    console.log('');

    if (results.allPassed) {
      console.log(`${green}${bold}All mock validations passed!${reset}\n`);
    } else {
      const totalErrors = results.results.reduce((sum, r) => sum + r.errors.length, 0);
      console.log(`${red}${bold}Mock validation failed with ${totalErrors} error(s)${reset}`);
      console.log(`${yellow}Tests will not run until mocks are fixed.${reset}\n`);
    }
  }

  /**
   * Conditional logging based on verbose flag
   */
  private log(verbose: boolean, message: string): void {
    if (verbose) {
      console.log(message);
    }
  }
}

/**
 * Helper to create a validation error
 */
export function createValidationError(
  field: string,
  expected: string,
  actual: string,
  message: string,
  howToFix?: string
): ValidationError {
  return { field, expected, actual, message, howToFix };
}

/**
 * Helper to create a successful validation result
 */
export function createSuccessResult(mockName: string, durationMs: number): ValidationResult {
  return {
    success: true,
    mockName,
    errors: [],
    durationMs,
  };
}

/**
 * Helper to create a failed validation result
 */
export function createFailedResult(
  mockName: string,
  errors: ValidationError[],
  durationMs: number
): ValidationResult {
  return {
    success: false,
    mockName,
    errors,
    durationMs,
  };
}
