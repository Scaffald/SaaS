/**
 * Project Factory
 *
 * Creates real project records in the database for testing.
 * REQ-9: Testing Policy - No mocking of owned code
 */

import { testSupabase, CreatedTestData } from '../testDb';
import { testId, FactoryOptions } from './index';

export interface TestProject {
  id: string;
  name: string;
  organization_id: string;
  manager_id?: string;
  scaffald_project_id?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

interface CreateProjectOptions extends FactoryOptions {
  name?: string;
  organizationId?: string;
  managerId?: string;
  status?: 'active' | 'completed' | 'archived';
}

/**
 * Create a test project with defaults
 */
export async function createTestProject(
  options: CreateProjectOptions = {}
): Promise<TestProject> {
  // Get a valid organization ID if not provided
  let organizationId = options.organizationId;
  if (!organizationId) {
    const { data: org } = await testSupabase
      .schema('core' as never)
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!org) {
      throw new Error('No organization found for test project');
    }
    organizationId = org.id;
  }

  const projectData = {
    name: options.name || `Test Project ${testId()}`,
    organization_id: organizationId,
    manager_id: options.managerId,
    status: options.status || 'active',
  };

  const { data: result, error } = await testSupabase
    .schema('forsured' as never)
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test project: ${error.message}`);
  }

  // Track for cleanup
  if (options.track !== false && options.tracker) {
    options.tracker.projects.push(result.id);
  }

  return result as TestProject;
}

/**
 * Create a project with compliance requirements
 */
export async function createTestProjectWithRequirements(
  options: CreateProjectOptions & {
    requirements?: Array<{
      coverageType: string;
      minimumAmount: number;
    }>;
  } = {}
): Promise<{ project: TestProject; requirements: any[] }> {
  const project = await createTestProject(options);

  const defaultRequirements = options.requirements || [
    { coverageType: 'general_liability', minimumAmount: 1000000 },
    { coverageType: 'workers_comp', minimumAmount: 500000 },
  ];

  const requirements = [];
  for (const req of defaultRequirements) {
    const { data, error } = await testSupabase
      .schema('forsured' as never)
      .from('compliance_requirements')
      .insert({
        project_id: project.id,
        organization_id: project.organization_id,
        coverage_type: req.coverageType,
        minimum_amount: req.minimumAmount,
      })
      .select()
      .single();

    if (!error && data) {
      requirements.push(data);
    }
  }

  return { project, requirements };
}

/**
 * Get an existing test project or create one
 */
export async function getOrCreateTestProject(
  options: CreateProjectOptions = {}
): Promise<TestProject> {
  // Try to find existing project first
  const { data: existing } = await testSupabase
    .schema('forsured' as never)
    .from('projects')
    .select('*')
    .limit(1)
    .single();

  if (existing) {
    return existing as TestProject;
  }

  // Create new if none exists
  return createTestProject(options);
}
