/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 *
 * Implements PKCE flow to prevent authorization code interception attacks
 * Reference: RFC 7636 - https://tools.ietf.org/html/rfc7636
 */

import { PKCEParams } from './types';

/**
 * Generate a cryptographically random code verifier
 * Must be 43-128 characters long
 * Uses base64url encoding (URL-safe base64)
 *
 * @returns Code verifier string (43 characters from 32 random bytes)
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  // Convert to base64url (URL-safe base64 without padding)
  return base64UrlEncode(array);
}

/**
 * Generate code challenge from code verifier
 * Uses SHA-256 hash and base64url encoding
 *
 * @param verifier - The code verifier to hash
 * @returns Code challenge string
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Encode the verifier as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Encode as base64url
  return base64UrlEncode(hashArray);
}

/**
 * Generate a random state parameter for CSRF protection
 *
 * @returns Random state string (32 characters)
 */
export function generateState(): string {
  const array = new Uint8Array(24); // 24 bytes = 32 base64url chars
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate complete PKCE parameters
 * Includes code verifier, code challenge, and state
 *
 * @returns Promise resolving to PKCEParams
 */
export async function generatePKCEParams(): Promise<PKCEParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

/**
 * Base64URL encoding helper
 * Converts byte array to URL-safe base64 string (no padding)
 *
 * @param buffer - Uint8Array to encode
 * @returns Base64URL encoded string
 */
function base64UrlEncode(buffer: Uint8Array): string {
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...buffer));

  // Convert to base64url (URL-safe)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, ''); // Remove padding
}

/**
 * Base64URL decoding helper
 *
 * @param base64url - Base64URL encoded string
 * @returns Decoded string
 */
export function base64UrlDecode(base64url: string): string {
  // Convert base64url to base64
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Add padding if needed
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64url string');
    }
    base64 += '='.repeat(4 - pad);
  }

  // Decode
  return atob(base64);
}

/**
 * Validate code verifier format
 * Must be 43-128 characters, base64url encoded
 *
 * @param verifier - Code verifier to validate
 * @returns True if valid, false otherwise
 */
export function validateCodeVerifier(verifier: string): boolean {
  if (!verifier || verifier.length < 43 || verifier.length > 128) {
    return false;
  }

  // Check if it's valid base64url (only contains A-Z, a-z, 0-9, -, _)
  const base64UrlRegex = /^[A-Za-z0-9\-_]+$/;
  return base64UrlRegex.test(verifier);
}

/**
 * Validate state parameter format
 *
 * @param state - State parameter to validate
 * @returns True if valid, false otherwise
 */
export function validateState(state: string): boolean {
  if (!state || state.length < 8) {
    return false;
  }

  // Check if it's valid base64url or hex
  const validFormatRegex = /^[A-Za-z0-9\-_]+$/;
  return validFormatRegex.test(state);
}
