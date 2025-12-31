/**
 * REQ-7: Mock Validation Framework
 * Public exports for the mock validation system
 */

export {
  MockValidationFramework,
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from './MockValidationFramework';

export type {
  MockValidator,
  ValidationResult,
  ValidationError,
  AggregatedValidationResults,
  ValidationOptions,
} from './types';

export { TERMINAL_COLORS } from './types';
