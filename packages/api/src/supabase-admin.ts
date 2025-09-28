import type { Database } from '@app/supabase/types'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}

const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
if (!supabaseServiceRole) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
  )
}

/**
 * only meant to be used on the server side.
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRole)
