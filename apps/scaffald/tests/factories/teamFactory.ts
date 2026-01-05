/**
 * Team Factory
 *
 * Creates test teams in the core schema
 */

import { testSupabase } from '../testDb';
import type { FactoryOptions } from './index';
import { testSlug } from './index';

export interface TestTeam {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
}

export interface CreateTestTeamOptions extends FactoryOptions {
  name?: string;
  slug?: string;
  organizationId: string; // Required: must specify organization
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a test team in the core schema
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * const org = await createTestOrganization({ ownerId: user.id, tracker });
 * const team = await createTestTeam({ organizationId: org.id, tracker });
 * await cleanupTestData(tracker); // Auto-deletes team, org, user
 */
export async function createTestTeam(
  options: CreateTestTeamOptions
): Promise<TestTeam> {
  const {
    name = `Test Team ${Date.now()}`,
    slug = testSlug('team'),
    organizationId,
    description = 'Test team description',
    metadata = {},
    tracker,
  } = options;

  const { data, error } = await testSupabase
    .schema('core' as never)
    .from('teams')
    .insert({
      name,
      slug,
      organization_id: organizationId,
      description,
      metadata,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test team: ${error?.message}`);
  }

  // Track for cleanup
  if (tracker) {
    tracker.teams.push(data.id);
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    organization_id: data.organization_id,
  } as TestTeam;
}

/**
 * Create multiple test teams for the same organization
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * const org = await createTestOrganization({ ownerId: user.id, tracker });
 * const teams = await createTestTeams(3, { organizationId: org.id, tracker });
 */
export async function createTestTeams(
  count: number,
  options: CreateTestTeamOptions
): Promise<TestTeam[]> {
  const teams: TestTeam[] = [];

  for (let i = 0; i < count; i++) {
    const team = await createTestTeam({
      ...options,
      name: `Test Team ${i + 1} - ${Date.now()}`,
      slug: testSlug(`team${i}`),
    });
    teams.push(team);
  }

  return teams;
}
