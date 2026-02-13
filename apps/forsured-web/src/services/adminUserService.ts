// src/services/adminUserService.ts
// Admin user management service
//
// Provides CRUD operations for user management in the admin interface.
// Queries both forsured.user_profiles and forsured.users tables.

import { forsured } from '../lib/supabase';
import { logAdminAction, AUDIT_ACTIONS } from './auditLogService';

export interface AdminUser {
  id: string;
  scaffald_user_id: string;
  name: string;
  email: string;
  user_type: 'gc' | 'contractor' | 'broker' | 'admin';
  status: 'active' | 'inactive';
  company: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserFilters {
  user_type?: 'gc' | 'contractor' | 'broker' | 'admin';
  status?: 'active' | 'inactive';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UserActivity {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
}

/**
 * Get all users with optional filters
 */
export async function getUsers(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
  console.log('[AdminUserService] Fetching users with filters:', filters);

  // First get user profiles from forsured
  let profileQuery = forsured('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.user_type) {
    profileQuery = profileQuery.eq('user_type', filters.user_type);
  }

  if (filters.limit) {
    profileQuery = profileQuery.limit(filters.limit);
  }

  if (filters.offset) {
    profileQuery = profileQuery.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data: profiles, error: profileError } = await profileQuery;

  if (profileError) {
    console.error('[AdminUserService] Failed to fetch profiles:', profileError);
    throw new Error(`Failed to fetch users: ${profileError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Get user details from forsured.users
  const coreUserIds = profiles.map((p: { scaffald_user_id: string }) => p.scaffald_user_id);
  const { data: coreUsers, error: coreError } = await forsured('users')
    .select('id, email, name, organization_id')
    .in('id', coreUserIds);

  if (coreError) {
    console.error('[AdminUserService] Failed to fetch users:', coreError);
    // Continue without user data
  }

  // Get organizations for company names
  const orgIds = coreUsers
    ?.filter((u: { organization_id: string | null }) => u.organization_id)
    .map((u: { organization_id: string }) => u.organization_id) || [];

  let organizations: Array<{ id: string; name: string }> = [];
  if (orgIds.length > 0) {
    const { data: orgs } = await forsured('organizations')
      .select('id, name')
      .in('id', orgIds);
    organizations = orgs || [];
  }

  // Combine data
  const users: AdminUser[] = profiles.map((profile: {
    id: string;
    scaffald_user_id: string;
    user_type: 'gc' | 'contractor' | 'broker' | 'admin';
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
  }) => {
    const coreUser = coreUsers?.find((u: { id: string }) => u.id === profile.scaffald_user_id);
    const org = coreUser?.organization_id
      ? organizations.find((o: { id: string }) => o.id === coreUser.organization_id)
      : null;

    return {
      id: profile.id,
      scaffald_user_id: profile.scaffald_user_id,
      name: coreUser?.name || 'Unknown',
      email: coreUser?.email || 'Unknown',
      user_type: profile.user_type,
      status: 'active' as const, // TODO: Add status field to user_profiles
      company: org?.name || null,
      onboarding_completed: profile.onboarding_completed,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  });

  // Apply search filter (client-side for now)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.company && u.company.toLowerCase().includes(searchLower))
    );
  }

  return users;
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<AdminUser | null> {
  const { data: profile, error } = await forsured('user_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[AdminUserService] Failed to fetch user:', error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  if (!profile) {
    return null;
  }

  // Get user details from forsured.users
  const { data: coreUser } = await forsured('users')
    .select('id, email, name, organization_id')
    .eq('id', profile.scaffald_user_id)
    .maybeSingle();

  // Get organization
  let company = null;
  if (coreUser?.organization_id) {
    const { data: org } = await forsured('organizations')
      .select('name')
      .eq('id', coreUser.organization_id)
      .maybeSingle();
    company = org?.name || null;
  }

  return {
    id: profile.id,
    scaffald_user_id: profile.scaffald_user_id,
    name: coreUser?.name || 'Unknown',
    email: coreUser?.email || 'Unknown',
    user_type: profile.user_type,
    status: 'active',
    company,
    onboarding_completed: profile.onboarding_completed,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/**
 * Update a user's type
 */
export async function updateUserType(
  adminUserId: string,
  userId: string,
  newType: 'gc' | 'contractor' | 'broker' | 'admin'
): Promise<AdminUser> {
  // Get current user
  const currentUser = await getUserById(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  const oldType = currentUser.user_type;

  // Update user_profiles
  const { error } = await forsured('user_profiles')
    .update({ user_type: newType, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('[AdminUserService] Failed to update user type:', error);
    throw new Error(`Failed to update user type: ${error.message}`);
  }

  // Log the action
  await logAdminAction({
    admin_user_id: adminUserId,
    action: AUDIT_ACTIONS.USER_TYPE_CHANGED,
    target_type: 'user',
    target_id: userId,
    old_value: { user_type: oldType },
    new_value: { user_type: newType },
  });

  return { ...currentUser, user_type: newType };
}

/**
 * Get user activity (audit logs for a specific user)
 */
export async function getUserActivity(userId: string, limit = 50): Promise<UserActivity[]> {
  const { data, error } = await forsured('admin_audit_log')
    .select('id, action, target_type, target_id, old_value, new_value, created_at')
    .eq('target_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AdminUserService] Failed to fetch user activity:', error);
    return [];
  }

  return (data || []) as UserActivity[];
}

/**
 * Get user count by type
 */
export async function getUserCounts(): Promise<Record<string, number>> {
  const { data, error } = await forsured('user_profiles')
    .select('user_type');

  if (error) {
    console.error('[AdminUserService] Failed to get user counts:', error);
    return { gc: 0, contractor: 0, broker: 0, admin: 0, total: 0 };
  }

  const counts = (data || []).reduce(
    (acc: Record<string, number>, row: { user_type: string }) => {
      acc[row.user_type] = (acc[row.user_type] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    },
    { gc: 0, contractor: 0, broker: 0, admin: 0, total: 0 }
  );

  return counts;
}
