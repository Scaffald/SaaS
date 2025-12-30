// src/lib/scaffald/auth.ts
// REQ-126: OAuth 2.0 + RBAC Authentication System
// REQ-11: Authentication Flow Refinement - httpOnly cookie token storage
//
// Secure token management:
// - OAuth mode: Uses httpOnly cookies via Supabase Edge Functions
// - Magic link mode: Uses Supabase's built-in session management

import { supabase } from '../supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const USE_OAUTH = import.meta.env.VITE_FORSURED_USE_OAUTH === 'true';

export interface ScaffaldTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  created_at: number; // Unix timestamp in seconds
}

// Session response from edge functions
export interface SessionResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
  };
  access_token?: string;
  expires_at?: string;
  error?: string;
}

// Token exchange response from edge function
export interface TokenExchangeResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
  };
  access_token?: string;
  expires_at?: string;
  error?: string;
}

// In-memory token storage
// Tokens are retrieved from session on page load and kept in memory only
let memoryTokens: ScaffaldTokens | null = null;

/**
 * Check if token is expired (with 5-minute buffer)
 */
export function isTokenExpired(tokens: ScaffaldTokens): boolean {
  const bufferSeconds = 300;
  const expiryTime = tokens.created_at + tokens.expires_in - bufferSeconds;
  const isExpired = Math.floor(Date.now() / 1000) > expiryTime;

  if (isExpired) {
    console.log('[ScaffaldAuth] Token is expired or expiring soon');
  }

  return isExpired;
}

/**
 * Get the edge function URL
 */
function getEdgeFunctionUrl(name: string): string {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL not configured');
  }
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

/**
 * Exchange OAuth code for tokens via edge function
 * Sets httpOnly session cookie automatically
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenExchangeResponse> {
  const response = await fetch(getEdgeFunctionUrl('auth-token-exchange'), {
    method: 'POST',
    credentials: 'include', // Important: sends/receives cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  const data: TokenExchangeResponse = await response.json();

  if (data.success && data.access_token && data.expires_at) {
    // Store tokens in memory for API calls during this session
    memoryTokens = {
      access_token: data.access_token,
      refresh_token: undefined, // Not returned to client
      expires_in: Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000),
      token_type: 'Bearer',
      created_at: Math.floor(Date.now() / 1000),
    };
    console.log('[ScaffaldAuth] Session established via edge function');
  }

  return data;
}

/**
 * Get current session
 * - OAuth mode: Uses edge function with httpOnly cookies
 * - Magic link mode: Uses Supabase's built-in session
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    if (USE_OAUTH) {
      // OAuth mode: Get session from edge function
      const response = await fetch(getEdgeFunctionUrl('auth-session'), {
        method: 'GET',
        credentials: 'include', // Important: sends session cookie
      });

      const data: SessionResponse = await response.json();

      if (data.valid && data.access_token && data.expires_at) {
        // Update memory tokens
        memoryTokens = {
          access_token: data.access_token,
          refresh_token: undefined,
          expires_in: Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000),
          token_type: 'Bearer',
          created_at: Math.floor(Date.now() / 1000),
        };
      } else {
        memoryTokens = null;
      }

      return data;
    } else {
      // Magic link mode: Get session from Supabase directly
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.log('[ScaffaldAuth] No Supabase session');
        memoryTokens = null;
        return { valid: false, error: error?.message || 'No session' };
      }

      // Update memory tokens from Supabase session
      memoryTokens = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in || 3600,
        token_type: 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      };

      return {
        valid: true,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || null,
        },
        access_token: session.access_token,
        expires_at: new Date(session.expires_at! * 1000).toISOString(),
      };
    }
  } catch (error) {
    console.error('[ScaffaldAuth] Failed to get session:', error);
    memoryTokens = null;
    return { valid: false, error: 'Failed to get session' };
  }
}

/**
 * Refresh tokens
 * - OAuth mode: Uses edge function
 * - Magic link mode: Uses Supabase's built-in refresh
 */
export async function refreshSessionTokens(): Promise<boolean> {
  try {
    if (USE_OAUTH) {
      // OAuth mode: Refresh via edge function
      const response = await fetch(getEdgeFunctionUrl('auth-refresh'), {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.access_token && data.expires_at) {
        memoryTokens = {
          access_token: data.access_token,
          refresh_token: undefined,
          expires_in: Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000),
          token_type: 'Bearer',
          created_at: Math.floor(Date.now() / 1000),
        };
        console.log('[ScaffaldAuth] Tokens refreshed via edge function');
        return true;
      }

      return false;
    } else {
      // Magic link mode: Refresh via Supabase
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error('[ScaffaldAuth] Supabase refresh failed:', error);
        return false;
      }

      memoryTokens = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        token_type: 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      };
      console.log('[ScaffaldAuth] Tokens refreshed via Supabase');
      return true;
    }
  } catch (error) {
    console.error('[ScaffaldAuth] Failed to refresh tokens:', error);
    return false;
  }
}

/**
 * Logout
 * - OAuth mode: Clears httpOnly session cookie via edge function
 * - Magic link mode: Signs out via Supabase
 */
export async function logout(): Promise<void> {
  try {
    if (USE_OAUTH) {
      // OAuth mode: Logout via edge function
      await fetch(getEdgeFunctionUrl('auth-logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } else {
      // Magic link mode: Sign out via Supabase
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error('[ScaffaldAuth] Logout error:', error);
  }
  memoryTokens = null;
  console.log('[ScaffaldAuth] Logged out');
}

/**
 * Get the current access token (from memory, refreshing if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (memoryTokens && !isTokenExpired(memoryTokens)) {
    return memoryTokens.access_token;
  }

  // Need to fetch session from edge function
  const session = await getSession();
  if (session?.valid && session.access_token) {
    return session.access_token;
  }

  return null;
}

/**
 * Get memory tokens
 */
export function getMemoryTokens(): ScaffaldTokens | null {
  return memoryTokens;
}

/**
 * Clear memory tokens
 */
export function clearMemoryTokens(): void {
  memoryTokens = null;
}
