/**
 * Claims the visitor's invite once they are signed in (#1395). Renders
 * nothing. Mounted once, inside AuthProvider, by the root Provider.
 */
import { useEffect, useRef } from 'react'
import { useSessionContext } from '../../utils/supabase/useSessionContext'
import { claimPendingInvite } from './claimPendingInvite'
import { claimInvite } from './invitesApi'
import {
  clearPendingInvite,
  markInviteChecked,
  readPendingInvite,
  storeInvitedBy,
  wasInviteChecked,
} from './pendingInvite'

export function PendingInviteClaimer() {
  const { session } = useSessionContext()
  const userId = session?.user?.id ?? null
  const token = session?.access_token ?? null
  // One attempt per user per mount; a token refresh must not re-run it.
  const attemptedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || !token || attemptedFor.current === userId) return
    attemptedFor.current = userId
    void claimPendingInvite(
      { id: userId, token },
      {
        readPending: () => readPendingInvite(),
        clearPending: clearPendingInvite,
        wasChecked: wasInviteChecked,
        markChecked: markInviteChecked,
        storeInvitedBy,
        claim: (t, opts) => claimInvite(t, opts),
      }
    ).catch(() => {
      // Storage failures are not worth surfacing; the next session retries.
    })
  }, [userId, token])

  return null
}
