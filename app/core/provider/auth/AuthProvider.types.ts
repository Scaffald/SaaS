import type { Session } from '@supabase/auth-helpers-nextjs'

export type AuthProviderProps = {
  initialSession?: Session | null
  children?: React.ReactNode
}
