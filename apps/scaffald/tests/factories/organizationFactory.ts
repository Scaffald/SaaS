/**
 * Organization Factory
 *
 * Creates test organizations in the core schema
 */

import { testSupabase } from '../testDb';
import type { FactoryOptions } from './index';
import { testSlug } from './index';

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
}

export interface CreateTestOrganizationOptions extends FactoryOptions {
  name?: string;
  slug?: string;
  ownerId: string; // Required: must specify owner
  metadata?: Record<string, unknown>;
}

/**
 * Create a test organization in the core schema
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * const org = await createTestOrganization({ ownerId: user.id, tracker });
 * await cleanupTestData(tracker); // Auto-deletes org and user
 */
export async function createTestOrganization(
  options: CreateTestOrganizationOptions
): Promise<TestOrganization> {
  const {
    name = `Test Organization ${Date.now()}`,
    slug = testSlug('org'),
    ownerId,
    metadata = {},
    tracker,
  } = options;

  const { data, error } = await testSupabase
    .schema('core' as never)
    .from('organizations')
    .insert({
      name,
      slug,
      owner_user_id: ownerId,
      metadata,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test organization: ${error?.message}`);
  }

  // Track for cleanup
  if (tracker) {
    tracker.organizations.push(data.id);
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    owner_user_id: data.owner_user_id,
  } as TestOrganization;
}

/**
 * Create multiple test organizations for the same owner
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * const orgs = await createTestOrganizations(3, { ownerId: user.id, tracker });
 */
export async function createTestOrganizations(
  count: number,
  options: CreateTestOrganizationOptions
): Promise<TestOrganization[]> {
  const orgs: TestOrganization[] = [];

  for (let i = 0; i < count; i++) {
    const org = await createTestOrganization({
      ...options,
      name: `Test Organization ${i + 1} - ${Date.now()}`,
      slug: testSlug(`org${i}`),
    });
    orgs.push(org);
  }

  return orgs;
}
