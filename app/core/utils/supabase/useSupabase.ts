import { Database } from '@app/supabase/types'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export const useSupabase = () => {
  return useSupabaseClient<Database>()
}
