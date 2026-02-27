/**
 * Auth Components Barrel Export
 * OAuth 2.0 + RBAC Authentication System
 * Multi-Industry User Set Type System with Configurable Lexicon
 */

export { LoginPage } from './LoginPage';
export { CallbackPage } from './CallbackPage';
export { UnauthorizedPage } from './UnauthorizedPage';
export { ProtectedRoute, requireAuth, requireRole, requirePermission } from './ProtectedRoute';

// Signup flow components
export { IndustrySelection, type UserSetType, type IndustrySelectionProps } from './IndustrySelection';
export { UserTypeSelection, type UserType, type UserTypeSelectionProps } from './UserTypeSelection';
export { BrokerInvitationInput, type BrokerInvitationInputProps } from './BrokerInvitationInput';
export { ScaffaldCompanyCard, type ScaffaldCompany, type Address, type ScaffaldCompanyCardProps } from './ScaffaldCompanyCard';
