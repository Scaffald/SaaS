/**
 * Mock validation framework
 * Public exports for the mock validation system
 */

export {
  createFailedResult,
  createSuccessResult,
  createValidationError,
  MockValidationFramework,
} from "./MockValidationFramework";

export type {
  AggregatedValidationResults,
  MockValidator,
  ValidationError,
  ValidationOptions,
  ValidationResult,
} from "./types";

export { TERMINAL_COLORS } from "./types";
