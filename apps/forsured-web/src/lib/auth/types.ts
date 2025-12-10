/**
 * Authentication & Authorization Type Definitions
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */

// Extended UserRole to include Admin
export type Role = 'manager' | 'subcontractor' | 'broker' | 'admin';

/**
 * Permission enum defining all possible actions in the system
 * Follows pattern: RESOURCE_ACTION
 */
export enum Permission {
  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_VIEW_ALL = 'project:view:all',
  PROJECT_VIEW_ASSIGNED = 'project:view:assigned',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',

  // Tasks
  TASK_CREATE = 'task:create',
  TASK_VIEW_ALL = 'task:view:all',
  TASK_VIEW_ASSIGNED = 'task:view:assigned',
  TASK_ASSIGN = 'task:assign',
  TASK_COMPLETE = 'task:complete',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',

  // Documents
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_VIEW = 'document:view',
  DOCUMENT_DOWNLOAD = 'document:download',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_APPROVE = 'document:approve',

  // Policies
  POLICY_CREATE = 'policy:create',
  POLICY_VIEW = 'policy:view',
  POLICY_EDIT = 'policy:edit',
  POLICY_APPROVE = 'policy:approve',
  POLICY_DELETE = 'policy:delete',

  // Users
  USER_CREATE = 'user:create',
  USER_VIEW = 'user:view',
  USER_VIEW_ALL = 'user:view:all',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',

  // Broker Acknowledgements
  BROKER_ACK_CREATE = 'broker_ack:create',
  BROKER_ACK_VIEW = 'broker_ack:view',
  BROKER_ACK_EDIT = 'broker_ack:edit',
  BROKER_ACK_APPROVE = 'broker_ack:approve',
  BROKER_ACK_SUBMIT = 'broker_ack:submit',

  // System Administration
  ADMIN_ACCESS = 'admin:access',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_USERS_MANAGE = 'admin:users:manage',
  ADMIN_ORGANIZATIONS_MANAGE = 'admin:organizations:manage',
}

/**
 * Role-based permission matrix
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  manager: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.TASK_CREATE,
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_ASSIGN,
    Permission.TASK_COMPLETE,
    Permission.TASK_EDIT,
    Permission.TASK_DELETE,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_DELETE,
    Permission.DOCUMENT_APPROVE,
    Permission.POLICY_VIEW,
    Permission.USER_VIEW,
    Permission.USER_INVITE,
    Permission.BROKER_ACK_VIEW,
    Permission.BROKER_ACK_APPROVE,
  ],

  subcontractor: [
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_COMPLETE,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_DELETE, // Own documents only
    Permission.POLICY_VIEW, // Own policies only
    Permission.BROKER_ACK_VIEW, // Where they are the subject
  ],

  broker: [
    Permission.PROJECT_VIEW_ALL, // Client projects only
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.TASK_CREATE, // For clients
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_ASSIGN, // For clients
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.POLICY_CREATE,
    Permission.POLICY_VIEW,
    Permission.POLICY_EDIT,
    Permission.POLICY_APPROVE,
    Permission.USER_VIEW, // Clients only
    Permission.BROKER_ACK_CREATE,
    Permission.BROKER_ACK_VIEW,
    Permission.BROKER_ACK_EDIT,
    Permission.BROKER_ACK_SUBMIT,
  ],

  admin: Object.values(Permission), // Admin has all permissions
};

/**
 * OAuth 2.0 Token Response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: 'Bearer';
  expires_in: number; // Seconds until expiration
  scope: string;
}

/**
 * JWT Access Token Claims
 */
export interface AccessTokenClaims {
  iss: string; // Issuer (e.g., "https://scaffald.com")
  sub: string; // Subject (user ID from Scaffald)
  aud: string; // Audience (ForSured client ID)
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  scope: string; // OAuth scopes
  user: {
    id: string; // Scaffald user ID
    email: string;
    name: string;
    role: Role;
    organization_id: string;
    company_name: string;
  };
}

/**
 * Refresh Token Claims
 */
export interface RefreshTokenClaims {
  iss: string;
  sub: string; // User ID
  aud: string;
  exp: number;
  token_type: 'refresh';
}

/**
 * User Session
 */
export interface UserSession {
  id: string;
  user_id: string;
  role: Role;
  organization_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number; // Timestamp
  created_at: number; // Timestamp
  last_activity_at: number; // Timestamp
}

/**
 * Authentication State
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AccessTokenClaims['user'] | null;
  session: UserSession | null;
  error: AuthError | null;
}

/**
 * Authentication Error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
}

/**
 * Authentication Error Codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  OAUTH_FAILED = 'OAUTH_FAILED',
  PKCE_FAILED = 'PKCE_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * PKCE Parameters
 */
export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/**
 * OAuth Authorization URL Parameters
 */
export interface OAuthAuthorizationParams {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

/**
 * OAuth Token Exchange Request
 */
export interface TokenExchangeRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string; // For authorization_code grant
  refresh_token?: string; // For refresh_token grant
  redirect_uri: string;
  client_id: string;
  code_verifier?: string; // For authorization_code grant with PKCE
}

/**
 * Resource with ownership
 * Used for resource-level authorization checks
 */
export interface OwnedResource {
  id: string;
  type: 'project' | 'task' | 'document' | 'policy' | 'user';
  owner_id?: string;
  manager_id?: string;
  broker_id?: string;
  assigned_to?: string;
  uploaded_by?: string;
  created_by?: string;
  organization_id?: string;
}

/**
 * Authorization Context
 * Contains all information needed for authorization decisions
 */
export interface AuthorizationContext {
  user_id: string;
  role: Role;
  organization_id: string;
  permissions: Permission[];
}
