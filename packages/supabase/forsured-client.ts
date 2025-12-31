/**
 * Forsured Schema Client Helpers
 *
 * Provides typed query builders for the forsured.* schema tables.
 * These helpers work alongside the existing @scf/supabase client.
 *
 * Usage:
 * ```typescript
 * import { forsured, core } from '@scf/supabase/forsured-client';
 *
 * // Query Forsured-specific data
 * const projects = await forsured('projects').select('*').eq('organization_id', orgId);
 *
 * // Query core/platform data (users, organizations)
 * const users = await core('users').select('*').eq('organization_id', orgId);
 * ```
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Re-export for convenience
export type { SupabaseClient }

/**
 * Create a Supabase client for Forsured
 * Uses environment variables for configuration
 */
export function createForsuredClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ prefixed) are required'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Query builder for the forsured schema
 * Use this for Forsured-specific tables: projects, tasks, policies, documents, etc.
 *
 * @param tableName - Table name within the forsured schema
 * @param client - Optional Supabase client (uses default if not provided)
 * @returns Query builder for the specified table
 *
 * @example
 * ```typescript
 * const projects = await forsured('projects').select('*').eq('status', 'active');
 * const policies = await forsured('insurance_policies').select('*');
 * ```
 */
export function forsured(tableName: string, client?: SupabaseClient) {
  const supabase = client || createForsuredClient()
  return supabase.schema('forsured').from(tableName)
}

/**
 * Query builder for the core schema (Scaffald platform tables)
 * Use this for shared platform tables: users, organizations, role_assignments
 *
 * @param tableName - Table name within the core schema
 * @param client - Optional Supabase client (uses default if not provided)
 * @returns Query builder for the specified table
 *
 * @example
 * ```typescript
 * const users = await core('users').select('*').eq('organization_id', orgId);
 * const org = await core('organizations').select('*').eq('id', orgId).single();
 * ```
 */
export function core(tableName: string, client?: SupabaseClient) {
  const supabase = client || createForsuredClient()
  return supabase.schema('core').from(tableName)
}

/**
 * Forsured table name constants for type safety
 */
export const forsuredTables = {
  // Core Forsured entities
  projects: 'projects',
  tasks: 'tasks',
  companies: 'companies',
  documents: 'documents',

  // Insurance domain
  insurance_policies: 'insurance_policies',
  coverage_requests: 'coverage_requests',
  coverage_requirements: 'coverage_requirements',

  // Compliance domain
  compliance_issues: 'compliance_issues',
  compliance_flags: 'compliance_flags',

  // Task management
  task_history: 'task_history',
  task_documents: 'task_documents',

  // User profiles
  user_profiles: 'user_profiles',
  broker_invitations: 'broker_invitations',

  // Settings
  settings: 'settings',
  admin_audit_log: 'admin_audit_log',

  // Help
  help_articles: 'help_articles',
} as const

/**
 * Core (Scaffald) table name constants for type safety
 */
export const coreTables = {
  users: 'users',
  organizations: 'organizations',
  projects: 'projects',
  role_assignments: 'role_assignments',
} as const
