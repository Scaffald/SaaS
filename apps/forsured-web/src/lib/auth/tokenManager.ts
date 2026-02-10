/**
 * Token Manager
 * OAuth 2.0 + RBAC Authentication System
 *
 * Manages JWT access and refresh tokens
 * Handles token storage, validation, and automatic refresh
 */

import {
  TokenResponse,
  AccessTokenClaims,
  UserSession,
  AuthError,
  AuthErrorCode,
} from './types';
import { scaffaldOAuth } from './oauthService';
import { base64UrlDecode } from './pkce';

/**
 * Token storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'forsured_access_token',
  REFRESH_TOKEN: 'forsured_refresh_token',
  TOKEN_EXPIRY: 'forsured_token_expiry',
  USER_SESSION: 'forsured_user_session',
} as const;

/**
 * Token refresh buffer (5 minutes before expiration)
 */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Token Manager Class
 * Handles token lifecycle and automatic refresh
 */
export class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  /**
   * Set tokens from OAuth response
   * Stores tokens securely and extracts user information
   */
  async setTokens(tokens: TokenResponse): Promise<UserSession> {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = Date.now() + tokens.expires_in * 1000;

    // Decode access token to get user info
    const claims = this.decodeAccessToken(tokens.access_token);

    // Create user session
    const session: UserSession = {
      id: crypto.randomUUID(),
      user_id: claims.sub,
      role: claims.user.role,
      organization_id: claims.user.organization_id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: this.tokenExpiry,
      created_at: Date.now(),
      last_activity_at: Date.now(),
    };

    // Store tokens securely
    await this.storeTokensSecurely(session);

    return session;
  }

  /**
   * Get valid access token
   * Automatically refreshes if expired or about to expire
   */
  async getValidAccessToken(): Promise<string> {
    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      await this.refreshPromise;
    }

    // Check if token exists
    if (!this.accessToken) {
      throw this.createAuthError(
        AuthErrorCode.INVALID_TOKEN,
        'No access token available'
      );
    }

    // Check if token is about to expire (within 5 minutes)
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Get current user session
   */
  async getSession(): Promise<UserSession | null> {
    const sessionJson = sessionStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!sessionJson) {
      return null;
    }

    try {
      const session: UserSession = JSON.parse(sessionJson);

      // Update last activity
      session.last_activity_at = Date.now();
      sessionStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error('Failed to parse session:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._refreshAccessToken();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Internal refresh implementation
   */
  private async _refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw this.createAuthError(
        AuthErrorCode.REFRESH_FAILED,
        'No refresh token available'
      );
    }

    try {
      // Call OAuth service to refresh token
      const tokens = await scaffaldOAuth.refreshAccessToken(this.refreshToken);

      // Update stored tokens
      await this.setTokens(tokens);
    } catch (error) {
      // Refresh failed - clear tokens and require re-login
      await this.clearTokens();

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw this.createAuthError(
        AuthErrorCode.REFRESH_FAILED,
        'Token refresh failed - re-login required',
        error
      );
    }
  }

  /**
   * Decode JWT access token (without verification)
   * NOTE: This is for client-side use only. Server must verify signature!
   */
  decodeAccessToken(token: string): AccessTokenClaims {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Decode payload (second part)
      const payload = base64UrlDecode(parts[1]);
      const claims: AccessTokenClaims = JSON.parse(payload);

      return claims;
    } catch (error) {
      console.error('Failed to decode access token:', error);
      throw this.createAuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid access token format',
        error
      );
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry);
  }

  /**
   * Clear all tokens and session data
   */
  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    // Clear storage
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  }

  /**
   * Store tokens securely
   * Uses sessionStorage for web (consider httpOnly cookies for production)
   */
  private async storeTokensSecurely(session: UserSession): Promise<void> {
    try {
      // Store in sessionStorage (cleared on tab close)
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token);
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token);
      sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, session.expires_at.toString());
      sessionStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw this.createAuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to store authentication tokens',
        error
      );
    }
  }

  /**
   * Load tokens from storage on initialization
   */
  private loadTokensFromStorage(): void {
    try {
      this.accessToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this.refreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      const expiryStr = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      this.tokenExpiry = expiryStr ? parseInt(expiryStr, 10) : null;

      // Check if tokens are expired
      if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
        // Tokens expired - clear them
        this.clearTokens();
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      // Clear corrupted storage
      this.clearTokens();
    }
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
export const tokenManager = new TokenManager();
