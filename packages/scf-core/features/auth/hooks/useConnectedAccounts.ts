/**
 * Connected-accounts hook: lists the current user's Supabase identities and
 * exposes link / unlink wrappers. Backs the /dashboard/settings UI surface
 * for SC-62.
 *
 * Notes on the underlying Supabase API:
 * - `getUserIdentities()` returns the freshest server state, not just the
 *   cached session.user.identities array.
 * - `linkIdentity({ provider })` initiates an OAuth redirect (same shape as
 *   signInWithOAuth) and links the resulting identity to the *current*
 *   session's user. Web-only without extra plumbing on native.
 * - `unlinkIdentity(identity)` is a direct API call — Supabase refuses to
 *   unlink the last identity, returning an error we surface via toast.
 * - Both link / unlink require `security_manual_linking_enabled: true` on
 *   the Supabase project (set across dev/preview/prod in SC-62 Phase 1).
 */

import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import type { UserIdentity } from '@supabase/auth-js'
import { supabase } from '@scf/core/utils/supabase/client'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { logger } from '@scf/core'

type IdentityProvider = 'google' | 'apple'

export type UseConnectedAccountsResult = {
  identities: UserIdentity[]
  isLoading: boolean
  isMutating: boolean
  error: string | null
  refresh: () => Promise<void>
  link: (provider: IdentityProvider) => Promise<{ ok: boolean; error?: string }>
  unlink: (identity: UserIdentity) => Promise<{ ok: boolean; error?: string }>
  /** True when the user has at most one identity — disable disconnect to avoid lockout. */
  isLastIdentity: (identity: UserIdentity) => boolean
}

function buildLinkRedirect(): string | undefined {
  const base = process.env.EXPO_PUBLIC_URL
  if (!base) return undefined
  return `${base.replace(/\/+$/, '')}/dashboard/settings?linked=success`
}

export function useConnectedAccounts(): UseConnectedAccountsResult {
  const [identities, setIdentities] = useState<UserIdentity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase.auth.getUserIdentities()
      if (fetchError) {
        logger.error('getUserIdentities failed', fetchError)
        setError(fetchError.message)
        return
      }
      setIdentities(data?.identities ?? [])
    } catch (err) {
      logger.error('getUserIdentities threw', err)
      setError(err instanceof Error ? err.message : 'unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const link = useCallback(
    async (provider: IdentityProvider) => {
      // Native OAuth-redirect linking would need expo-web-browser plumbing
      // (see Phase 2 follow-up). For v1 the settings UI gates Add buttons
      // on Platform.OS === 'web'; this guard is defense-in-depth.
      if (Platform.OS !== 'web') {
        return { ok: false, error: 'web-only' }
      }
      setIsMutating(true)
      captureEvent('auth_identity_link_started', { provider })
      try {
        const { error: linkError } = await supabase.auth.linkIdentity({
          provider,
          options: { redirectTo: buildLinkRedirect() },
        })
        if (linkError) {
          logger.error('linkIdentity failed', linkError, { provider })
          captureEvent('auth_identity_link_failed', {
            provider,
            error_code: linkError.name ?? null,
            message: linkError.message ?? null,
          })
          return { ok: false, error: linkError.message }
        }
        // Successful initiation — supabase-js redirects the browser. Control
        // returns here only briefly before navigation; the user lands back
        // on /dashboard/settings?linked=success after the round-trip.
        captureEvent('auth_identity_link_initiated', { provider })
        return { ok: true }
      } finally {
        setIsMutating(false)
      }
    },
    []
  )

  const unlink = useCallback(
    async (identity: UserIdentity) => {
      setIsMutating(true)
      captureEvent('auth_identity_unlink_started', { provider: identity.provider })
      try {
        const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity)
        if (unlinkError) {
          logger.error('unlinkIdentity failed', unlinkError, {
            provider: identity.provider,
          })
          captureEvent('auth_identity_unlink_failed', {
            provider: identity.provider,
            error_code: unlinkError.name ?? null,
            message: unlinkError.message ?? null,
          })
          return { ok: false, error: unlinkError.message }
        }
        captureEvent('auth_identity_unlink_succeeded', {
          provider: identity.provider,
        })
        await refresh()
        return { ok: true }
      } finally {
        setIsMutating(false)
      }
    },
    [refresh]
  )

  const isLastIdentity = useCallback(
    (_identity: UserIdentity) => identities.length <= 1,
    [identities.length]
  )

  return {
    identities,
    isLoading,
    isMutating,
    error,
    refresh,
    link,
    unlink,
    isLastIdentity,
  }
}
