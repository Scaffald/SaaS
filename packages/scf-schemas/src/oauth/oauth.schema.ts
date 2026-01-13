/**
 * OAuth 2.0 Schemas
 * Type-safe schemas for OAuth endpoints
 */

import { z } from 'zod'

// ==============================================================================
// OAuth App Schemas
// ==============================================================================

export const OAuthAppStatusSchema = z.enum(['pending', 'active', 'trusted', 'suspended', 'revoked'])
export type OAuthAppStatus = z.infer<typeof OAuthAppStatusSchema>

export const OAuthAppSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  client_id: z.string(),
  redirect_uris: z.array(z.string().url()),
  allowed_scopes: z.array(z.string()),
  status: OAuthAppStatusSchema,
  owner_email: z.string().email().nullable(),
  homepage_url: z.string().url().nullable(),
  logo_url: z.string().url().nullable(),
  privacy_policy_url: z.string().url().nullable(),
  terms_of_service_url: z.string().url().nullable(),
  requires_approval: z.boolean(),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().nullable(),
})

export type OAuthApp = z.infer<typeof OAuthAppSchema>

export const RegisterOAuthAppSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  homepage_url: z.string().url(),
  redirect_uris: z.array(z.string().url()).min(1).max(10),
  logo_url: z.string().url().optional(),
  privacy_policy_url: z.string().url().optional(),
  terms_of_service_url: z.string().url().optional(),
  developer_email: z.string().email(),
})

export type RegisterOAuthAppInput = z.infer<typeof RegisterOAuthAppSchema>

// ==============================================================================
// Authorization Flow Schemas
// ==============================================================================

export const AuthorizeRequestSchema = z.object({
  client_id: z.string().uuid(),
  redirect_uri: z.string().url(),
  response_type: z.literal('code'),
  scope: z.string(), // Space-separated scopes
  state: z.string().min(8), // CSRF protection
  code_challenge: z.string(), // Base64url-encoded SHA-256 hash
  code_challenge_method: z.literal('S256'),
})

export type AuthorizeRequest = z.infer<typeof AuthorizeRequestSchema>

export const GrantConsentSchema = z.object({
  oauth_app_id: z.string().uuid(),
  scopes: z.array(z.string()),
  remember: z.boolean().default(false),
  state: z.string(),
  redirect_uri: z.string().url(),
  code_challenge: z.string(),
  code_challenge_method: z.literal('S256'),
})

export type GrantConsentInput = z.infer<typeof GrantConsentSchema>

// ==============================================================================
// Token Flow Schemas
// ==============================================================================

export const TokenRequestSchema = z.discriminatedUnion('grant_type', [
  // Authorization Code Grant
  z.object({
    grant_type: z.literal('authorization_code'),
    code: z.string(),
    redirect_uri: z.string().url(),
    code_verifier: z.string(), // PKCE
    client_id: z.string().uuid(),
    client_secret: z.string(),
  }),
  // Refresh Token Grant
  z.object({
    grant_type: z.literal('refresh_token'),
    refresh_token: z.string(),
    client_id: z.string().uuid(),
    client_secret: z.string(),
  }),
  // Client Credentials Grant
  z.object({
    grant_type: z.literal('client_credentials'),
    scope: z.string().optional(),
    client_id: z.string().uuid(),
    client_secret: z.string(),
  }),
])

export type TokenRequest = z.infer<typeof TokenRequestSchema>

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string(),
})

export type TokenResponse = z.infer<typeof TokenResponseSchema>

// ==============================================================================
// Token Management Schemas
// ==============================================================================

export const RevokeTokenSchema = z.object({
  token: z.string(),
  token_type_hint: z.enum(['access_token', 'refresh_token']).optional(),
  client_id: z.string().uuid(),
  client_secret: z.string(),
})

export type RevokeTokenInput = z.infer<typeof RevokeTokenSchema>

export const IntrospectTokenSchema = z.object({
  token: z.string(),
  client_id: z.string().uuid(),
  client_secret: z.string(),
})

export type IntrospectTokenInput = z.infer<typeof IntrospectTokenSchema>

export const TokenIntrospectionResponseSchema = z.object({
  active: z.boolean(),
  scope: z.string().optional(),
  client_id: z.string().optional(),
  user_id: z.string().uuid().optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
  token_type: z.string().optional(),
})

export type TokenIntrospectionResponse = z.infer<typeof TokenIntrospectionResponseSchema>

// ==============================================================================
// OAuth Scope Schemas
// ==============================================================================

export const OAuthScopeSchema = z.object({
  id: z.string().uuid(),
  scope: z.string(),
  display_name: z.string(),
  description: z.string(),
  category: z.enum(['general', 'documents', 'profile', 'organizations', 'admin']),
  requires_consent: z.boolean(),
  is_sensitive: z.boolean(),
  created_at: z.string().datetime(),
})

export type OAuthScope = z.infer<typeof OAuthScopeSchema>

// ==============================================================================
// User Consent Schemas
// ==============================================================================

export const OAuthUserConsentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  oauth_app_id: z.string().uuid(),
  granted_scopes: z.array(z.string()),
  granted_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  revoked_at: z.string().datetime().nullable(),
})

export type OAuthUserConsent = z.infer<typeof OAuthUserConsentSchema>

// ==============================================================================
// Admin Schemas
// ==============================================================================

export const ApproveOAuthAppSchema = z.object({
  app_id: z.string().uuid(),
  allowed_scopes: z.array(z.string()),
  trust_level: z.enum(['active', 'trusted']),
})

export type ApproveOAuthAppInput = z.infer<typeof ApproveOAuthAppSchema>

export const RejectOAuthAppSchema = z.object({
  app_id: z.string().uuid(),
  reason: z.string().optional(),
})

export type RejectOAuthAppInput = z.infer<typeof RejectOAuthAppSchema>

// ==============================================================================
// PKCE Utility Types
// ==============================================================================

/**
 * PKCE (Proof Key for Code Exchange) parameters
 * Used to secure the authorization code flow
 */
export interface PKCEChallenge {
  code_verifier: string // Random string 43-128 characters
  code_challenge: string // BASE64URL(SHA256(code_verifier))
  code_challenge_method: 'S256'
}

// ==============================================================================
// OAuth Error Types
// ==============================================================================

export const OAuthErrorSchema = z.object({
  error: z.enum([
    'invalid_request',
    'invalid_client',
    'invalid_grant',
    'unauthorized_client',
    'unsupported_grant_type',
    'invalid_scope',
    'server_error',
  ]),
  error_description: z.string().optional(),
  error_uri: z.string().url().optional(),
})

export type OAuthError = z.infer<typeof OAuthErrorSchema>
