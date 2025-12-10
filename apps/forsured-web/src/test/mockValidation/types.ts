/**
 * REQ-306: Mock Validation Framework Types
 *
 * Core interfaces for the mock validation system that ensures
 * all testing mocks accurately represent their real implementations.
 */

/**
 * Represents a single validation error with details about the mismatch
 */
export interface ValidationError {
  /** The field or method that failed validation */
  field: string;
  /** The expected value or behavior */
  expected: string;
  /** The actual value or behavior found */
  actual: string;
  /** Human-readable error message */
  message: string;
  /** Optional guidance on how to fix the issue */
  howToFix?: string;
}

/**
 * Result of a single mock validator's execution
 */
export interface ValidationResult {
  /** Whether all validations passed */
  success: boolean;
  /** Name of the mock being validated */
  mockName: string;
  /** List of validation errors (empty if success is true) */
  errors: ValidationError[];
  /** Execution time in milliseconds */
  durationMs: number;
}

/**
 * Contract that all mock validators must implement
 */
export interface MockValidator {
  /** Unique name identifying this validator */
  readonly name: string;

  /**
   * Execute validation and return results
   * Must be idempotent and have no side effects
   */
  validate(): Promise<ValidationResult>;
}

/**
 * Aggregated results from all validators
 */
export interface AggregatedValidationResults {
  /** Whether all validations passed */
  allPassed: boolean;
  /** Total execution time in milliseconds */
  totalDurationMs: number;
  /** Number of validators that passed */
  passedCount: number;
  /** Number of validators that failed */
  failedCount: number;
  /** Individual results from each validator */
  results: ValidationResult[];
}

/**
 * Options for validation execution
 */
export interface ValidationOptions {
  /** Stop on first validation failure (default: true) */
  failFast?: boolean;
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
  /** Maximum time allowed for all validations in ms (default: 15000) */
  timeoutMs?: number;
}

/**
 * Terminal color codes for formatted output
 */
export const TERMINAL_COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
} as const;
