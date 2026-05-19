/**
 * OAuth Passthrough Utilities
 * Google/Apple OAuth passthrough for seamless authorization.
 *
 * The OAuth consent flow is inherently web-only — these helpers store the
 * pending authorization in a session-scoped key/value store and trigger a
 * same-origin navigation on web. On native, `continueOAuthFlowIfPending()`
 * returns false (no `window.location` to navigate).
 */

import { openExternalLink, sessionKvStorage } from '@scf/core/utils/platform'

const PENDING_AUTH_KEY = 'oauth_pending_authorization'

interface PendingAuthorization {
  client_id: string
  redirect_uri: string
  state: string
  scope: string
  code_challenge: string
  code_challenge_method: string
  expires_at: string
}

/**
 * Store pending OAuth authorization in session storage
 */
export function storePendingAuthorization(auth: PendingAuthorization): void {
  sessionKvStorage.set(PENDING_AUTH_KEY, JSON.stringify(auth))
}

/**
 * Retrieve pending OAuth authorization from session storage
 */
export function getPendingAuthorization(): PendingAuthorization | null {
  try {
    const stored = sessionKvStorage.get(PENDING_AUTH_KEY)
    if (!stored) return null

    const auth: PendingAuthorization = JSON.parse(stored)

    // Check if expired
    if (new Date(auth.expires_at) < new Date()) {
      clearPendingAuthorization()
      return null
    }

    return auth
  } catch {
    return null
  }
}

/**
 * Clear pending OAuth authorization from session storage
 */
export function clearPendingAuthorization(): void {
  sessionKvStorage.remove(PENDING_AUTH_KEY)
}

/**
 * Check if there's a pending OAuth authorization and continue the flow
 */
export async function continueOAuthFlowIfPending(): Promise<boolean> {
  const pendingAuth = getPendingAuthorization()
  if (!pendingAuth) return false

  // Native deep-linking is out of scope for the OAuth web flow.
  if (typeof window === 'undefined' || !window.location) return false // platform-allow: same-origin redirect needs window.location.origin

  const consentUrl = new URL('/oauth/consent', window.location.origin) // platform-allow: web-only consent redirect
  consentUrl.searchParams.set('client_id', pendingAuth.client_id)
  consentUrl.searchParams.set('redirect_uri', pendingAuth.redirect_uri)
  consentUrl.searchParams.set('state', pendingAuth.state)
  consentUrl.searchParams.set('scope', pendingAuth.scope)
  consentUrl.searchParams.set('code_challenge', pendingAuth.code_challenge)
  consentUrl.searchParams.set('code_challenge_method', pendingAuth.code_challenge_method)

  openExternalLink(consentUrl.toString())
  return true
}
