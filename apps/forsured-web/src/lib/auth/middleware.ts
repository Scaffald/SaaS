/**
 * Authentication Middleware
 * OAuth 2.0 + RBAC Authentication System
 *
 * Middleware for protecting API routes and validating requests
 */

import { tokenManager } from './tokenManager';
import { authorizationService } from './authorizationService';
import { Permission, Role, AuthError, AuthErrorCode } from './types';

/**
 * API Request Context
 * Attached to requests after authentication
 */
export interface RequestContext {
  userId: string;
  role: Role;
  organizationId: string;
  accessToken: string;
}

/**
 * Middleware to add authentication headers to fetch requests
 */
export async function withAuth(init?: RequestInit): Promise<RequestInit> {
  try {
    const accessToken = await tokenManager.getValidAccessToken();

    return {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    };
  } catch (error) {
    console.error('Failed to add auth headers:', error);
    throw error;
  }
}

/**
 * Authenticated fetch wrapper
 * Automatically adds authentication headers and handles token refresh
 */
export async function authenticatedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  try {
    // Add auth headers
    const authInit = await withAuth(init);

    // Make request
    const response = await fetch(url, authInit);

    // Handle 401 Unauthorized (token expired)
    if (response.status === 401) {
      // Try to refresh token and retry once
      try {
        await tokenManager.getValidAccessToken(); // Will refresh if needed
        const retryInit = await withAuth(init);
        return await fetch(url, retryInit);
      } catch (refreshError) {
        // Refresh failed - throw original error
        throw createAuthError(
          AuthErrorCode.TOKEN_EXPIRED,
          'Authentication expired - please log in again'
        );
      }
    }

    return response;
  } catch (error) {
    console.error('Authenticated fetch failed:', error);
    throw error;
  }
}

/**
 * Check if request is authenticated
 * Validates access token and returns user context
 */
export async function checkAuthentication(): Promise<RequestContext | null> {
  try {
    const session = await tokenManager.getSession();
    if (!session) {
      return null;
    }

    const accessToken = await tokenManager.getValidAccessToken();
    const claims = tokenManager.decodeAccessToken(accessToken);

    return {
      userId: claims.sub,
      role: claims.user.role,
      organizationId: claims.user.organization_id,
      accessToken,
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 * Throws error if not authenticated
 */
export async function requireAuthentication(): Promise<RequestContext> {
  const context = await checkAuthentication();

  if (!context) {
    throw createAuthError(
      AuthErrorCode.INVALID_TOKEN,
      'Authentication required'
    );
  }

  return context;
}

/**
 * Require specific role middleware
 */
export async function requireRole(role: Role): Promise<RequestContext> {
  const context = await requireAuthentication();

  if (context.role !== role && context.role !== 'admin') {
    throw createAuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied - ${role} role required`
    );
  }

  return context;
}

/**
 * Require specific permission middleware
 */
export async function requirePermission(permission: Permission): Promise<RequestContext> {
  const context = await requireAuthentication();

  if (!authorizationService.hasPermission(permission)) {
    throw createAuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied - permission required: ${permission}`
    );
  }

  return context;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<RequestContext> {
  const context = await requireAuthentication();

  if (!authorizationService.hasAnyPermission(permissions)) {
    throw createAuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      'Access denied - insufficient permissions'
    );
  }

  return context;
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<RequestContext> {
  const context = await requireAuthentication();

  if (!authorizationService.hasAllPermissions(permissions)) {
    throw createAuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      'Access denied - insufficient permissions'
    );
  }

  return context;
}

/**
 * Rate limiting helper
 * Simple in-memory rate limiter for client-side
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if request should be allowed
   *
   * @param key - Identifier for rate limiting (e.g., endpoint + userId)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns True if allowed, false if rate limited
   */
  checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Filter out requests outside the time window
    const recentRequests = requests.filter(time => now - time < windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(now, windowMs);
    }

    return true;
  }

  /**
   * Cleanup old entries
   */
  private cleanup(now: number, windowMs: number): void {
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware
 * Throws error if rate limit exceeded
 */
export async function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): Promise<void> {
  const allowed = rateLimiter.checkLimit(key, maxRequests, windowMs);

  if (!allowed) {
    throw createAuthError(
      AuthErrorCode.UNKNOWN_ERROR, // Could add RATE_LIMIT_EXCEEDED
      'Too many requests - please try again later'
    );
  }
}

/**
 * Create standardized AuthError
 */
function createAuthError(code: AuthErrorCode, message: string): AuthError {
  return { code, message };
}
