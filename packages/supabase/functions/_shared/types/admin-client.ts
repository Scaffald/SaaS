import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types.ts'

/**
 * Type alias for admin Supabase client to avoid excessive type instantiation depth.
 * This simplifies the type definition in the tRPC context.
 */
export type AdminSupabaseClient = SupabaseClient<Database>
