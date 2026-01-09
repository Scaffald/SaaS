/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 *
 * Implements RFC 7636 for secure authorization code flow
 */

/**
 * Generate a cryptographically secure code verifier
 *
 * @returns Base64URL-encoded random string (43-128 characters)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Generate a code challenge from a code verifier
 *
 * @param verifier - The code verifier to hash
 * @returns Base64URL-encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

/**
 * Generate a random state parameter for CSRF protection
 *
 * @returns Base64URL-encoded random string
 */
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Base64URL encode a Uint8Array
 *
 * @param buffer - The buffer to encode
 * @returns Base64URL-encoded string
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
