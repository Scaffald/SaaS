/**
 * PKCE (Proof Key for Code Exchange) utilities
 * Implements RFC 7636 for secure OAuth 2.0 flows
 */

/**
 * Base64 URL encode (RFC 4648)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Generate a cryptographically secure code verifier
 *
 * @returns A random 32-byte code verifier (base64url encoded)
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier()
 * // Store securely (e.g., sessionStorage, secure cookie)
 * sessionStorage.setItem('pkce_verifier', verifier)
 * ```
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Generate code challenge from code verifier using SHA-256
 *
 * @param verifier - The code verifier
 * @returns Promise<string> - The code challenge (base64url encoded SHA-256 hash)
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier()
 * const challenge = await generateCodeChallenge(verifier)
 * // Use challenge in authorization request
 * ```
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

/**
 * Generate a random state parameter for OAuth
 *
 * @returns A random state string
 *
 * @example
 * ```typescript
 * const state = generateState()
 * // Store and verify after OAuth callback
 * sessionStorage.setItem('oauth_state', state)
 * ```
 */
export function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}
