/**
 * Type-safe database helpers for Supabase Edge Functions.
 *
 * These helpers enforce schema selection and provide type-safe RPC calls,
 * preventing common errors like:
 * - Forgetting to call `.schema('core')` before `.from()`
 * - Using `as any` for RPC function calls
 * - Passing wrong arguments to RPC functions
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../database.types.ts'

type CoreTables = Database['core']['Tables']
type CoreTableName = keyof CoreTables
type CoreViews = Database['core']['Views']
type CoreViewName = keyof CoreViews

type PublicTables = Database['public']['Tables']
type PublicTableName = keyof PublicTables
type PublicViews = Database['public']['Views']
type PublicViewName = keyof PublicViews

type RpcFunction = keyof Database['core']['Functions']

/**
 * Schema-aware database helper.
 *
 * Makes it impossible to query without explicitly specifying the schema,
 * which prevents TypeScript from defaulting to 'public' when you mean 'core'.
 *
 * @example
 * ```typescript
 * const db = createDbHelpers(supabaseAdmin)
 *
 * // ✅ Type-safe: knows this is core.background_checks with all columns
 * const { data } = await db.core('background_checks')
 *   .select('id, provider_reference, status_history')
 *   .eq('id', checkId)
 *   .single()
 *
 * // ✅ For views, use coreView()
 * const { data: stats } = await db.coreView('v_team_daily_metrics_latest')
 *   .select('*')
 *   .eq('team_id', teamId)
 * ```
 */
export function createDbHelpers(client: SupabaseClient<Database>) {
  return {
    /**
     * Access tables in the 'core' schema with full type safety.
     *
     * @param table - The table name in the core schema
     * @returns Query builder with correct types for the specified table
     */
    core: (table: CoreTableName) => {
      return client.schema('core').from(table)
    },

    /**
     * Access views in the 'core' schema with full type safety.
     *
     * @param view - The view name in the core schema
     * @returns Query builder with correct types for the specified view
     */
    coreView: (view: CoreViewName) => {
      return client.schema('core').from(view)
    },

    /**
     * Access tables in the 'public' schema with full type safety.
     *
     * @param table - The table name in the public schema
     * @returns Query builder with correct types for the specified table
     */
    public: (table: PublicTableName) => {
      return client.schema('public').from(table)
    },

    /**
     * Access views in the 'public' schema with full type safety.
     *
     * @param view - The view name in the public schema
     * @returns Query builder with correct types for the specified view
     */
    publicView: (view: PublicViewName) => {
      return client.schema('public').from(view)
    },
  }
}

/**
 * Type-safe RPC function caller.
 *
 * Eliminates the need for `as any` when calling RPC functions by inferring
 * the correct argument and return types from the Database schema.
 *
 * @example
 * ```typescript
 * // Before (requires `as any`):
 * await admin.rpc('refresh_team_daily_metrics' as any, {
 *   p_team_id: teamId,
 *   p_metric_date: metricDate ?? null,
 * })
 *
 * // After (fully type-safe):
 * await rpc(admin, 'refresh_team_daily_metrics', {
 *   p_team_id: teamId,
 *   p_metric_date: metricDate ?? null,
 *   p_capture_workloads: true,
 * })
 * ```
 */
export function rpc<T extends RpcFunction>(
  client: SupabaseClient<Database>,
  functionName: T,
  args: Database['core']['Functions'][T]['Args']
): ReturnType<SupabaseClient<Database>['rpc']> {
  return client.rpc(functionName as string, args as never)
}
