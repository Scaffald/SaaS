/**
 * Test Factories
 *
 * Factories for creating test data in the database.
 * All factories accept a `tracker` parameter for automatic cleanup.
 *
 * Usage:
 *   const tracker = createTestDataTracker();
 *   const user = await createTestUser({ tracker });
 *   const org = await createTestOrganization({ ownerId: user.id, tracker });
 *
 *   // At end of test:
 *   await cleanupTestData(tracker);
 */

import type { CreatedTestData } from '../testDb';

export interface FactoryOptions {
  /** Test data tracker for automatic cleanup */
  tracker?: CreatedTestData;
}

/**
 * Generate a unique test ID for entities
 */
export function testId(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate a unique test email
 */
export function testEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a unique test slug
 */
export function testSlug(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
