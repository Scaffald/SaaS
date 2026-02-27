/**
 * Mock Validation Framework
 *
 * Barrel export for the mock validation system.
 * Import validators from here and register them with the framework.
 *
 * Note: Per testing policy, only external third-party service mocks
 * are allowed. Internal systems (database, tRPC) must be tested directly
 * against real implementations.
 */

// Core types
export type {
  MockValidator,
  ValidationResult,
  ValidationError,
  AggregatedValidationResults,
  ValidationOptions,
} from './types';

export { TERMINAL_COLORS } from './types';

// Framework
export {
  MockValidationFramework,
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from './MockValidationFramework';

// Validators - only for external service mocks
export { MockOCRServiceValidator } from './validators/MockOCRServiceValidator';
