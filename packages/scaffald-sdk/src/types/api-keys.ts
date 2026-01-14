/**
 * API Keys Types
 *
 * Types for managing API keys, scopes, and usage tracking
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * API key scope permissions
 */
export type ApiKeyScope =
  | 'read:jobs'
  | 'write:jobs'
  | 'read:applications'
  | 'write:applications'
  | 'read:profiles'
  | 'write:profiles'
  | 'read:organizations'
  | 'write:organizations'

/**
 * API key environment
 */
export type ApiKeyEnvironment = 'test' | 'live'

/**
 * Rate limit tier
 */
export type RateLimitTier = 'free' | 'pro' | 'enterprise'

/**
 * API key object
 */
export interface ApiKey {
  /** Unique identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Masked key prefix for display (e.g., "sk_test_abc123...") */
  key_prefix: string
  /** Permission scopes */
  scopes: ApiKeyScope[]
  /** Rate limit tier */
  rate_limit_tier: RateLimitTier
  /** Whether the key is active */
  is_active: boolean
  /** Last time the key was used (ISO 8601) */
  last_used_at: string | null
  /** When the key was created (ISO 8601) */
  created_at: string
  /** When the key expires (ISO 8601) */
  expires_at: string | null
}

/**
 * API key with full key value (only returned on creation)
 */
export interface ApiKeyCreated extends Omit<ApiKey, 'is_active' | 'last_used_at'> {
  /** The full API key - MUST be saved immediately, never shown again */
  key: string
}

/**
 * API key usage record
 */
export interface ApiKeyUsageRecord {
  /** API endpoint called */
  endpoint: string
  /** HTTP method */
  method: string
  /** HTTP status code */
  status_code: number
  /** Response time in milliseconds */
  response_time_ms: number
  /** When the request was made (ISO 8601) */
  timestamp: string
}

/**
 * API key usage statistics
 */
export interface ApiKeyUsageStats {
  /** Total number of requests */
  total_requests: number
  /** Number of successful requests (2xx) */
  success_requests: number
  /** Number of error requests (4xx/5xx) */
  error_requests: number
  /** Error rate as percentage string (e.g., "5.23") */
  error_rate: string
  /** Average response time in milliseconds */
  avg_response_time_ms: number
  /** Number of days in the period */
  period_days: number
  /** Individual usage records */
  usage: ApiKeyUsageRecord[]
}

// ============================================================================
// Request Parameters
// ============================================================================

/**
 * Parameters for creating an API key
 */
export interface CreateApiKeyParams {
  /** Human-readable name for the API key */
  name: string
  /** API key environment */
  environment?: ApiKeyEnvironment
  /** Permission scopes (at least one required) */
  scopes: ApiKeyScope[]
  /** Optional expiration date (ISO 8601 format) */
  expires_at?: string
  /** Rate limit tier */
  rate_limit_tier?: RateLimitTier
}

/**
 * Parameters for updating an API key
 */
export interface UpdateApiKeyParams {
  /** Update the key name */
  name?: string
  /** Activate or deactivate the key */
  is_active?: boolean
  /** Update permission scopes (at least one required if provided) */
  scopes?: ApiKeyScope[]
}

/**
 * Parameters for getting API key usage
 */
export interface GetUsageParams {
  /** Number of days to query (1-90, default 30) */
  days?: number
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response when listing API keys
 */
export interface ApiKeysListResponse {
  data: ApiKey[]
  total: number
}

/**
 * Response when retrieving or updating an API key
 */
export interface ApiKeyResponse {
  /** The API key object */
  key: ApiKey
}

/**
 * Response when creating an API key
 */
export interface ApiKeyCreatedResponse {
  /** The created API key with full key value */
  key: ApiKeyCreated
}

/**
 * Response when revoking an API key
 */
export interface RevokeApiKeyResponse {
  /** API key ID */
  id: string
  /** API key name */
  name: string
  /** Success message */
  message: string
}

/**
 * Response when getting API key usage
 */
export interface ApiKeyUsageResponse {
  usage: ApiKeyUsageStats
}
