import { Database } from '@app/supabase/types'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { useState } from 'react'

import { supabase } from '@app/core/utils/supabase/client'
import { AuthStateChangeHandler } from './AuthStateChangeHandler'

export type AuthProviderProps = {
  initialSession?: Session | null
  children?: React.ReactNode
}

export const AuthProvider = ({ initialSession, children }: AuthProviderProps) => {
  // Use our standard Supabase client
  const [supabaseClient] = useState(() => supabase)

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient as unknown as SupabaseClient<Database>}
      initialSession={initialSession}
    >
      <AuthStateChangeHandler />
      {children}
    </SessionContextProvider>
  )
}
