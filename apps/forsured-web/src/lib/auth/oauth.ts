// src/lib/auth/oauth.ts
// OAuth 2.0 + RBAC Authentication System
//
// Handles OAuth initiation with support for mock mode in development

interface OAuthOptions {
  loginHint?: string;
  state?: string;
}

// Feature flag to toggle between mock and real OAuth
const USE_OAUTH = import.meta.env.VITE_FORSURED_USE_OAUTH === 'true';
const SCAFFALD_AUTH_URL = import.meta.env.VITE_SCAFFALD_AUTH_URL;
const SCAFFALD_CLIENT_ID = import.meta.env.VITE_SCAFFALD_CLIENT_ID;

function generateState() {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  );
}

/**
 * Initiate OAuth flow
 *
 * In magic link mode (VITE_FORSURED_USE_OAUTH=false), this simulates the OAuth flow
 * by redirecting directly to /callback with mock parameters.
 *
 * In real mode, this redirects to the actual Scaffald OAuth server.
 */
export function initiateOAuth(options: OAuthOptions = {}) {
  const state = options.state || generateState();

  // Store state for CSRF protection (used by both mock and real modes)
  sessionStorage.setItem('oauth_state', state);

  // Magic link mode: simulate OAuth by redirecting directly to callback
  if (!USE_OAUTH) {
    console.log('[OAuth] Magic link mode - simulating OAuth flow');
    const mockCode = `mock-auth-code-${Date.now()}`;
    // Store login hint for mock auth to use
    if (options.loginHint) {
      sessionStorage.setItem('mock_login_hint', options.loginHint);
    }
    window.location.href = `${window.location.origin}/callback?code=${mockCode}&state=${state}`;
    return;
  }

  // Real mode: redirect to actual Scaffald OAuth server
  if (!SCAFFALD_AUTH_URL || !SCAFFALD_CLIENT_ID) {
    console.error('[OAuth] Missing VITE_SCAFFALD_AUTH_URL or VITE_SCAFFALD_CLIENT_ID');
    throw new Error('OAuth is not configured. Please check your environment variables.');
  }

  const params = new URLSearchParams({
    client_id: SCAFFALD_CLIENT_ID,
    redirect_uri: `${window.location.origin}/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    state,
  });

  // Pre-fill email in Scaffald login/signup
  if (options.loginHint) {
    params.set('login_hint', options.loginHint);
  }

  console.log('[OAuth] Redirecting to Scaffald OAuth');
  window.location.href = `${SCAFFALD_AUTH_URL}/authorize?${params}`;
}
