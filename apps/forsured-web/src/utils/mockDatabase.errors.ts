// Supabase-compatible error interface
export interface SupabaseError {
  message: string;
  code: string;
  details?: string;
  hint?: string;
}

// PostgreSQL and Supabase error codes
export const ERROR_CODES = {
  // PostgreSQL constraint violation codes
  NOT_NULL_VIOLATION: '23502',
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',

  // Supabase API error codes
  NOT_FOUND: 'PGRST116',
  MULTIPLE_ROWS: 'PGRST116', // Supabase uses same code for both scenarios
} as const;

/**
 * Format "not found" error (0 results when expecting 1)
 */
export function formatNotFoundError(table?: string): SupabaseError {
  return {
    code: ERROR_CODES.NOT_FOUND,
    message: 'No rows found',
    details: table ? `No record found in table "${table}"` : 'The result contains 0 rows',
    hint: 'Check your filters or use a different query method if you expect zero results',
  };
}

/**
 * Format "multiple rows" error (2+ results when expecting 1)
 */
export function formatMultipleRowsError(count: number, table?: string): SupabaseError {
  return {
    code: ERROR_CODES.MULTIPLE_ROWS,
    message: 'Multiple rows found',
    details: table
      ? `Found ${count} records in table "${table}" when expecting 1`
      : `The result contains ${count} rows`,
    hint: 'Use a more specific filter to narrow down to a single record, or use a method that accepts multiple results',
  };
}

/**
 * Format NOT NULL constraint violation error
 */
export function formatNotNullError(column: string, table?: string): SupabaseError {
  return {
    code: ERROR_CODES.NOT_NULL_VIOLATION,
    message: `null value in column "${column}" violates not-null constraint`,
    details: table
      ? `Failing row in table "${table}" contains null in column "${column}"`
      : `Column "${column}" cannot be null`,
    hint: `Provide a value for "${column}"`,
  };
}

/**
 * Format UNIQUE constraint violation error
 */
export function formatUniqueError(column: string, value: any, table?: string): SupabaseError {
  return {
    code: ERROR_CODES.UNIQUE_VIOLATION,
    message: `duplicate key value violates unique constraint "${table ? table + '_' : ''}${column}_key"`,
    details: `Key (${column})=(${value}) already exists.`,
    hint: `Ensure the value of "${column}" is unique`,
  };
}

/**
 * Format FOREIGN KEY constraint violation error
 */
export function formatForeignKeyError(
  column: string,
  referencedTable: string,
  value: any,
  table?: string
): SupabaseError {
  return {
    code: ERROR_CODES.FOREIGN_KEY_VIOLATION,
    message: table
      ? `insert or update on table "${table}" violates foreign key constraint`
      : 'foreign key constraint violation',
    details: `Key (${column})=(${value}) is not present in table "${referencedTable}".`,
    hint: `Ensure the referenced record exists in "${referencedTable}"`,
  };
}

/**
 * Format CHECK constraint violation error
 */
export function formatCheckError(message: string, column?: string, table?: string): SupabaseError {
  return {
    code: ERROR_CODES.CHECK_VIOLATION,
    message: table
      ? `new row for relation "${table}" violates check constraint`
      : `check constraint violation: ${message}`,
    details: message,
    hint: column ? `Check the value of "${column}"` : 'Review the constraint requirements for this field',
  };
}

/**
 * Format generic database error
 */
export function formatDatabaseError(message: string, code: string = 'PGRST301'): SupabaseError {
  return {
    code,
    message,
    details: message,
  };
}
