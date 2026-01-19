/**
 * Manual User Test Fixtures
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-13: End-to-end testing and error handling validation
 *
 * Provides helpers for:
 * - Creating test manual users in Supabase
 * - Creating test merge scenarios
 * - Simulating merge workflow states
 */

import { forsured, testSupabaseAdmin, TEST_USER_IDS, TEST_ORG_IDS } from './supabase';

/**
 * Track created test data for cleanup
 */
const createdManualUserData: Array<{ table: string; id: string }> = [];

// ============================================================================
// Manual User Fixtures
// ============================================================================

export interface CreateManualUserInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: 'contractor' | 'broker';
  created_by_user_id?: string;
  organization_id?: string;
  notes?: string;
}

/**
 * Create a test manual user in Supabase
 */
export async function createTestManualUser(input: CreateManualUserInput) {
  const manualUserData = {
    name: input.name,
    email: input.email ?? null, // Email is optional for manual users
    phone: input.phone ?? null,
    company: input.company ?? null,
    role: input.role ?? 'contractor',
    created_by_user_id: input.created_by_user_id ?? TEST_USER_IDS.manager,
    organization_id: input.organization_id ?? TEST_ORG_IDS.primary,
    notes: input.notes ?? null,
    is_merged: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await forsured('manual_users')
    .insert(manualUserData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test manual user: ${error.message}`);
  }

  // Track for cleanup
  createdManualUserData.push({ table: 'forsured.manual_users', id: data.id });

  return data;
}

/**
 * Create a test manual user with an associated invitation
 */
export async function createTestManualUserWithInvitation(
  manualUserInput: CreateManualUserInput,
  invitationOverrides?: Partial<{
    invitation_type: string;
    expires_at: string;
  }>
) {
  // First create the manual user
  const manualUser = await createTestManualUser(manualUserInput);

  // Then create an associated invitation if email is provided
  if (manualUser.email) {
    const invitationData = {
      email: manualUser.email,
      name: manualUser.name,
      role: manualUser.role,
      status: 'pending',
      invited_by: manualUser.created_by_user_id,
      organization_id: manualUser.organization_id,
      manual_user_id: manualUser.id,
      invitation_type: invitationOverrides?.invitation_type ?? 'relationship',
      expires_at: invitationOverrides?.expires_at ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data: invitation, error: invError } = await forsured('relationship_invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invError) {
      throw new Error(`Failed to create invitation for manual user: ${invError.message}`);
    }

    // Track for cleanup
    createdManualUserData.push({ table: 'forsured.relationship_invitations', id: invitation.id });

    return { manualUser, invitation };
  }

  return { manualUser, invitation: null };
}

// ============================================================================
// Merge Scenario Fixtures
// ============================================================================

export interface MergeScenarioInput {
  manualUserName: string;
  manualUserEmail?: string;
  manualUserRole?: 'contractor' | 'broker';
  includeTaskAssignments?: boolean;
  includeProjectLinks?: boolean;
  includeDocuments?: boolean;
}

/**
 * Create a complete merge scenario with optional related data
 */
export async function createMergeScenario(input: MergeScenarioInput) {
  const manualUserData: CreateManualUserInput = {
    name: input.manualUserName,
    email: input.manualUserEmail,
    role: input.manualUserRole ?? 'contractor',
  };

  const { manualUser, invitation } = await createTestManualUserWithInvitation(manualUserData);

  const scenario: {
    manualUser: typeof manualUser;
    invitation: typeof invitation;
    tasks: Array<{ id: string }>;
    projects: Array<{ id: string }>;
    documents: Array<{ id: string }>;
  } = {
    manualUser,
    invitation,
    tasks: [],
    projects: [],
    documents: [],
  };

  // Create task assignments if requested
  if (input.includeTaskAssignments) {
    const taskData = {
      title: `Test Task for ${input.manualUserName}`,
      description: 'Task assigned to manual user',
      status: 'pending',
      priority: 'medium',
      organization_id: TEST_ORG_IDS.primary,
      assigned_to_manual_user_id: manualUser.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data: task, error: taskError } = await forsured('tasks')
      .insert(taskData)
      .select()
      .single();

    if (!taskError && task) {
      createdManualUserData.push({ table: 'forsured.tasks', id: task.id });
      scenario.tasks.push(task);
    }
  }

  return scenario;
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get a manual user by ID
 */
export async function getTestManualUser(id: string) {
  const { data, error } = await forsured('manual_users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get manual user: ${error.message}`);
  }

  return data;
}

/**
 * Get all manual users created by a specific user
 */
export async function getManualUsersByCreator(createdByUserId: string) {
  const { data, error } = await forsured('manual_users')
    .select('*')
    .eq('created_by_user_id', createdByUserId);

  if (error) {
    throw new Error(`Failed to get manual users: ${error.message}`);
  }

  return data || [];
}

/**
 * Get merge audit logs for a manual user
 */
export async function getMergeAuditLogs(manualUserId: string) {
  const { data, error } = await forsured('merge_audit_logs')
    .select('*')
    .eq('manual_user_id', manualUserId)
    .order('created_at', { ascending: false });

  if (error) {
    // Table might not exist yet
    console.warn('Failed to get merge audit logs:', error.message);
    return [];
  }

  return data || [];
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Clean up all test manual user data created during tests
 */
export async function cleanupManualUserTestData() {
  // Delete in reverse order to respect foreign key constraints
  const dataToDelete = [...createdManualUserData].reverse();

  for (const record of dataToDelete) {
    const [schema, table] = record.table.split('.');
    try {
      await testSupabaseAdmin
        .schema(schema)
        .from(table)
        .delete()
        .eq('id', record.id);
    } catch (error) {
      // Log but don't fail - cleanup errors shouldn't break tests
      console.warn(`Failed to cleanup ${record.table}:${record.id}`, error);
    }
  }

  // Clear the tracking array
  createdManualUserData.length = 0;
}

/**
 * Clean up manual users by name prefix
 */
export async function cleanupManualUsersByPrefix(prefix: string) {
  try {
    // First delete any associated invitations
    const { data: manualUsers } = await forsured('manual_users')
      .select('id')
      .like('name', `${prefix}%`);

    if (manualUsers && manualUsers.length > 0) {
      const manualUserIds = manualUsers.map((u: { id: string }) => u.id);

      // Delete invitations linked to these manual users
      await forsured('relationship_invitations')
        .delete()
        .in('manual_user_id', manualUserIds);

      // Delete any tasks assigned to these manual users
      await forsured('tasks')
        .delete()
        .in('assigned_to_manual_user_id', manualUserIds);
    }

    // Then delete the manual users
    await forsured('manual_users')
      .delete()
      .like('name', `${prefix}%`);
  } catch (error) {
    console.warn(`Failed to cleanup manual users with prefix ${prefix}`, error);
  }
}
