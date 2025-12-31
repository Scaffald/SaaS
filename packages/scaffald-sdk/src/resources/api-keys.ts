import { BaseResource } from './base.js'

/**
 * API key environment
 */
export type APIKeyEnvironment = 'test' | 'live'

/**
 * Rate limit tier
 */
export type RateLimitTier = 'free' | 'pro' | 'enterprise'

/**
 * API key scopes
 */
export type APIKeyScope =
  | 'read:jobs'
  | 'write:jobs'
  | 'read:applications'
  | 'write:applications'
  | 'read:profiles'
  | 'write:profiles'
  | 'read:organizations'
  | 'write:organizations'

/**
 * API key object
 */
export interface APIKey {
  id: string
  organization_id: string
  name: string
  key_prefix: string
  scopes: APIKeyScope[]
  rate_limit_tier: RateLimitTier
  is_active: boolean
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}

/**
 * Created API key (includes full key - only returned once!)
 */
export interface CreatedAPIKey extends APIKey {
  key: string
}

/**
 * API key create parameters
 */
export interface APIKeyCreateParams {
  name: string
  scopes: APIKeyScope[]
  environment?: APIKeyEnvironment
  rate_limit_tier?: RateLimitTier
  expires_at?: string
}

/**
 * API key update parameters
 */
export interface APIKeyUpdateParams {
  name?: string
  scopes?: APIKeyScope[]
  is_active?: boolean
}

/**
 * API key usage statistics
 */
export interface APIKeyUsage {
  total_requests: number
  success_requests: number
  error_requests: number
  error_rate: string
  avg_response_time_ms: number
  period_days: number
  usage: Array<{
    endpoint: string
    method: string
    status_code: number
    response_time_ms: number
    timestamp: string
  }>
}

/**
 * API key list parameters
 */
export interface APIKeyListParams {
  limit?: number
  offset?: number
}

/**
 * API key list response
 */
export interface APIKeyListResponse {
  data: APIKey[]
}

/**
 * API key response
 */
export interface APIKeyResponse {
  data: APIKey
}

/**
 * Created API key response
 */
export interface CreatedAPIKeyResponse {
  data: CreatedAPIKey
  warning?: string
}

/**
 * API key usage response
 */
export interface APIKeyUsageResponse {
  data: APIKeyUsage
}

/**
 * API key revoke response
 */
export interface APIKeyRevokeResponse {
  data: {
    id: string
    name: string
    message: string
  }
}

/**
 * API Keys resource
 *
 * Manage API keys for third-party integrations and SDK access.
 * API keys must be used from server-side code only.
 *
 * @example
 * ```typescript
 * // List all API keys
 * const keys = await client.apiKeys.list()
 *
 * // Create a new API key
 * const newKey = await client.apiKeys.create({
 *   name: 'Production API Key',
 *   scopes: ['read:jobs', 'read:applications'],
 *   rate_limit_tier: 'pro',
 *   expires_at: '2025-12-31T23:59:59Z'
 * })
 * console.log('Save this key:', newKey.data.key) // Only shown once!
 *
 * // Update key scopes
 * await client.apiKeys.update('key_id', {
 *   scopes: ['read:jobs', 'write:jobs']
 * })
 *
 * // Get usage statistics
 * const usage = await client.apiKeys.getUsage('key_id', 30) // Last 30 days
 *
 * // Revoke a key
 * await client.apiKeys.revoke('key_id')
 * ```
 */
export class APIKeysResource extends BaseResource {
  /**
   * List all API keys for your organization
   *
   * @example
   * ```typescript
   * const keys = await client.apiKeys.list()
   * for (const key of keys.data) {
   *   console.log(`${key.name}: ${key.key_prefix} (${key.scopes.join(', ')})`)
   * }
   * ```
   */
  async list(params?: APIKeyListParams): Promise<APIKeyListResponse> {
    return this.client.get<APIKeyListResponse>(
      '/v1/api-keys',
      params as Record<string, string | number | boolean | undefined>
    )
  }

  /**
   * Create a new API key
   *
   * WARNING: The full API key is only returned in this response.
   * Save it immediately as it cannot be retrieved later.
   *
   * @example
   * ```typescript
   * const result = await client.apiKeys.create({
   *   name: 'Production API Key',
   *   scopes: ['read:jobs', 'read:applications'],
   *   environment: 'live',
   *   rate_limit_tier: 'pro',
   *   expires_at: '2025-12-31T23:59:59Z'
   * })
   *
   * // Save this key securely - it will only be shown once!
   * const apiKey = result.data.key
   * console.log('Your API key:', apiKey)
   * console.log('Warning:', result.warning)
   * ```
   */
  async create(params: APIKeyCreateParams): Promise<CreatedAPIKeyResponse> {
    return this.client.post<CreatedAPIKeyResponse>('/v1/api-keys', params)
  }

  /**
   * Retrieve a specific API key by ID
   *
   * Note: This does NOT return the full key, only metadata.
   *
   * @example
   * ```typescript
   * const key = await client.apiKeys.retrieve('key_id')
   * console.log(key.data.name, key.data.scopes)
   * ```
   */
  async retrieve(id: string): Promise<APIKeyResponse> {
    return this.client.get<APIKeyResponse>(`/v1/api-keys/${id}`)
  }

  /**
   * Update an API key's name, scopes, or active status
   *
   * Only organization admins can update API keys.
   *
   * @example
   * ```typescript
   * // Update scopes
   * await client.apiKeys.update('key_id', {
   *   scopes: ['read:jobs', 'write:jobs', 'read:applications']
   * })
   *
   * // Rename key
   * await client.apiKeys.update('key_id', {
   *   name: 'Updated Key Name'
   * })
   *
   * // Deactivate key
   * await client.apiKeys.update('key_id', {
   *   is_active: false
   * })
   * ```
   */
  async update(id: string, params: APIKeyUpdateParams): Promise<APIKeyResponse> {
    return this.client.patch<APIKeyResponse>(`/v1/api-keys/${id}`, params)
  }

  /**
   * Revoke an API key (soft delete)
   *
   * The key will be permanently deactivated and cannot be re-enabled.
   * Only organization admins can revoke API keys.
   *
   * @example
   * ```typescript
   * await client.apiKeys.revoke('key_id')
   * ```
   */
  async revoke(id: string): Promise<APIKeyRevokeResponse> {
    return this.client.delete<APIKeyRevokeResponse>(`/v1/api-keys/${id}`)
  }

  /**
   * Get usage statistics for an API key
   *
   * @param id - API key ID
   * @param days - Number of days to query (default: 30, max: 90)
   *
   * @example
   * ```typescript
   * const usage = await client.apiKeys.getUsage('key_id', 30)
   * console.log(`Total requests: ${usage.data.total_requests}`)
   * console.log(`Error rate: ${usage.data.error_rate}%`)
   * console.log(`Avg response time: ${usage.data.avg_response_time_ms}ms`)
   * ```
   */
  async getUsage(id: string, days: number = 30): Promise<APIKeyUsageResponse> {
    return this.client.get<APIKeyUsageResponse>(`/v1/api-keys/${id}/usage`, { days })
  }
}
