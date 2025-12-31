/**
 * Test Database Infrastructure Tests
 * Verifies that test database utilities are working correctly
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { verifyDatabaseConnection, getTestOrganizationId } from './testDb';

describe('Test Database Infrastructure', () => {
  beforeAll(async () => {
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      console.warn(
        '\n⚠️  Skipping database tests - Supabase not running.\n' +
        'Start Supabase with: pnpm supa:start\n'
      );
    }
  });

  test('can connect to test database', async () => {
    const isConnected = await verifyDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  test('can query test organization', async () => {
    const orgId = await getTestOrganizationId();
    // Organization ID should exist or be null (if no orgs yet)
    expect(orgId === null || typeof orgId === 'string').toBe(true);
  });
});
