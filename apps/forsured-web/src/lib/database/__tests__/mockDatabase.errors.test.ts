/**
 * Error Factory Tests
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * These tests validate that error factory functions produce PostgreSQL/PostgREST-compatible
 * error objects with correct error codes, messages, and structure.
 *
 * MANDATORY per CLAUDE.md: "mocks used in tests must always be validated"
 */

import { describe, it, expect } from 'vitest';
import {
  PG_ERROR_CODES,
  POSTGREST_ERROR_CODES,
  createNotNullError,
  createUniqueViolationError,
  createForeignKeyError,
  createCheckViolationError,
  createRangeViolationError,
  createInvalidEnumError,
  createUndefinedColumnError,
  createUndefinedTableError,
  createNoRowsError,
  createMultipleRowsError,
  createGenericError,
  isUniqueViolation,
  isForeignKeyViolation,
  isNotNullViolation,
  isCheckViolation,
  isSingleRowError,
} from '../mockDatabase.errors';

describe('PostgreSQL Error Code Constants', () => {
  it('should have correct PostgreSQL error codes', () => {
    // Data Exception (Class 22)
    expect(PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION).toBe('22P02');

    // Integrity Constraint Violation (Class 23)
    expect(PG_ERROR_CODES.NOT_NULL_VIOLATION).toBe('23502');
    expect(PG_ERROR_CODES.FOREIGN_KEY_VIOLATION).toBe('23503');
    expect(PG_ERROR_CODES.UNIQUE_VIOLATION).toBe('23505');
    expect(PG_ERROR_CODES.CHECK_VIOLATION).toBe('23514');

    // Syntax Error or Access Rule Violation (Class 42)
    expect(PG_ERROR_CODES.UNDEFINED_COLUMN).toBe('42703');
    expect(PG_ERROR_CODES.UNDEFINED_TABLE).toBe('42P01');
  });

  it('should have correct PostgREST error codes', () => {
    expect(POSTGREST_ERROR_CODES.PGRST116).toBe('PGRST116');
  });
});

describe('Error Factory: createNotNullError', () => {
  it('should create error with code 23502', () => {
    const error = createNotNullError('email', 'users');

    expect(error.code).toBe('23502');
    expect(error.message).toContain('null value');
    expect(error.message).toContain('email');
    expect(error.message).toContain('not-null constraint');
    expect(error.details).toBeDefined();
    expect(error.hint).toBeDefined();
  });

  it('should include column name in message and details', () => {
    const error = createNotNullError('manager_id', 'projects');

    expect(error.message).toContain('manager_id');
    expect(error.details).toContain('manager_id');
    expect(error.hint).toContain('manager_id');
  });
});

describe('Error Factory: createUniqueViolationError', () => {
  it('should create error with code 23505', () => {
    const error = createUniqueViolationError('users', 'email', 'test@example.com');

    expect(error.code).toBe('23505');
    expect(error.message).toContain('duplicate key value');
    expect(error.message).toContain('unique constraint');
    expect(error.details).toBeDefined();
    expect(error.hint).toBeDefined();
  });

  it('should include constraint name format', () => {
    const error = createUniqueViolationError('policies', 'policy_number', 'POL-123');

    expect(error.message).toContain('policies_policy_number_key');
    expect(error.details).toContain('policy_number');
    expect(error.details).toContain('POL-123');
  });
});

describe('Error Factory: createForeignKeyError', () => {
  it('should create error with code 23503', () => {
    const error = createForeignKeyError('manager_id', 'invalid-uuid', 'users');

    expect(error.code).toBe('23503');
    expect(error.message).toContain('Foreign key violation');
    expect(error.details).toBeDefined();
    expect(error.hint).toBeDefined();
  });

  it('should include referenced table in message', () => {
    const error = createForeignKeyError('document_id', 'doc-123', 'documents');

    expect(error.message).toContain('document_id');
    expect(error.message).toContain('documents');
    expect(error.details).toContain('doc-123');
    expect(error.hint).toContain('documents');
  });
});

describe('Error Factory: createCheckViolationError', () => {
  it('should create error with code 23514', () => {
    const error = createCheckViolationError('end_date must be after start_date');

    expect(error.code).toBe('23514');
    expect(error.message).toBe('end_date must be after start_date');
    expect(error.details).toBeDefined();
    expect(error.hint).toBeDefined();
  });

  it('should use custom details when provided', () => {
    const error = createCheckViolationError('Invalid date range', 'Custom details here');

    expect(error.details).toBe('Custom details here');
  });
});

describe('Error Factory: createRangeViolationError', () => {
  it('should create error with code 23514 for below minimum', () => {
    const error = createRangeViolationError('score', -5, 0, 100);

    expect(error.code).toBe('23514');
    expect(error.message).toContain('below minimum');
    expect(error.message).toContain('-5');
    expect(error.message).toContain('0');
    expect(error.details).toContain('score');
  });

  it('should create error with code 23514 for above maximum', () => {
    const error = createRangeViolationError('score', 150, 0, 100);

    expect(error.code).toBe('23514');
    expect(error.message).toContain('exceeds maximum');
    expect(error.message).toContain('150');
    expect(error.message).toContain('100');
  });
});

describe('Error Factory: createInvalidEnumError', () => {
  it('should create error with code 22P02', () => {
    const error = createInvalidEnumError('role', 'invalid_role', ['manager', 'admin', 'broker']);

    expect(error.code).toBe('22P02');
    expect(error.message).toContain('invalid input value');
    expect(error.message).toContain('invalid_role');
    expect(error.details).toContain('manager');
    expect(error.details).toContain('admin');
    expect(error.details).toContain('broker');
  });
});

describe('Error Factory: createUndefinedColumnError', () => {
  it('should create error with code 42703', () => {
    const error = createUndefinedColumnError('invalid_col', 'users', ['id', 'email', 'role']);

    expect(error.code).toBe('42703');
    expect(error.message).toContain('invalid_col');
    expect(error.message).toContain('does not exist');
    expect(error.hint).toContain('id');
    expect(error.hint).toContain('email');
    expect(error.hint).toContain('role');
  });

  it('should include context when provided', () => {
    const error = createUndefinedColumnError('bad_col', 'users', ['id'], 'eq filter');

    expect(error.details).toContain('eq filter');
  });
});

describe('Error Factory: createUndefinedTableError', () => {
  it('should create error with code 42P01', () => {
    const error = createUndefinedTableError('non_existent_table');

    expect(error.code).toBe('42P01');
    expect(error.message).toContain('non_existent_table');
    expect(error.message).toContain('does not exist');
    expect(error.hint).toBeDefined();
  });
});

describe('Error Factory: createNoRowsError', () => {
  it('should create error with code PGRST116', () => {
    const error = createNoRowsError();

    expect(error.code).toBe('PGRST116');
    expect(error.message).toContain('No rows found');
    expect(error.details).toContain('0 rows');
    expect(error.hint).toBeDefined();
  });
});

describe('Error Factory: createMultipleRowsError', () => {
  it('should create error with code PGRST116', () => {
    const error = createMultipleRowsError(5);

    expect(error.code).toBe('PGRST116');
    expect(error.message).toContain('multiple rows');
    expect(error.message).toContain('single row');
    expect(error.details).toContain('5');
  });
});

describe('Error Factory: createGenericError', () => {
  it('should create error with consistent structure', () => {
    const error = createGenericError('Something went wrong');

    expect(error.code).toBeDefined();
    expect(error.message).toBe('Something went wrong');
    expect(error.details).toBe('Something went wrong');
    expect(error.hint).toBeDefined();
  });
});

describe('Error Type Guards', () => {
  it('isUniqueViolation should correctly identify unique violations', () => {
    const uniqueError = createUniqueViolationError('users', 'email', 'test@test.com');
    const otherError = createNotNullError('email', 'users');

    expect(isUniqueViolation(uniqueError)).toBe(true);
    expect(isUniqueViolation(otherError)).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });

  it('isForeignKeyViolation should correctly identify FK violations', () => {
    const fkError = createForeignKeyError('manager_id', 'invalid', 'users');
    const otherError = createNotNullError('email', 'users');

    expect(isForeignKeyViolation(fkError)).toBe(true);
    expect(isForeignKeyViolation(otherError)).toBe(false);
    expect(isForeignKeyViolation(null)).toBe(false);
  });

  it('isNotNullViolation should correctly identify not-null violations', () => {
    const notNullError = createNotNullError('email', 'users');
    const otherError = createUniqueViolationError('users', 'email', 'test@test.com');

    expect(isNotNullViolation(notNullError)).toBe(true);
    expect(isNotNullViolation(otherError)).toBe(false);
    expect(isNotNullViolation(null)).toBe(false);
  });

  it('isCheckViolation should correctly identify check violations', () => {
    const checkError = createCheckViolationError('end_date must be after start_date');
    const otherError = createNotNullError('email', 'users');

    expect(isCheckViolation(checkError)).toBe(true);
    expect(isCheckViolation(otherError)).toBe(false);
    expect(isCheckViolation(null)).toBe(false);
  });

  it('isSingleRowError should correctly identify PGRST116 errors', () => {
    const noRowsError = createNoRowsError();
    const multipleRowsError = createMultipleRowsError(3);
    const otherError = createNotNullError('email', 'users');

    expect(isSingleRowError(noRowsError)).toBe(true);
    expect(isSingleRowError(multipleRowsError)).toBe(true);
    expect(isSingleRowError(otherError)).toBe(false);
    expect(isSingleRowError(null)).toBe(false);
  });
});

describe('Error Object Structure', () => {
  it('all error factories should return objects with code, message, details, hint', () => {
    const errors = [
      createNotNullError('col', 'table'),
      createUniqueViolationError('table', 'col', 'value'),
      createForeignKeyError('col', 'value', 'ref_table'),
      createCheckViolationError('message'),
      createRangeViolationError('col', 50, 0, 100),
      createInvalidEnumError('col', 'value', ['a', 'b']),
      createUndefinedColumnError('col', 'table', ['valid']),
      createUndefinedTableError('table'),
      createNoRowsError(),
      createMultipleRowsError(5),
      createGenericError('message'),
    ];

    for (const error of errors) {
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('details');
      expect(error).toHaveProperty('hint');
      expect(typeof error.code).toBe('string');
      expect(typeof error.message).toBe('string');
      expect(typeof error.details).toBe('string');
      expect(typeof error.hint).toBe('string');
    }
  });
});
