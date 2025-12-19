/**
 * Authentication Middleware Tests
 * REQ-214: Migration Testing & Validation
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 *
 * Tests middleware functions for:
 * - Authentication checking
 * - Role-based access control
 * - Permission validation
 * - Rate limiting
 * - Authenticated fetch requests
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  withAuth,
  authenticatedFetch,
  checkAuthentication,
  requireAuthentication,
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  rateLimiter,
  rateLimit,
  RequestContext,
} from '../middleware';
import { tokenManager } from '../tokenManager';
import { authorizationService } from '../authorizationService';
import { AuthErrorCode, Permission, UserSession, AccessTokenClaims } from '../types';

// Mock the dependencies
vi.mock('../tokenManager', () => ({
  tokenManager: {
    getValidAccessToken: vi.fn(),
    getSession: vi.fn(),
    decodeAccessToken: vi.fn(),
  },
}));

vi.mock('../authorizationService', () => ({
  authorizationService: {
    hasPermission: vi.fn(),
    hasAnyPermission: vi.fn(),
    hasAllPermissions: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();

describe('Authentication Middleware Tests', () => {
  const mockAccessToken = 'mock-access-token-xyz';
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  const mockSession: UserSession = {
    id: 'session-1',
    user_id: mockUserId,
    role: 'manager',
    organization_id: mockOrgId,
    access_token: mockAccessToken,
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
    created_at: Date.now(),
    last_activity_at: Date.now(),
  };

  const mockClaims: AccessTokenClaims = {
    iss: 'https://scaffald.com',
    sub: mockUserId,
    aud: 'forsured-client',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    scope: 'openid profile email',
    user: {
      id: mockUserId,
      email: 'manager@test.com',
      name: 'Test Manager',
      role: 'manager',
      organization_id: mockOrgId,
      company_name: 'Test Company',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global, 'fetch', {
      value: mockFetch,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('withAuth', () => {
    it('should add Authorization header with Bearer token', async () => {
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);

      const init = await withAuth();

      expect(init.headers).toBeDefined();
      expect((init.headers as Record<string, string>)['Authorization']).toBe(
        `Bearer ${mockAccessToken}`
      );
    });

    it('should preserve existing headers', async () => {
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);

      const init = await withAuth({
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      });

      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect((init.headers as Record<string, string>)['X-Custom-Header']).toBe('custom-value');
      expect((init.headers as Record<string, string>)['Authorization']).toBe(
        `Bearer ${mockAccessToken}`
      );
    });

    it('should preserve other RequestInit options', async () => {
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);

      const init = await withAuth({
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ data: 'test' }));
    });

    it('should throw if no access token available', async () => {
      (tokenManager.getValidAccessToken as Mock).mockRejectedValue(
        new Error('No access token')
      );

      await expect(withAuth()).rejects.toThrow('No access token');
    });
  });

  describe('authenticatedFetch', () => {
    it('should make authenticated request with valid token', async () => {
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      mockFetch.mockResolvedValue(new Response('success', { status: 200 }));

      const response = await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
      expect(response.status).toBe(200);
    });

    it('should retry with refreshed token on 401', async () => {
      // First call returns 401, second succeeds
      (tokenManager.getValidAccessToken as Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce('new-access-token');

      mockFetch
        .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
        .mockResolvedValueOnce(new Response('success', { status: 200 }));

      const response = await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    it('should throw TOKEN_EXPIRED error when refresh fails', async () => {
      (tokenManager.getValidAccessToken as Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockRejectedValueOnce(new Error('Refresh failed'));

      mockFetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }));

      await expect(authenticatedFetch('/api/test')).rejects.toMatchObject({
        code: AuthErrorCode.TOKEN_EXPIRED,
      });
    });

    it('should return non-401 errors without retry', async () => {
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      mockFetch.mockResolvedValue(new Response('Server Error', { status: 500 }));

      const response = await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(500);
    });
  });

  describe('checkAuthentication', () => {
    it('should return RequestContext for authenticated user', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);

      const context = await checkAuthentication();

      expect(context).not.toBeNull();
      expect(context!.userId).toBe(mockUserId);
      expect(context!.role).toBe('manager');
      expect(context!.organizationId).toBe(mockOrgId);
      expect(context!.accessToken).toBe(mockAccessToken);
    });

    it('should return null when no session exists', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(null);

      const context = await checkAuthentication();

      expect(context).toBeNull();
    });

    it('should return null when token validation fails', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockRejectedValue(new Error('Invalid token'));

      const context = await checkAuthentication();

      expect(context).toBeNull();
    });
  });

  describe('requireAuthentication', () => {
    it('should return RequestContext for authenticated user', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);

      const context = await requireAuthentication();

      expect(context.userId).toBe(mockUserId);
      expect(context.role).toBe('manager');
    });

    it('should throw INVALID_TOKEN when not authenticated', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(null);

      await expect(requireAuthentication()).rejects.toMatchObject({
        code: AuthErrorCode.INVALID_TOKEN,
        message: 'Authentication required',
      });
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);
    });

    it('should allow access when user has required role', async () => {
      const context = await requireRole('manager');

      expect(context.role).toBe('manager');
    });

    it('should allow admin access to any role-protected route', async () => {
      const adminClaims = { ...mockClaims, user: { ...mockClaims.user, role: 'admin' as const } };
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(adminClaims);

      const context = await requireRole('manager');

      expect(context.role).toBe('admin');
    });

    it('should throw INSUFFICIENT_PERMISSIONS for wrong role', async () => {
      await expect(requireRole('broker')).rejects.toMatchObject({
        code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        message: expect.stringContaining('broker role required'),
      });
    });
  });

  describe('requirePermission', () => {
    beforeEach(() => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);
    });

    it('should allow access when user has permission', async () => {
      (authorizationService.hasPermission as Mock).mockReturnValue(true);

      const context = await requirePermission(Permission.PROJECT_CREATE);

      expect(context.userId).toBe(mockUserId);
      expect(authorizationService.hasPermission).toHaveBeenCalledWith(Permission.PROJECT_CREATE);
    });

    it('should throw INSUFFICIENT_PERMISSIONS when lacking permission', async () => {
      (authorizationService.hasPermission as Mock).mockReturnValue(false);

      await expect(requirePermission(Permission.ADMIN_ACCESS)).rejects.toMatchObject({
        code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        message: expect.stringContaining('admin:access'),
      });
    });
  });

  describe('requireAnyPermission', () => {
    beforeEach(() => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);
    });

    it('should allow access when user has any of the permissions', async () => {
      (authorizationService.hasAnyPermission as Mock).mockReturnValue(true);

      const permissions = [Permission.PROJECT_CREATE, Permission.TASK_CREATE];
      const context = await requireAnyPermission(permissions);

      expect(context.userId).toBe(mockUserId);
      expect(authorizationService.hasAnyPermission).toHaveBeenCalledWith(permissions);
    });

    it('should throw INSUFFICIENT_PERMISSIONS when lacking all permissions', async () => {
      (authorizationService.hasAnyPermission as Mock).mockReturnValue(false);

      await expect(
        requireAnyPermission([Permission.ADMIN_ACCESS, Permission.ADMIN_SETTINGS])
      ).rejects.toMatchObject({
        code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      });
    });
  });

  describe('requireAllPermissions', () => {
    beforeEach(() => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);
    });

    it('should allow access when user has all permissions', async () => {
      (authorizationService.hasAllPermissions as Mock).mockReturnValue(true);

      const permissions = [Permission.PROJECT_VIEW_ASSIGNED, Permission.TASK_VIEW_ASSIGNED];
      const context = await requireAllPermissions(permissions);

      expect(context.userId).toBe(mockUserId);
      expect(authorizationService.hasAllPermissions).toHaveBeenCalledWith(permissions);
    });

    it('should throw INSUFFICIENT_PERMISSIONS when missing any permission', async () => {
      (authorizationService.hasAllPermissions as Mock).mockReturnValue(false);

      await expect(
        requireAllPermissions([Permission.PROJECT_CREATE, Permission.ADMIN_ACCESS])
      ).rejects.toMatchObject({
        code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      });
    });
  });

  describe('Rate Limiter', () => {
    beforeEach(() => {
      // Create new rate limiter state for each test
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests within limit', () => {
      const key = 'test-endpoint-1';

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit(key, 10, 60000)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const key = 'test-endpoint-2';

      // Make max requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(key, 10, 60000);
      }

      // 11th request should be blocked
      expect(rateLimiter.checkLimit(key, 10, 60000)).toBe(false);
    });

    it('should reset after time window passes', () => {
      const key = 'test-endpoint-3';

      // Make max requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(key, 10, 60000);
      }

      // Should be blocked
      expect(rateLimiter.checkLimit(key, 10, 60000)).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(60001);

      // Should be allowed again
      expect(rateLimiter.checkLimit(key, 10, 60000)).toBe(true);
    });

    it('should track different keys separately', () => {
      const key1 = 'endpoint-a';
      const key2 = 'endpoint-b';

      // Max out key1
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(key1, 3, 60000);
      }
      expect(rateLimiter.checkLimit(key1, 3, 60000)).toBe(false);

      // key2 should still be allowed
      expect(rateLimiter.checkLimit(key2, 3, 60000)).toBe(true);
    });
  });

  describe('rateLimit middleware', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should pass when under rate limit', async () => {
      await expect(rateLimit('test-key-pass', 10, 60000)).resolves.toBeUndefined();
    });

    it('should throw when rate limit exceeded', async () => {
      const key = 'test-key-exceeded';

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await rateLimit(key, 10, 60000);
      }

      await expect(rateLimit(key, 10, 60000)).rejects.toMatchObject({
        message: expect.stringContaining('Too many requests'),
      });
    });
  });

  describe('Unauthenticated Access Handling', () => {
    it('should redirect logic return null from checkAuthentication', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(null);

      const context = await checkAuthentication();

      // Application code would use this null to redirect to login
      expect(context).toBeNull();
    });

    it('should throw from requireAuthentication for redirect handling', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(null);

      // Application code catches this to redirect to login
      try {
        await requireAuthentication();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe(AuthErrorCode.INVALID_TOKEN);
        // Application can extract return URL from current location
      }
    });
  });

  describe('Token Expiration Handling', () => {
    it('should handle expired session gracefully', async () => {
      const expiredSession: UserSession = {
        ...mockSession,
        expires_at: Date.now() - 1000, // Expired
      };
      (tokenManager.getSession as Mock).mockResolvedValue(expiredSession);
      (tokenManager.getValidAccessToken as Mock).mockRejectedValue({
        code: AuthErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
      });

      const context = await checkAuthentication();

      expect(context).toBeNull();
    });

    it('should propagate TOKEN_EXPIRED from authenticatedFetch', async () => {
      (tokenManager.getValidAccessToken as Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockRejectedValueOnce({
          code: AuthErrorCode.TOKEN_EXPIRED,
          message: 'Token expired',
        });
      mockFetch.mockResolvedValue(new Response('', { status: 401 }));

      await expect(authenticatedFetch('/api/protected')).rejects.toMatchObject({
        code: AuthErrorCode.TOKEN_EXPIRED,
      });
    });
  });

  describe('Public Routes Simulation', () => {
    // These tests show how the middleware can be used to handle public vs protected routes
    it('checkAuthentication returns context for authenticated public route access', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(mockSession);
      (tokenManager.getValidAccessToken as Mock).mockResolvedValue(mockAccessToken);
      (tokenManager.decodeAccessToken as Mock).mockReturnValue(mockClaims);

      // Public routes can use checkAuthentication (not require)
      // to optionally personalize content for logged-in users
      const context = await checkAuthentication();

      expect(context).not.toBeNull();
    });

    it('checkAuthentication returns null for unauthenticated public route access', async () => {
      (tokenManager.getSession as Mock).mockResolvedValue(null);

      // Public routes can still be accessed without authentication
      const context = await checkAuthentication();

      expect(context).toBeNull();
      // Application serves public content regardless
    });
  });
});
