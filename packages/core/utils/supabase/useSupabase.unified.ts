import { Database } from '@app/supabase/types'
import { supabase } from './client.unified'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Unified useSupabase hook that returns the direct Supabase client
 * for both web and native platforms.
 *
 * This replaces the platform-specific implementations and removes
 * the dependency on @supabase/auth-helpers-react for web.
 */
export const useSupabase = (): SupabaseClient<Database> => {
  return supabase
}
