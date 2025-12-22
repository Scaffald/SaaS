/**
 * Contractor Test Data Seed Script
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * Creates test data for contractor/subcontractor E2E tests:
 * - Managers/Relationships
 * - Projects
 * - Documents
 * - Notifications
 * - Tasks
 * - Help Articles
 *
 * Usage:
 * ```typescript
 * import { seedContractorTestData, cleanupContractorTestData } from '../fixtures/seed-contractor-data';
 *
 * beforeAll(async () => {
 *   await seedContractorTestData({
 *     contractorUserId: TEST_USER_IDS.contractor,
 *     contractorOrgId: TEST_ORG_IDS.primary,
 *   });
 * });
 *
 * afterAll(async () => {
 *   await cleanupContractorTestData();
 * });
 * ```
 */

import { testSupabaseAdmin, forsured, core, TEST_USER_IDS, TEST_ORG_IDS } from './supabase';

export interface SeedContractorDataOptions {
  contractorUserId: string;
  contractorOrgId: string;
  managerOrgId?: string;
  managerUserId?: string;
}

export interface SeededContractorData {
  managers: Array<{ id: string; name: string }>;
  relationships: Array<{ id: string; manager_org_id: string; subcontractor_org_id: string }>;
  projects: Array<{ id: string; name: string }>;
  documents: Array<{ id: string; name: string }>;
  notifications: Array<{ id: string; title: string }>;
  tasks: Array<{ id: string; title: string }>;
  helpArticles: Array<{ id: string; slug: string }>;
}

const seededData: SeededContractorData = {
  managers: [],
  relationships: [],
  projects: [],
  documents: [],
  notifications: [],
  tasks: [],
  helpArticles: [],
};

/**
 * Create test manager organizations
 */
async function createTestManagers(
  contractorOrgId: string,
  managerUserId: string = TEST_USER_IDS.manager
): Promise<Array<{ id: string; name: string }>> {
  // Create manager organizations in core schema
  // Note: organizations table doesn't have a 'type' column
  const manager1 = await core('organizations')
    .insert({
      name: 'ABC Construction',
      slug: `abc-construction-${Date.now()}`,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, name')
    .single();

  const manager2 = await core('organizations')
    .insert({
      name: 'XYZ Builders',
      slug: `xyz-builders-${Date.now()}`,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, name')
    .single();

  if (manager1.error || manager2.error) {
    throw new Error(`Failed to create test managers: ${manager1.error?.message || manager2.error?.message}`);
  }

  return [
    { id: manager1.data.id, name: manager1.data.name },
    { id: manager2.data.id, name: manager2.data.name },
  ];
}

/**
 * Create test relationships between managers and contractor
 */
async function createTestRelationships(
  managerOrgIds: Array<{ id: string; name: string }>,
  contractorOrgId: string
): Promise<Array<{ id: string; manager_org_id: string; subcontractor_org_id: string }>> {
  const relationships = [];

  // Active relationship
  const rel1 = await forsured('relationships')
    .insert({
      manager_org_id: managerOrgIds[0].id,
      subcontractor_org_id: contractorOrgId,
      status: 'active',
      relationship_health_score: 85,
      projects_together_count: 5,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, manager_org_id, subcontractor_org_id')
    .single();

  // Pending relationship
  const rel2 = await forsured('relationships')
    .insert({
      manager_org_id: managerOrgIds[1].id,
      subcontractor_org_id: contractorOrgId,
      status: 'pending',
      relationship_health_score: null,
      projects_together_count: 2,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, manager_org_id, subcontractor_org_id')
    .single();

  if (rel1.error || rel2.error) {
    throw new Error(`Failed to create test relationships: ${rel1.error?.message || rel2.error?.message}`);
  }

  relationships.push({
    id: rel1.data.id,
    manager_org_id: rel1.data.manager_org_id,
    subcontractor_org_id: rel1.data.subcontractor_org_id,
  });
  relationships.push({
    id: rel2.data.id,
    manager_org_id: rel2.data.manager_org_id,
    subcontractor_org_id: rel2.data.subcontractor_org_id,
  });

  return relationships;
}

/**
 * Create test projects for contractor
 */
async function createTestProjects(
  contractorOrgId: string,
  managerOrgIds: Array<{ id: string; name: string }>,
  managerUserId: string = TEST_USER_IDS.manager
): Promise<Array<{ id: string; name: string }>> {
  const projects = [];

  // Active project
  // Note: projects table only has: id, name, organization_id, manager_id, scaffald_project_id, created_at, updated_at
  // manager_id is nullable and references core.users(id), so we set it to null to avoid FK constraint issues
  const project1 = await forsured('projects')
    .insert({
      name: 'Downtown Office Renovation',
      organization_id: contractorOrgId,
      manager_id: null, // Set to null to avoid FK constraint (manager_id references core.users(id))
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, name')
    .single();

  // Pending project
  const project2 = await forsured('projects')
    .insert({
      name: 'Residential Complex',
      organization_id: contractorOrgId,
      manager_id: null, // Set to null to avoid FK constraint (manager_id references core.users(id))
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, name')
    .single();

  if (project1.error || project2.error) {
    throw new Error(`Failed to create test projects: ${project1.error?.message || project2.error?.message}`);
  }

  projects.push({ id: project1.data.id, name: project1.data.name });
  projects.push({ id: project2.data.id, name: project2.data.name });

  return projects;
}

/**
 * Create test documents for contractor
 */
async function createTestDocuments(
  contractorOrgId: string,
  projectId?: string
): Promise<Array<{ id: string; name: string }>> {
  const documents = [];

  // Note: documents table requires project_id and subcontractor_id (both non-nullable)
  // If no projectId provided, we need to create a project first or skip document creation
  if (!projectId) {
    // Create a temporary project for documents if none provided
    const tempProject = await forsured('projects')
      .insert({
        name: 'Test Project for Documents',
        organization_id: contractorOrgId,
        manager_id: null,
      })
      .select('id')
      .single();
    
    if (tempProject.error) {
      throw new Error(`Failed to create temp project for documents: ${tempProject.error.message}`);
    }
    projectId = tempProject.data.id;
  }

  // Get or create a subcontractor record for this organization
  // Note: subcontractor_id is required, so we need to ensure it exists
  const subcontractor = await forsured('subcontractors')
    .select('id')
    .eq('organization_id', contractorOrgId)
    .maybeSingle();
  
  if (subcontractor.error) {
    throw new Error(`Failed to lookup subcontractor: ${subcontractor.error.message}`);
  }
  
  let subcontractorId: string;
  if (!subcontractor.data) {
    // Create subcontractor record if it doesn't exist
    // Note: subcontractors table requires: id, name (NOT NULL), company (NOT NULL), organization_id
    const newSubcontractor = await forsured('subcontractors')
      .insert({
        name: 'Test Contractor',
        company: 'Test Contractor Company',
        organization_id: contractorOrgId,
      })
      .select('id')
      .single();
    
    if (newSubcontractor.error) {
      throw new Error(`Failed to create subcontractor: ${newSubcontractor.error.message}`);
    }
    subcontractorId = newSubcontractor.data.id;
  } else {
    subcontractorId = subcontractor.data.id;
  }

  // Approved document
  // Note: documents table columns: file_name, file_type, file_url, file_size, upload_date, project_id, subcontractor_id, status
  const doc1 = await forsured('documents')
    .insert({
      file_name: 'General Liability Insurance.pdf',
      file_type: 'application/pdf',
      file_url: 'https://example.com/test-documents/general-liability.pdf',
      file_size: 102400,
      status: 'approved',
      organization_id: contractorOrgId,
      project_id: projectId,
      subcontractor_id: subcontractorId,
      upload_date: new Date().toISOString(),
    })
    .select('id, file_name')
    .single();

  // Pending document
  const doc2 = await forsured('documents')
    .insert({
      file_name: 'Workers Compensation.pdf',
      file_type: 'application/pdf',
      file_url: 'https://example.com/test-documents/workers-comp.pdf',
      file_size: 98304,
      status: 'pending',
      organization_id: contractorOrgId,
      project_id: projectId,
      subcontractor_id: subcontractorId,
      upload_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, file_name')
    .single();

  if (doc1.error || doc2.error) {
    throw new Error(`Failed to create test documents: ${doc1.error?.message || doc2.error?.message}`);
  }

  documents.push({ id: doc1.data.id, name: doc1.data.file_name });
  documents.push({ id: doc2.data.id, name: doc2.data.file_name });

  return documents;
}

/**
 * Create test notifications for contractor
 */
async function createTestNotifications(
  contractorUserId: string,
  contractorOrgId: string,
  projectId?: string,
  taskId?: string
): Promise<Array<{ id: string; title: string }>> {
  const notifications = [];

  // Generate valid UUIDs for entity_id if not provided
  // Using crypto.randomUUID() for valid UUIDs
  const { randomUUID } = await import('crypto');
  const fallbackTaskId = taskId || randomUUID();
  const fallbackProjectId = projectId || randomUUID();

  // Unread notification
  // Note: forsured.notifications.type must be one of: 'due_date_change', 'task_assigned', 'task_completed', 'comment_added', 'mention'
  const notif1 = await forsured('notifications')
    .insert({
      user_id: contractorUserId,
      organization_id: contractorOrgId,
      type: 'task_assigned',
      title: 'Insurance Document Needed',
      message: 'Please upload your updated insurance certificate',
      entity_type: 'task',
      entity_id: fallbackTaskId,
      triggered_by: contractorUserId,
      is_read: false,
      metadata: {
        document_type: 'insurance',
        urgency: 'high',
      },
    })
    .select('id, title')
    .single();

  // Read notification
  const notif2 = await forsured('notifications')
    .insert({
      user_id: contractorUserId,
      organization_id: contractorOrgId,
      type: 'comment_added',
      title: 'Project Approval',
      message: 'You have been approved for Downtown Office Renovation',
      entity_type: 'project',
      entity_id: fallbackProjectId,
      triggered_by: contractorUserId,
      is_read: true,
      read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        project_name: 'Downtown Office Renovation',
      },
    })
    .select('id, title')
    .single();

  if (notif1.error || notif2.error) {
    throw new Error(`Failed to create test notifications: ${notif1.error?.message || notif2.error?.message}`);
  }

  notifications.push({ id: notif1.data.id, title: notif1.data.title });
  notifications.push({ id: notif2.data.id, title: notif2.data.title });

  return notifications;
}

/**
 * Create test tasks for contractor
 */
async function createTestTasks(
  contractorUserId: string,
  contractorOrgId: string,
  projectId?: string
): Promise<Array<{ id: string; title: string }>> {
  const tasks = [];

  // Pending task
  const task1 = await forsured('tasks')
    .insert({
      title: 'Upload Insurance Certificate',
      description: 'Upload updated insurance certificate',
      status: 'pending',
      priority: 'high',
      organization_id: contractorOrgId,
      project_id: projectId || null,
      assigned_to_user_id: contractorUserId,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, title')
    .single();

  // Completed task
  const task2 = await forsured('tasks')
    .insert({
      title: 'Complete Safety Training',
      description: 'Complete online safety training module',
      status: 'completed',
      priority: 'medium',
      organization_id: contractorOrgId,
      project_id: projectId || null,
      assigned_to_user_id: contractorUserId,
      completed_at: new Date().toISOString(),
    })
    .select('id, title')
    .single();

  if (task1.error || task2.error) {
    throw new Error(`Failed to create test tasks: ${task1.error?.message || task2.error?.message}`);
  }

  tasks.push({ id: task1.data.id, title: task1.data.title });
  tasks.push({ id: task2.data.id, title: task2.data.title });

  return tasks;
}

/**
 * Create test help articles for contractor
 */
async function createTestHelpArticles(): Promise<Array<{ id: string; slug: string }>> {
  const articles = [];

  // Getting started article
  const article1 = await forsured('help_articles')
    .insert({
      slug: 'getting-started',
      title: 'Getting Started as a Contractor',
      content: '# Getting Started\n\nWelcome to ForSured! This guide will help you get started.',
      user_types: ['contractor'],
      category: 'Getting Started',
      sort_order: 1,
      is_published: true,
    })
    .select('id, slug')
    .single();

  if (article1.error) {
    // Help articles might already exist, that's okay
    console.warn('Help article creation failed (may already exist):', article1.error.message);
  } else {
    articles.push({ id: article1.data.id, slug: article1.data.slug });
  }

  return articles;
}

/**
 * Seed all contractor test data
 */
export async function seedContractorTestData(
  options: SeedContractorDataOptions
): Promise<SeededContractorData> {
  const { contractorUserId, contractorOrgId, managerOrgId, managerUserId } = options;

  // Note: core.users records are created by trigger when auth.users are created
  // Test users should already exist from seed data, so we don't need to create them here
  // If notifications fail due to missing user, we'll skip them (not critical for all tests)

  // Ensure contractor organization exists in core schema (required for relationships FK)
  // Check if it exists, if not, create it
  const { data: existingContractorOrg } = await core('organizations')
    .select('id')
    .eq('id', contractorOrgId)
    .maybeSingle();
  
  if (!existingContractorOrg) {
    // Create contractor organization in core schema
    const { data: newOrg, error: orgError } = await core('organizations')
      .insert({
        id: contractorOrgId,
        name: 'Test Contractor Organization',
        slug: `test-contractor-org-${Date.now()}`,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (orgError && !orgError.message.includes('duplicate')) {
      console.warn(`Failed to create contractor org: ${orgError.message}`);
    }
  }

  // Create managers if not provided
  let managers: Array<{ id: string; name: string }>;
  if (managerOrgId) {
    // Use existing manager org
    const { data } = await forsured('organizations').select('id, name').eq('id', managerOrgId).single();
    if (data) {
      managers = [{ id: data.id, name: data.name }];
    } else {
      managers = await createTestManagers(contractorOrgId, managerUserId);
    }
  } else {
    managers = await createTestManagers(contractorOrgId, managerUserId);
  }

  // Create relationships
  const relationships = await createTestRelationships(managers, contractorOrgId);

  // Create projects
  const projects = await createTestProjects(contractorOrgId, managers, managerUserId);

  // Create documents
  const documents = await createTestDocuments(contractorOrgId, projects[0]?.id);

  // Create notifications (optional - skip if user doesn't exist in core.users)
  let notifications: Array<{ id: string; title: string }> = [];
  try {
    notifications = await createTestNotifications(
      contractorUserId,
      contractorOrgId,
      projects[0]?.id
    );
  } catch (error) {
    // Notifications require user to exist in core.users
    // If user doesn't exist, skip notifications (not critical for all tests)
    console.warn(`Skipping notification creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Create tasks (optional - skip if user doesn't exist in core.users)
  let tasks: Array<{ id: string; title: string }> = [];
  try {
    tasks = await createTestTasks(contractorUserId, contractorOrgId, projects[0]?.id);
  } catch (error) {
    // Tasks require user to exist in core.users
    // If user doesn't exist, skip tasks (not critical for all tests)
    console.warn(`Skipping task creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Create help articles (may already exist, that's okay)
  const helpArticles = await createTestHelpArticles();

  // Store seeded data for cleanup
  seededData.managers = managers;
  seededData.relationships = relationships;
  seededData.projects = projects;
  seededData.documents = documents;
  seededData.notifications = notifications;
  seededData.tasks = tasks;
  seededData.helpArticles = helpArticles;

  return seededData;
}

/**
 * Clean up all seeded contractor test data
 */
export async function cleanupContractorTestData() {
  // Delete in reverse order to respect foreign key constraints

  // Delete notifications
  for (const notif of seededData.notifications) {
    await forsured('notifications').delete().eq('id', notif.id);
  }

  // Delete tasks
  for (const task of seededData.tasks) {
    await forsured('tasks').delete().eq('id', task.id);
  }

  // Delete documents
  for (const doc of seededData.documents) {
    await forsured('documents').delete().eq('id', doc.id);
  }

  // Delete projects
  for (const project of seededData.projects) {
    await forsured('projects').delete().eq('id', project.id);
  }

  // Delete relationships
  for (const rel of seededData.relationships) {
    await forsured('relationships').delete().eq('id', rel.id);
  }

  // Delete manager organizations (only if we created them)
  for (const manager of seededData.managers) {
    // Check if this org was created by us (has test prefix or matches our test data)
    const { data } = await core('organizations').select('id').eq('id', manager.id).single();
    if (data) {
      // Only delete if it's a test org (you may want to add more checks here)
      await core('organizations').delete().eq('id', manager.id);
    }
  }

  // Help articles are usually kept (they're shared content)
  // Only delete if you specifically created them for tests
  for (const article of seededData.helpArticles) {
    await forsured('help_articles').delete().eq('id', article.id);
  }

  // Clear seeded data
  seededData.managers = [];
  seededData.relationships = [];
  seededData.projects = [];
  seededData.documents = [];
  seededData.notifications = [];
  seededData.tasks = [];
  seededData.helpArticles = [];
}

/**
 * Get seeded data (for use in tests)
 */
export function getSeededContractorData(): SeededContractorData {
  return { ...seededData };
}

