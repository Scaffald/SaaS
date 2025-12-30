/**
 * Auth Components Barrel Export
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 */

export { LoginPage } from './LoginPage';
export { CallbackPage } from './CallbackPage';
export { UnauthorizedPage } from './UnauthorizedPage';
export { ProtectedRoute, requireAuth, requireRole, requirePermission } from './ProtectedRoute';

// Signup flow components (REQ-4, REQ-126)
export { IndustrySelection, type UserSetType, type IndustrySelectionProps } from './IndustrySelection';
export { UserTypeSelection, type UserType, type UserTypeSelectionProps } from './UserTypeSelection';
export { BrokerInvitationInput, type BrokerInvitationInputProps } from './BrokerInvitationInput';
export { ScaffaldCompanyCard, type ScaffaldCompany, type Address, type ScaffaldCompanyCardProps } from './ScaffaldCompanyCard';
