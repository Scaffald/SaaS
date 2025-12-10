/**
 * REQ-306: Mock Validation Framework
 *
 * Barrel export for the mock validation system.
 * Import validators from here and register them with the framework.
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

// Validators
export { MockDatabaseValidator } from './validators/MockDatabaseValidator';
export { MockOCRServiceValidator } from './validators/MockOCRServiceValidator';
export { TaskMocksValidator } from './validators/TaskMocksValidator';
export { MockDataStoreValidator } from './validators/MockDataStoreValidator';
