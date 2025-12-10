/**
 * MockDatabase Error Factories
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * Centralized error factory functions that produce PostgreSQL/PostgREST-compatible
 * error objects. These are designed to match the exact error format and codes
 * returned by Supabase/PostgREST so contract tests can verify parity.
 *
 * PostgreSQL Error Codes Reference:
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 *
 * PostgREST Error Codes:
 * https://postgrest.org/en/stable/references/errors.html
 */

import type { DatabaseError } from '../../types/database.types';

// ============================================================================
// PostgreSQL Error Code Constants
// ============================================================================

export const PG_ERROR_CODES = {
  // Class 22 — Data Exception
  INVALID_TEXT_REPRESENTATION: '22P02',

  // Class 23 — Integrity Constraint Violation
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',

  // Class 42 — Syntax Error or Access Rule Violation
  UNDEFINED_COLUMN: '42703',
  UNDEFINED_TABLE: '42P01',
} as const;

export const POSTGREST_ERROR_CODES = {
  // Result has too many/too few rows
  PGRST116: 'PGRST116',
} as const;

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Creates a NOT NULL constraint violation error
 * PostgreSQL error code: 23502
 */
export function createNotNullError(columnName: string, tableName: string): DatabaseError {
  return {
    code: PG_ERROR_CODES.NOT_NULL_VIOLATION,
    message: `null value in column "${columnName}" violates not-null constraint`,
    details: `Failing row contains null value for "${columnName}"`,
    hint: `Provide a value for the required field "${columnName}"`,
  };
}

/**
 * Creates a UNIQUE constraint violation error
 * PostgreSQL error code: 23505
 */
export function createUniqueViolationError(
  tableName: string,
  columnName: string,
  value: unknown
): DatabaseError {
  return {
    code: PG_ERROR_CODES.UNIQUE_VIOLATION,
    message: `duplicate key value violates unique constraint "${tableName}_${columnName}_key"`,
    details: `Key (${columnName})=(${String(value)}) already exists`,
    hint: `Use a different value for ${columnName}`,
  };
}

/**
 * Creates a FOREIGN KEY constraint violation error
 * PostgreSQL error code: 23503
 */
export function createForeignKeyError(
  columnName: string,
  value: unknown,
  referencedTable: string
): DatabaseError {
  return {
    code: PG_ERROR_CODES.FOREIGN_KEY_VIOLATION,
    message: `Foreign key violation: ${columnName} references non-existent record in ${referencedTable}`,
    details: `Key (${columnName})=(${String(value)}) is not present in table "${referencedTable}"`,
    hint: `Ensure the referenced record exists in ${referencedTable}`,
  };
}

/**
 * Creates a CHECK constraint violation error
 * PostgreSQL error code: 23514
 */
export function createCheckViolationError(
  constraintMessage: string,
  details?: string
): DatabaseError {
  return {
    code: PG_ERROR_CODES.CHECK_VIOLATION,
    message: constraintMessage,
    details: details || constraintMessage,
    hint: 'Check the constraint requirements',
  };
}

/**
 * Creates a numeric range check violation error
 * PostgreSQL error code: 23514
 */
export function createRangeViolationError(
  columnName: string,
  value: number,
  min?: number,
  max?: number
): DatabaseError {
  const direction = min !== undefined && value < min ? 'below minimum' : 'exceeds maximum';
  const limit = min !== undefined && value < min ? min : max;

  return {
    code: PG_ERROR_CODES.CHECK_VIOLATION,
    message: `value ${value} is ${direction} ${limit} for column "${columnName}"`,
    details: `${columnName} must be between ${min ?? 0} and ${max ?? 'infinity'}`,
    hint: `Provide a value ${min !== undefined && value < min ? '>=' : '<='} ${limit}`,
  };
}

/**
 * Creates an invalid enum value error
 * PostgreSQL error code: 22P02
 */
export function createInvalidEnumError(
  columnName: string,
  value: unknown,
  validValues: readonly string[]
): DatabaseError {
  return {
    code: PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION,
    message: `invalid input value for enum: "${String(value)}"`,
    details: `Value must be one of: ${validValues.join(', ')}`,
    hint: `Check that the ${columnName} field contains a valid enum value`,
  };
}

/**
 * Creates an undefined column error
 * PostgreSQL error code: 42703
 */
export function createUndefinedColumnError(
  columnName: string,
  tableName: string,
  validColumns: string[],
  context?: string
): DatabaseError {
  return {
    code: PG_ERROR_CODES.UNDEFINED_COLUMN,
    message: `Column "${columnName}" does not exist in table "${tableName}"`,
    details: context
      ? `Invalid column in ${context}: ${columnName}`
      : `Invalid column: ${columnName}`,
    hint: `Valid columns are: ${validColumns.join(', ')}`,
  };
}

/**
 * Creates an undefined table error
 * PostgreSQL error code: 42P01
 */
export function createUndefinedTableError(tableName: string): DatabaseError {
  return {
    code: PG_ERROR_CODES.UNDEFINED_TABLE,
    message: `Table "${tableName}" does not exist`,
    details: `The table "${tableName}" was not found in the database schema`,
    hint: 'Check your table name and ensure it exists',
  };
}

/**
 * Creates a PostgREST "no rows" error for .single() queries
 * PostgREST error code: PGRST116
 */
export function createNoRowsError(): DatabaseError {
  return {
    code: POSTGREST_ERROR_CODES.PGRST116,
    message: 'No rows found',
    details: 'The result contains 0 rows',
    hint: 'Check your query filters',
  };
}

/**
 * Creates a PostgREST "multiple rows" error for .single() queries
 * PostgREST error code: PGRST116
 */
export function createMultipleRowsError(rowCount: number): DatabaseError {
  return {
    code: POSTGREST_ERROR_CODES.PGRST116,
    message: 'Query returned multiple rows when single row was expected',
    details: `Expected 1 row, got ${rowCount}`,
    hint: 'Add more specific filters or use select() instead of single()',
  };
}

/**
 * Creates a generic database error
 * Default code: 42P01 (undefined table - generic)
 */
export function createGenericError(message: string): DatabaseError {
  return {
    code: PG_ERROR_CODES.UNDEFINED_TABLE,
    message,
    details: message,
    hint: 'Check your query syntax and table/column names',
  };
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if an error is a unique constraint violation
 */
export function isUniqueViolation(error: DatabaseError | null): boolean {
  return error?.code === PG_ERROR_CODES.UNIQUE_VIOLATION;
}

/**
 * Check if an error is a foreign key violation
 */
export function isForeignKeyViolation(error: DatabaseError | null): boolean {
  return error?.code === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION;
}

/**
 * Check if an error is a not-null violation
 */
export function isNotNullViolation(error: DatabaseError | null): boolean {
  return error?.code === PG_ERROR_CODES.NOT_NULL_VIOLATION;
}

/**
 * Check if an error is a check constraint violation
 */
export function isCheckViolation(error: DatabaseError | null): boolean {
  return error?.code === PG_ERROR_CODES.CHECK_VIOLATION;
}

/**
 * Check if an error is a PostgREST single row error
 */
export function isSingleRowError(error: DatabaseError | null): boolean {
  return error?.code === POSTGREST_ERROR_CODES.PGRST116;
}
