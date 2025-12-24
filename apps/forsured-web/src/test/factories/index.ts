/**
 * Test Factories
 *
 * Provides factory functions for creating real test data in the database.
 * REQ-9: Testing Policy - No mocking of owned code
 *
 * These factories create actual database records for integration testing.
 * All created records should be tracked and cleaned up after tests.
 */

import { testSupabase, CreatedTestData } from '../testDb';

export interface FactoryOptions {
  /** Whether to track the created record for cleanup (default: true) */
  track?: boolean;
  /** Test data tracker to use for cleanup */
  tracker?: CreatedTestData;
}

/**
 * Generate a unique test identifier
 * @param prefix - Optional prefix for the identifier
 */
export function testId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Base factory helper for inserting test data
 */
export async function insertTestData<T extends { id: string }>(
  schema: string,
  table: string,
  data: Partial<T>,
  options: FactoryOptions = {}
): Promise<T> {
  const { data: result, error } = await testSupabase
    .schema(schema as never)
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test ${table}: ${error.message}`);
  }

  return result as T;
}

// Re-export all factories
export * from './projectFactory';
export * from './subcontractorFactory';
export * from './taskFactory';
export * from './complianceFactory';
