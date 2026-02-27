/**
 * OAuth Passthrough Utilities
 * Google/Apple OAuth passthrough for seamless authorization
 */

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
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(auth))
  }
}

/**
 * Retrieve pending OAuth authorization from session storage
 */
export function getPendingAuthorization(): PendingAuthorization | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null
  }

  try {
    const stored = window.sessionStorage.getItem(PENDING_AUTH_KEY)
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
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.removeItem(PENDING_AUTH_KEY)
  }
}

/**
 * Check if there's a pending OAuth authorization and continue the flow
 */
export async function continueOAuthFlowIfPending(): Promise<boolean> {
  const pendingAuth = getPendingAuthorization()
  if (!pendingAuth) {
    return false
  }

  // Redirect to consent screen or complete authorization
  const consentUrl = new URL('/oauth/consent', window.location.origin)
  consentUrl.searchParams.set('client_id', pendingAuth.client_id)
  consentUrl.searchParams.set('redirect_uri', pendingAuth.redirect_uri)
  consentUrl.searchParams.set('state', pendingAuth.state)
  consentUrl.searchParams.set('scope', pendingAuth.scope)
  consentUrl.searchParams.set('code_challenge', pendingAuth.code_challenge)
  consentUrl.searchParams.set('code_challenge_method', pendingAuth.code_challenge_method)

  window.location.href = consentUrl.toString()
  return true
}
