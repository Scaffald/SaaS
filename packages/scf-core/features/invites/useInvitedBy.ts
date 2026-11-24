/**
 * The first name of whoever invited this user, once PendingInviteClaimer has
 * claimed it (#1395). The claim runs on sign-in, so it can finish just after
 * onboarding mounts; one late re-read covers that without a subscription.
 */
import { useEffect, useState } from 'react'
import { readInvitedBy } from './pendingInvite'

const LATE_READ_MS = 2000

export function useInvitedBy(): string | null {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const read = () =>
      readInvitedBy()
        .then((n) => {
          if (!cancelled && n) setName(n)
        })
        .catch(() => {})
    void read()
    const timer = setTimeout(read, LATE_READ_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])
  return name
}
