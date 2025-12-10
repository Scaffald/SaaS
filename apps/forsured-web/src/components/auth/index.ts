/**
 * Auth Components Barrel Export
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */

export { LoginPage } from './LoginPage';
export { CallbackPage } from './CallbackPage';
export { UnauthorizedPage } from './UnauthorizedPage';
export { ProtectedRoute, requireAuth, requireRole, requirePermission } from './ProtectedRoute';
