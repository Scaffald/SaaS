/**
 * Project Factory
 *
 * Creates test projects in the core schema
 */

import { testSupabase } from '../testDb';
import type { FactoryOptions } from './index';
import { testSlug } from './index';

export interface TestProject {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
}

export interface CreateTestProjectOptions extends FactoryOptions {
  name?: string;
  slug?: string;
  organizationId: string; // Required: must specify organization
  description?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a test project in the core schema
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * const org = await createTestOrganization({ ownerId: user.id, tracker });
 * const project = await createTestProject({ organizationId: org.id, tracker });
 * await cleanupTestData(tracker); // Auto-deletes project, org, user
 */
export async function createTestProject(
  options: CreateTestProjectOptions
): Promise<TestProject> {
  const {
    name = `Test Project ${Date.now()}`,
    slug = testSlug('project'),
    organizationId,
    description = 'Test project description',
    status = 'active',
    metadata = {},
    tracker,
  } = options;

  const { data, error } = await testSupabase
    .schema('core' as never)
    .from('projects')
    .insert({
      name,
      slug,
      organization_id: organizationId,
      description,
      status,
      metadata,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test project: ${error?.message}`);
  }

  // Track for cleanup
  if (tracker) {
    tracker.projects.push(data.id);
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    organization_id: data.organization_id,
  } as TestProject;
}

/**
 * Create multiple test projects for the same organization
 *
 * @example
 * const tracker = createTestDataTracker();
 * const user = await createTestUser({ tracker });
 * const org = await createTestOrganization({ ownerId: user.id, tracker });
 * const projects = await createTestProjects(3, { organizationId: org.id, tracker });
 */
export async function createTestProjects(
  count: number,
  options: CreateTestProjectOptions
): Promise<TestProject[]> {
  const projects: TestProject[] = [];

  for (let i = 0; i < count; i++) {
    const project = await createTestProject({
      ...options,
      name: `Test Project ${i + 1} - ${Date.now()}`,
      slug: testSlug(`project${i}`),
    });
    projects.push(project);
  }

  return projects;
}
