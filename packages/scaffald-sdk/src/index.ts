/**
 * Scaffald JavaScript SDK
 *
 * Official SDK for the Scaffald API, providing type-safe access to jobs,
 * applications, profiles, and OAuth endpoints.
 *
 * @packageDocumentation
 */

// Main client
export { Scaffald } from './client.js'

// Configuration
export type { ScaffaldConfig } from './config.js'

// Jobs resources
export type {
  Job,
  JobStatus,
  EmploymentType,
  RemoteOption,
  PayRangeType,
  JobListParams,
  JobListResponse,
  JobResponse,
  SimilarJobsParams,
  SimilarJobsResponse,
  FilterOptionsResponse,
  Pagination,
} from './resources/jobs.js'

// Applications resources
export type {
  Application,
  ApplicationStatus,
  ApplicationType,
  CreateQuickApplicationInput,
  CreateFullApplicationInput,
  UpdateApplicationInput,
  WithdrawApplicationInput,
  ApplicationResponse,
} from './resources/applications.js'

// Profiles resources
export type {
  PublicProfile,
  OrganizationProfile,
  EmployerProfile,
  UserCertification,
  ProfileResponse,
  OrganizationResponse,
  EmployerResponse,
} from './resources/profiles.js'

// API Keys resources
export type {
  APIKey,
  CreatedAPIKey,
  APIKeyEnvironment,
  RateLimitTier,
  APIKeyScope,
  APIKeyCreateParams,
  APIKeyUpdateParams,
  APIKeyUsage,
  APIKeyListParams,
  APIKeyListResponse,
  APIKeyResponse,
  CreatedAPIKeyResponse,
  APIKeyUsageResponse,
  APIKeyRevokeResponse,
} from './resources/api-keys.js'

// Webhooks
export { verifyWebhookSignature, parseWebhook } from './webhooks/verify.js'
export type { WebhookEvent, WebhookPayload } from './webhooks/verify.js'

// OAuth & Authentication
export { OAuthClient } from './auth/oauth.js'
export { generateCodeVerifier, generateCodeChallenge, generateState } from './auth/pkce.js'
export type {
  OAuthScope,
  AuthorizationUrlOptions,
  AuthorizationUrlResult,
  TokenExchangeOptions,
  TokenResponse,
} from './auth/oauth.js'

// HTTP types
export type {
  HttpClientConfig,
  RequestOptions,
  RateLimitInfo,
  RetryConfig,
} from './types/index.js'

// Errors
export {
  ScaffaldError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ServerError,
  NetworkError,
} from './types/index.js'

// Default export
export { Scaffald as default } from './client.js'
