import { useContext } from 'react'
import { SessionContext } from '@app/core/provider/auth/AuthProvider.unified'

/**
 * Unified useSessionContext hook that works with our unified AuthProvider
 * This replaces the @supabase/auth-helpers-react version
 */
export const useSessionContext = () => {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSessionContext must be used within a SessionContext provider')
  }

  return context
}
