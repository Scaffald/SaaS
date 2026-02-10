/**
 * Authentication & Authorization Library
 * OAuth 2.0 + RBAC Authentication System
 *
 * Barrel export for all auth functionality
 */

// Types
export * from './types';

// PKCE utilities
export * from './pkce';

// OAuth service
export { ScaffaldOAuthService, scaffaldOAuth } from './oauthService';

// Token manager
export { TokenManager, tokenManager } from './tokenManager';

// Authorization service
export { AuthorizationService, authorizationService } from './authorizationService';

// Session manager
export { SessionManager, sessionManager, SessionEvent } from './sessionManager';

// Middleware
export * from './middleware';
