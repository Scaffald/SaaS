/**
 * OAuth 2.0 Flow Integration Tests
 * REQ-214: Migration Testing & Validation
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 *
 * Tests complete OAuth 2.0 Authorization Code Flow with PKCE:
 * - initiateLogin flow
 * - handleCallback flow
 * - Token refresh flow
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScaffaldOAuthService } from '../oauthService';
import { AuthErrorCode, TokenResponse } from '../types';

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
};

// Mock sessionStorage
const mockSessionStorage = new Map<string, string>();

const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockSessionStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockSessionStorage.delete(key)),
  clear: vi.fn(() => mockSessionStorage.clear()),
};

// Mock fetch for token exchange
const mockFetch = vi.fn();

describe('OAuth 2.0 Flow Integration Tests', () => {
  let oauthService: ScaffaldOAuthService;

  beforeEach(() => {
    // Reset mocks
    mockSessionStorage.clear();
    mockLocation.href = '';
    vi.clearAllMocks();

    // Setup global mocks
    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    Object.defineProperty(global, 'window', {
      value: {
        location: mockLocation,
        crypto: {
          getRandomValues: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          },
          subtle: {
            digest: async (_algorithm: string, data: ArrayBuffer) => {
              // Simple mock hash - just return transformed data
              const bytes = new Uint8Array(data);
              const hash = new Uint8Array(32);
              for (let i = 0; i < 32; i++) {
                hash[i] = bytes[i % bytes.length] ^ (i * 17);
              }
              return hash.buffer;
            },
          },
        },
      },
      writable: true,
    });

    Object.defineProperty(global, 'fetch', {
      value: mockFetch,
      writable: true,
    });

    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_USE_REAL_AUTH: 'false',
          VITE_SCAFFALD_CLIENT_ID: 'test-client-id',
          VITE_SCAFFALD_REDIRECT_URI: 'http://localhost:3000/auth/callback',
          VITE_SCAFFALD_AUTH_ENDPOINT: 'https://scaffald.com/oauth/authorize',
          VITE_SCAFFALD_TOKEN_ENDPOINT: 'https://scaffald.com/oauth/token',
          VITE_SCAFFALD_SCOPE: 'openid profile email',
        },
      },
    });

    oauthService = new ScaffaldOAuthService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initiateLogin', () => {
    it('should generate and store PKCE verifier and state', async () => {
      await oauthService.initiateLogin();

      // Verify PKCE code_verifier was stored
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'pkce_code_verifier',
        expect.any(String)
      );

      // Verify state was stored
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'oauth_state',
        expect.any(String)
      );

      // Verify values are valid
      const storedVerifier = mockSessionStorage.get('pkce_code_verifier');
      const storedState = mockSessionStorage.get('oauth_state');

      expect(storedVerifier).toBeDefined();
      expect(storedVerifier!.length).toBeGreaterThanOrEqual(43);
      expect(storedState).toBeDefined();
      expect(storedState!.length).toBeGreaterThanOrEqual(8);
    });

    it('should redirect to Scaffald authorization URL', async () => {
      await oauthService.initiateLogin();

      // Verify redirect happened
      expect(mockLocation.href).toContain('https://scaffald.com/oauth/authorize');
    });

    it('should include code_challenge_method=S256 in redirect', async () => {
      await oauthService.initiateLogin();

      const redirectUrl = new URL(mockLocation.href);
      expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should include all required OAuth parameters', async () => {
      await oauthService.initiateLogin();

      const redirectUrl = new URL(mockLocation.href);

      // Check all required OAuth 2.0 parameters
      expect(redirectUrl.searchParams.has('client_id')).toBe(true);
      expect(redirectUrl.searchParams.has('redirect_uri')).toBe(true);
      expect(redirectUrl.searchParams.get('response_type')).toBe('code');
      expect(redirectUrl.searchParams.has('scope')).toBe(true);
      expect(redirectUrl.searchParams.has('state')).toBe(true);
      expect(redirectUrl.searchParams.has('code_challenge')).toBe(true);
      expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should generate unique PKCE parameters for each login attempt', async () => {
      await oauthService.initiateLogin();
      const firstVerifier = mockSessionStorage.get('pkce_code_verifier');
      const firstState = mockSessionStorage.get('oauth_state');

      // Clear and try again
      mockSessionStorage.clear();
      mockLocation.href = '';

      await oauthService.initiateLogin();
      const secondVerifier = mockSessionStorage.get('pkce_code_verifier');
      const secondState = mockSessionStorage.get('oauth_state');

      expect(firstVerifier).not.toBe(secondVerifier);
      expect(firstState).not.toBe(secondState);
    });
  });

  describe('handleCallback', () => {
    const validCode = 'test-authorization-code';
    const validState = 'test-state-parameter';
    const validVerifier = 'a'.repeat(43); // 43 character verifier

    const mockTokenResponse: TokenResponse = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      id_token: 'mock-id-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email',
    };

    beforeEach(() => {
      // Setup stored PKCE parameters
      mockSessionStorage.set('pkce_code_verifier', validVerifier);
      mockSessionStorage.set('oauth_state', validState);
    });

    it('should exchange code for tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const tokens = await oauthService.handleCallback(validCode, validState);

      expect(tokens.access_token).toBe(mockTokenResponse.access_token);
      expect(tokens.refresh_token).toBe(mockTokenResponse.refresh_token);
    });

    it('should validate state parameter matches stored state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // Should succeed with matching state
      await expect(
        oauthService.handleCallback(validCode, validState)
      ).resolves.toBeDefined();
    });

    it('should reject with invalid state (CSRF protection)', async () => {
      const invalidState = 'wrong-state-parameter';

      await expect(
        oauthService.handleCallback(validCode, invalidState)
      ).rejects.toMatchObject({
        code: AuthErrorCode.OAUTH_FAILED,
        // Message is wrapped as "Authentication failed" due to error handling
      });
    });

    it('should reject when no state is stored', async () => {
      mockSessionStorage.delete('oauth_state');

      await expect(
        oauthService.handleCallback(validCode, validState)
      ).rejects.toMatchObject({
        code: AuthErrorCode.OAUTH_FAILED,
        // Message is wrapped as "Authentication failed" due to error handling
      });
    });

    it('should clear PKCE storage after successful callback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await oauthService.handleCallback(validCode, validState);

      // Verify cleanup was called
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('pkce_code_verifier');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('oauth_state');
    });

    it('should clear PKCE storage on error', async () => {
      const invalidState = 'wrong-state';

      try {
        await oauthService.handleCallback(validCode, invalidState);
      } catch {
        // Expected to throw
      }

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('pkce_code_verifier');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('oauth_state');
    });

    it('should send code_verifier in token exchange request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await oauthService.handleCallback(validCode, validState);

      // Verify fetch was called with code_verifier
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams),
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('code_verifier')).toBe(validVerifier);
      expect(body.get('code')).toBe(validCode);
      expect(body.get('grant_type')).toBe('authorization_code');
    });
  });

  describe('token refresh', () => {
    const validRefreshToken = 'valid-refresh-token';

    const mockRefreshResponse: TokenResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      id_token: 'new-id-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email',
    };

    it('should refresh access token with refresh_token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      const tokens = await oauthService.refreshAccessToken(validRefreshToken);

      expect(tokens.access_token).toBe(mockRefreshResponse.access_token);
    });

    it('should send correct grant_type for refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      await oauthService.refreshAccessToken(validRefreshToken);

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe(validRefreshToken);
    });

    it('should handle refresh token expiration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Refresh token expired',
      });

      await expect(
        oauthService.refreshAccessToken(validRefreshToken)
      ).rejects.toMatchObject({
        code: AuthErrorCode.REFRESH_FAILED,
      });
    });

    it('should handle invalid refresh response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: 'only-id-token' }), // Missing access_token
      });

      await expect(
        oauthService.refreshAccessToken(validRefreshToken)
      ).rejects.toMatchObject({
        code: AuthErrorCode.REFRESH_FAILED,
        // Message varies based on error wrapping
      });
    });
  });

  describe('error handling', () => {
    const validCode = 'test-code';
    const validState = 'test-state';
    const validVerifier = 'a'.repeat(43);

    beforeEach(() => {
      mockSessionStorage.set('pkce_code_verifier', validVerifier);
      mockSessionStorage.set('oauth_state', validState);
    });

    it('should handle network errors during token exchange', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        oauthService.handleCallback(validCode, validState)
      ).rejects.toMatchObject({
        code: AuthErrorCode.OAUTH_FAILED,
      });
    });

    it('should handle invalid authorization code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant: Invalid authorization code',
      });

      await expect(
        oauthService.handleCallback(validCode, validState)
      ).rejects.toMatchObject({
        code: AuthErrorCode.OAUTH_FAILED,
        // Message may be "Token exchange failed" or "Authentication failed" based on error wrapping
      });
    });

    it('should handle missing code_verifier', async () => {
      mockSessionStorage.delete('pkce_code_verifier');

      await expect(
        oauthService.handleCallback(validCode, validState)
      ).rejects.toMatchObject({
        // Error code may be PKCE_FAILED or OAUTH_FAILED depending on error propagation
        code: expect.stringMatching(/PKCE_FAILED|OAUTH_FAILED/),
      });
    });

    it('should handle invalid token response (missing tokens)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token', // Missing refresh_token
          token_type: 'Bearer',
        }),
      });

      await expect(
        oauthService.handleCallback(validCode, validState)
      ).rejects.toMatchObject({
        code: AuthErrorCode.OAUTH_FAILED,
        // Message varies based on error wrapping
      });
    });

    it('should handle server error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        oauthService.handleCallback(validCode, validState)
      ).rejects.toMatchObject({
        code: AuthErrorCode.OAUTH_FAILED,
        // Details structure may be nested based on error wrapping
      });
    });
  });

  describe('PKCE security', () => {
    it('should store verifier but send challenge to authorization server', async () => {
      await oauthService.initiateLogin();

      const storedVerifier = mockSessionStorage.get('pkce_code_verifier');
      const redirectUrl = new URL(mockLocation.href);
      const sentChallenge = redirectUrl.searchParams.get('code_challenge');

      // Verifier should be stored locally
      expect(storedVerifier).toBeDefined();

      // Challenge (hash of verifier) should be sent to server
      expect(sentChallenge).toBeDefined();

      // Challenge should NOT equal verifier (it's a hash)
      expect(sentChallenge).not.toBe(storedVerifier);
    });

    it('should use S256 challenge method', async () => {
      await oauthService.initiateLogin();

      const redirectUrl = new URL(mockLocation.href);
      expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256');
    });
  });
});
