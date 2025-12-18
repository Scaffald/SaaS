// src/lib/scaffald/auth.ts
// REQ-126: OAuth 2.0 + RBAC Authentication System
//
// Token management for Scaffald OAuth

// Feature flag to toggle between magic link and OAuth for Forsured
const USE_OAUTH = import.meta.env.VITE_FORSURED_USE_OAUTH === 'true';
const SCAFFALD_TOKEN_ENDPOINT = import.meta.env.VITE_SCAFFALD_TOKEN_ENDPOINT;
const SCAFFALD_CLIENT_ID = import.meta.env.VITE_SCAFFALD_CLIENT_ID;

interface ScaffaldTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  created_at: number; // Unix timestamp in seconds
}

const TOKEN_KEY = 'scaffald_tokens';

/**
 * Save tokens to localStorage
 */
export function saveTokens(tokens: ScaffaldTokens): void {
  // Ensure created_at is set
  const tokensToSave = {
    ...tokens,
    created_at: tokens.created_at || Math.floor(Date.now() / 1000),
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokensToSave));
  console.log('[ScaffaldAuth] Tokens saved, expires in', tokens.expires_in, 'seconds');
}

/**
 * Get tokens from localStorage
 */
export function getTokens(): ScaffaldTokens | null {
  const tokensString = localStorage.getItem(TOKEN_KEY);
  if (tokensString) {
    try {
      return JSON.parse(tokensString);
    } catch {
      console.error('[ScaffaldAuth] Failed to parse stored tokens');
      clearTokens();
      return null;
    }
  }
  return null;
}

/**
 * Clear tokens from localStorage
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  console.log('[ScaffaldAuth] Tokens cleared');
}

/**
 * Check if token is expired (with 5-minute buffer)
 */
export function isTokenExpired(tokens: ScaffaldTokens): boolean {
  // Add a 5-minute buffer to avoid expiration during requests
  const bufferSeconds = 300;
  const expiryTime = tokens.created_at + tokens.expires_in - bufferSeconds;
  const isExpired = Math.floor(Date.now() / 1000) > expiryTime;

  if (isExpired) {
    console.log('[ScaffaldAuth] Token is expired or expiring soon');
  }

  return isExpired;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<ScaffaldTokens | null> {
  const tokens = getTokens();
  if (!tokens || !tokens.refresh_token) {
    console.log('[ScaffaldAuth] No refresh token available');
    return null;
  }

  console.log('[ScaffaldAuth] Refreshing access token...');

  // Use real API if configured
  if (USE_OAUTH && SCAFFALD_TOKEN_ENDPOINT && SCAFFALD_CLIENT_ID) {
    try {
      const response = await fetch(SCAFFALD_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: SCAFFALD_CLIENT_ID,
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        console.error('[ScaffaldAuth] Token refresh failed:', response.status);
        return null;
      }

      const newTokens = await response.json();
      const tokensWithTimestamp: ScaffaldTokens = {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        expires_in: newTokens.expires_in || 3600,
        token_type: newTokens.token_type || 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      };

      saveTokens(tokensWithTimestamp);
      console.log('[ScaffaldAuth] Token refreshed successfully');
      return tokensWithTimestamp;
    } catch (error) {
      console.error('[ScaffaldAuth] Token refresh error:', error);
      return null;
    }
  }

  // Mock token refresh for development
  console.log('[ScaffaldAuth] Using mock token refresh');
  const newTokens: ScaffaldTokens = {
    access_token: `mock-refreshed-token-${Date.now()}`,
    refresh_token: tokens.refresh_token,
    expires_in: 3600,
    token_type: 'Bearer',
    created_at: Math.floor(Date.now() / 1000),
  };

  saveTokens(newTokens);
  console.log('[ScaffaldAuth] Mock token refreshed');
  return newTokens;
}

/**
 * Get the current access token (refreshing if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  let tokens = getTokens();
  if (!tokens) {
    return null;
  }

  if (isTokenExpired(tokens)) {
    tokens = await refreshAccessToken();
    if (!tokens) {
      return null;
    }
  }

  return tokens.access_token;
}
