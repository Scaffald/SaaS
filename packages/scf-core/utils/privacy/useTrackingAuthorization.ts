/**
 * React hook for ATT status. Subscribes the component to status changes that
 * happen from anywhere (request prompt, app foreground refresh) without
 * needing a context provider — the underlying module is a small module-level
 * singleton, which is appropriate for an OS-backed permission.
 */

import { useCallback, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import {
  getTrackingAuthorizationStatus,
  refreshTrackingAuthorizationStatus,
  requestTrackingAuthorization,
} from './tracking-authorization'
import type { TrackingAuthorizationStatus } from './types'
import { canLinkIdentity } from './types'

export type UseTrackingAuthorizationResult = {
  status: TrackingAuthorizationStatus
  /** True if this platform/version requires the ATT prompt at all. */
  isApplicable: boolean
  /** True if PostHog identify / Sentry setUser-with-PII calls are permitted. */
  canLinkIdentity: boolean
  /** Re-read the OS-level permission (call on app foreground). */
  refresh: () => Promise<TrackingAuthorizationStatus>
  /** Show the ATT prompt if not yet decided. */
  request: () => Promise<TrackingAuthorizationStatus>
}

export function useTrackingAuthorization(): UseTrackingAuthorizationResult {
  const [status, setStatus] = useState<TrackingAuthorizationStatus>(
    getTrackingAuthorizationStatus
  )

  const refresh = useCallback(async () => {
    const next = await refreshTrackingAuthorizationStatus()
    setStatus(next)
    return next
  }, [])

  const request = useCallback(async () => {
    const next = await requestTrackingAuthorization()
    setStatus(next)
    return next
  }, [])

  // Re-read on first mount and whenever the app comes to the foreground —
  // the user can change the toggle in iOS Settings while we're backgrounded.
  useEffect(() => {
    void refresh()
    const subscription = AppState.addEventListener(
      'change',
      (next: AppStateStatus) => {
        if (next === 'active') void refresh()
      }
    )
    return () => subscription.remove()
  }, [refresh])

  return {
    status,
    isApplicable: status !== 'unavailable',
    canLinkIdentity: canLinkIdentity(status),
    refresh,
    request,
  }
}
