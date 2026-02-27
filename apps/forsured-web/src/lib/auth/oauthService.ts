/**
 * OAuth 2.0 Service for Scaffald Integration
 * OAuth 2.0 + RBAC Authentication System
 *
 * Handles OAuth 2.0 Authorization Code Flow with PKCE
 */

import {
  TokenResponse,
  OAuthAuthorizationParams,
  TokenExchangeRequest,
  AuthError,
  AuthErrorCode,
} from './types';
import { generatePKCEParams, validateCodeVerifier, validateState } from './pkce';

/**
 * OAuth Configuration
 * Loaded from environment variables
 */
interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
  scope: string;
}

/**
 * Get OAuth configuration from environment
 * Only validates when USE_OAUTH is true to allow testing without OAuth
 */
function getOAuthConfig(): OAuthConfig {
  const useOAuth = import.meta.env.VITE_FORSURED_USE_OAUTH === 'true';
  const clientId = import.meta.env.VITE_SCAFFALD_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SCAFFALD_REDIRECT_URI || `${window.location.origin}/auth/callback`;
  const authEndpoint = import.meta.env.VITE_SCAFFALD_AUTH_ENDPOINT || 'https://scaffald.com/oauth/authorize';
  const tokenEndpoint = import.meta.env.VITE_SCAFFALD_TOKEN_ENDPOINT || 'https://scaffald.com/oauth/token';
  const scope = import.meta.env.VITE_SCAFFALD_SCOPE || 'openid profile email read:user read:company read:projects write:tasks';

  // Only require clientId when OAuth is enabled
  if (useOAuth && !clientId) {
    throw new Error('VITE_SCAFFALD_CLIENT_ID environment variable is required when VITE_FORSURED_USE_OAUTH=true');
  }

  return {
    clientId: clientId || 'mock-client-id',
    redirectUri,
    authEndpoint,
    tokenEndpoint,
    scope,
  };
}

/**
 * Scaffald OAuth Service
 * Handles OAuth 2.0 flow with PKCE
 */
export class ScaffaldOAuthService {
  private config: OAuthConfig;

  constructor() {
    this.config = getOAuthConfig();
  }

  /**
   * Initiate OAuth login flow
   * Generates PKCE parameters, stores them, and redirects to Scaffald
   */
  async initiateLogin(): Promise<void> {
    try {
      // Generate PKCE parameters
      const pkceParams = await generatePKCEParams();

      // Store PKCE code_verifier and state for later validation
      sessionStorage.setItem('pkce_code_verifier', pkceParams.codeVerifier);
      sessionStorage.setItem('oauth_state', pkceParams.state);

      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(pkceParams);

      // Redirect to Scaffald
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate OAuth login:', error);
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'Failed to initiate login',
        error
      );
    }
  }

  /**
   * Build OAuth authorization URL with PKCE parameters
   */
  private buildAuthorizationUrl(pkceParams: { codeChallenge: string; state: string }): string {
    const params: OAuthAuthorizationParams = {
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      state: pkceParams.state,
      code_challenge: pkceParams.codeChallenge,
      code_challenge_method: 'S256',
    };

    const url = new URL(this.config.authEndpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  /**
   * Handle OAuth callback
   * Validates state, exchanges authorization code for tokens
   *
   * @param code - Authorization code from OAuth provider
   * @param state - State parameter from OAuth provider
   * @returns Token response
   */
  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    try {
      // Validate state parameter (CSRF protection)
      this.validateStateParameter(state);

      // Retrieve and validate code_verifier
      const codeVerifier = this.getCodeVerifier();

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);

      // Clean up stored PKCE parameters
      this.clearPKCEStorage();

      return tokens;
    } catch (error) {
      // Clean up on error
      this.clearPKCEStorage();

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AuthError
      }

      console.error('OAuth callback failed:', error);
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'Authentication failed',
        error
      );
    }
  }

  /**
   * Validate state parameter against stored value
   */
  private validateStateParameter(state: string): void {
    const storedState = sessionStorage.getItem('oauth_state');

    if (!storedState) {
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'Invalid request - no state parameter stored'
      );
    }

    if (!validateState(state)) {
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'Invalid state parameter format'
      );
    }

    if (state !== storedState) {
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'State parameter mismatch - possible CSRF attack'
      );
    }
  }

  /**
   * Retrieve and validate stored code_verifier
   */
  private getCodeVerifier(): string {
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    if (!codeVerifier) {
      throw this.createAuthError(
        AuthErrorCode.PKCE_FAILED,
        'Code verifier not found'
      );
    }

    if (!validateCodeVerifier(codeVerifier)) {
      throw this.createAuthError(
        AuthErrorCode.PKCE_FAILED,
        'Invalid code verifier format'
      );
    }

    return codeVerifier;
  }

  /**
   * Exchange authorization code for access/refresh tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    const requestBody: TokenExchangeRequest = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: codeVerifier,
    };

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody as any),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'Token exchange failed',
        { status: response.status, error: errorText }
      );
    }

    const tokens: TokenResponse = await response.json();

    // Validate token response
    if (!tokens.access_token || !tokens.refresh_token) {
      throw this.createAuthError(
        AuthErrorCode.OAUTH_FAILED,
        'Invalid token response - missing required tokens'
      );
    }

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Current refresh token
   * @returns New token response
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const requestBody: TokenExchangeRequest = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
      };

      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestBody as any),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        throw this.createAuthError(
          AuthErrorCode.REFRESH_FAILED,
          'Failed to refresh access token',
          { status: response.status, error: errorText }
        );
      }

      const tokens: TokenResponse = await response.json();

      if (!tokens.access_token) {
        throw this.createAuthError(
          AuthErrorCode.REFRESH_FAILED,
          'Invalid refresh response - missing access token'
        );
      }

      return tokens;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      console.error('Token refresh failed:', error);
      throw this.createAuthError(
        AuthErrorCode.REFRESH_FAILED,
        'Failed to refresh access token',
        error
      );
    }
  }

  /**
   * Clear stored PKCE parameters
   */
  private clearPKCEStorage(): void {
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
  }

  /**
   * Create standardized AuthError
   */
  private createAuthError(
    code: AuthErrorCode,
    message: string,
    details?: any
  ): AuthError {
    return {
      code,
      message,
      details,
    };
  }
}

/**
 * Singleton instance
 */
export const scaffaldOAuth = new ScaffaldOAuthService();
