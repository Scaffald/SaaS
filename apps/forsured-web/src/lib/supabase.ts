/**
 * Supabase Client Configuration
 *
 * This module provides the Supabase client configured for the forsured.* schema.
 * All ForSured data lives in the forsured.* schema -- no core.* dependencies.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables - support both Vite client (import.meta.env) and Node server (process.env)
const getEnvVar = (viteKey: string, processKey?: string): string | undefined => {
  // Check Vite client-side env first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[viteKey];
  }
  // Fall back to process.env for server-side (tRPC middleware)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[processKey || viteKey];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY');

// Check for missing env vars - warn instead of throw for E2E testing with mocks
const isMissingEnvVars = !supabaseUrl || !supabaseAnonKey;
if (isMissingEnvVars) {
  console.error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Use placeholder values when env vars are missing (for E2E tests with mock data)
const effectiveSupabaseUrl = supabaseUrl || 'https://mock.supabase.co';
const effectiveSupabaseAnonKey = supabaseAnonKey || 'mock-anon-key';

/**
 * Supabase client instance (uses anon key)
 *
 * Configured with:
 * - Default schema: public (Supabase requirement)
 * - App uses forsured.* schema for all tables
 * - Cross-schema queries to core.* for users/orgs
 * - Subject to RLS policies
 */
export const supabase: SupabaseClient = createClient(effectiveSupabaseUrl, effectiveSupabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Handle auth state changes and errors
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  },
  db: {
    schema: 'public', // Supabase requires this, but we'll specify schema in queries
  },
  global: {
    // Handle auth errors gracefully
    headers: {
      'x-client-info': 'forsured-web',
    },
  },
});

// Set up error handler for auth refresh failures
// This handles cases where stale refresh tokens exist in localStorage
if (typeof window !== 'undefined') {
  // Listen for auth state changes and handle errors
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Supabase] Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('[Supabase] User signed out');
    } else if (event === 'SIGNED_IN') {
      console.log('[Supabase] User signed in');
    }
  });

  // Handle initial session load and catch refresh token errors
  // This prevents console errors from stale refresh tokens after database resets
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      // If there's an error getting the session (e.g., invalid refresh token),
      // clear the session to prevent repeated refresh attempts
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('refresh_token') ||
        errorMessage.includes('Invalid') ||
        errorMessage.includes('Refresh Token Not Found')
      ) {
        console.log('[Supabase] Clearing invalid session due to refresh token error');
        // Clear the session silently to prevent error loops
        supabase.auth.signOut({ scope: 'local' }).catch(() => {
          // Ignore errors - session might already be cleared
        });
      }
    }
  }).catch((error) => {
    // Handle errors during initial session check (e.g., network issues)
    // Don't log these as errors since they might be expected in some scenarios
    if (error.message?.includes('refresh_token') || error.message?.includes('Invalid')) {
      console.log('[Supabase] Clearing invalid session due to refresh error');
      supabase.auth.signOut({ scope: 'local' }).catch(() => {
        // Ignore errors
      });
    }
  });
}

/**
 * Supabase service role client (bypasses RLS)
 *
 * WARNING: Only use for testing! Never expose service role key in production client code.
 * This client bypasses Row Level Security policies.
 */
export const supabaseServiceRole: SupabaseClient | null = supabaseServiceRoleKey
  ? createClient(effectiveSupabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    })
  : null;

/**
 * Helper to build schema-prefixed table names
 */
export const table = {
  // Forsured schema tables
  auditLog: 'forsured.audit_log',
  auditLogArchiveIndex: 'forsured.audit_log_archive_index',
  projects: 'forsured.projects',
  subcontractors: 'forsured.subcontractors',
  documents: 'forsured.documents',
  policies: 'forsured.policies', // OLD - deprecated, use insurancePolicies
  endorsements: 'forsured.endorsements', // OLD - deprecated, use policyEndorsements
  requirements: 'forsured.requirements', // OLD - deprecated
  complianceScores: 'forsured.compliance_scores',
  tasks: 'forsured.tasks',
  // Task Documents (REQ-265)
  taskDocuments: 'forsured.task_documents',
  // NEW: Insurance Policy Parent-Child Model (REQ-262)
  insurancePolicies: 'forsured.insurance_policies',
  policyProvisions: 'forsured.policy_provisions',
  policyEndorsements: 'forsured.policy_endorsements',
  // Coverage Requirements (REQ-271)
  coverageRequirements: 'forsured.coverage_requirements',
  // Coverage Request Workflow (REQ-273)
  coverageRequests: 'forsured.coverage_requests',
  // User Set Types (REQ-4: Multi-Industry Support)
  userSetTypes: 'forsured.user_set_types',
  userSetTypeLexicon: 'forsured.user_set_type_lexicon',
  // Project-Subcontractor relationship
  projectSubcontractors: 'forsured.project_subcontractors',

  // Forsured schema tables (previously in core.*)
  users: 'forsured.users',
  organizations: 'forsured.organizations',
  roles: 'forsured.roles',
  roleAssignments: 'forsured.role_assignments',
  genericInvitations: 'forsured.generic_invitations',
  invitationRules: 'forsured.invitation_rules',
  userRelationships: 'forsured.user_relationships',
  // CCPA tables
  ccpaRequests: 'forsured.ccpa_requests',
  ccpaRequestHistory: 'forsured.ccpa_request_history',
  oauthApps: 'forsured.oauth_apps',
  ccpaOauthAppRegistry: 'forsured.ccpa_oauth_app_registry',
};

/**
 * Type-safe query builder for forsured schema
 *
 * IMPORTANT: Supabase PostgREST requires schema to be set via .schema() method,
 * not via dot notation in table names (e.g., 'forsured.tasks' doesn't work).
 *
 * @param tableName - Table name within forsured schema
 * @param client - Optional Supabase client (defaults to anon client)
 *
 * @example
 * ```ts
 * // Query forsured.tasks table
 * const { data } = await forsured('tasks')
 *   .select('*, assigned_to:users!inner(id, name, email)', { head: false, count: 'exact' })
 *   .eq('status', 'open');
 *
 * // Use service role client for testing (bypasses RLS)
 * const { data } = await forsured('tasks', supabaseServiceRole!)
 *   .select('*');
 * ```
 */
export function forsured(tableName: string, client: SupabaseClient = supabase) {
  return client.schema('forsured').from(tableName);
}

/**
 * @deprecated ForSured no longer uses core schema. Use forsured() instead.
 * Kept temporarily for reference during migration.
 */
export function core(tableName: string, client: SupabaseClient = supabase) {
  return client.schema('forsured').from(tableName);
}

/**
 * Helper to get current user from Supabase Auth
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[Supabase] Error getting current user:', error);
    return null;
  }

  return user;
}

/**
 * Helper to get user's organization ID from role_assignments
 * Uses scope_org_id from role_assignments table where user has a role
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  // Query forsured.role_assignments to find user's organization
  const { data, error } = await forsured('role_assignments')
    .select('scope_org_id')
    .eq('user_id', userId)
    .not('scope_org_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error getting user organization:', error);
    return null;
  }

  return data?.scope_org_id || null;
}

/**
 * Helper to check if user has required role in organization
 */
export async function userHasRole(
  userId: string,
  organizationId: string,
  allowedRoles: string[]
): Promise<boolean> {
  const { data, error } = await forsured('role_assignments')
    .select('role_type')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .in('role_type', allowedRoles)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error checking user role:', error);
    return false;
  }

  return !!data;
}

export default supabase;
