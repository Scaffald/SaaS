import { Resource } from './base.js'
import type {
  ApiKey,
  ApiKeyCreated,
  ApiKeyUsageStats,
  CreateApiKeyParams,
  UpdateApiKeyParams,
  GetUsageParams,
  RevokeApiKeyResponse,
} from '../types/api-keys.js'

/**
 * API Keys resource for managing authentication keys and tracking usage
 *
 * @remarks
 * All methods require authentication (OAuth token)
 * API keys enable programmatic access to the Scaffald API with scoped permissions
 */
export class ApiKeys extends Resource {
  /**
   * List all API keys for the user's organization
   *
   * @returns List of API keys with masked prefixes
   *
   * @example
   * ```typescript
   * // List all API keys
   * const keys = await client.apiKeys.list()
   * for (const key of keys) {
   *   console.log(`${key.name} - ${key.key_prefix}`)
   *   console.log(`Scopes: ${key.scopes.join(', ')}`)
   *   console.log(`Active: ${key.is_active}`)
   * }
   * ```
   */
  async list(): Promise<ApiKey[]> {
    return this.get<ApiKey[]>('/v1/api-keys')
  }

  /**
   * Create a new API key
   *
   * @param params - API key creation parameters
   * @returns The created API key with full key value (only time it's shown)
   *
   * @remarks
   * **IMPORTANT**: The full API key is only returned once during creation.
   * You must save it immediately - it cannot be retrieved again.
   *
   * @example
   * ```typescript
   * // Create a production API key with specific scopes
   * const result = await client.apiKeys.create({
   *   name: 'Production API Key',
   *   environment: 'live',
   *   scopes: ['read:jobs', 'write:applications'],
   *   rate_limit_tier: 'pro',
   *   expires_at: '2026-12-31T23:59:59Z'
   * })
   *
   * // IMPORTANT: Save result.key immediately!
   * console.log('API Key:', result.key) // sk_live_abc123...
   * console.log('Save this key - you will not see it again!')
   * ```
   */
  async create(params: CreateApiKeyParams): Promise<ApiKeyCreated> {
    return this.post<ApiKeyCreated>('/v1/api-keys', params)
  }

  /**
   * Update an API key's name, scopes, or active status
   *
   * @param id - The API key ID
   * @param params - Update parameters
   * @returns The updated API key
   *
   * @remarks
   * Only organization admins can update API keys
   *
   * @example
   * ```typescript
   * // Update key name and add scopes
   * const updated = await client.apiKeys.update('key_123', {
   *   name: 'Updated Key Name',
   *   scopes: ['read:jobs', 'write:jobs', 'read:applications'],
   *   is_active: true
   * })
   *
   * // Deactivate a key
   * await client.apiKeys.update('key_123', {
   *   is_active: false
   * })
   * ```
   */
  async update(id: string, params: UpdateApiKeyParams): Promise<ApiKey> {
    return this.patch<ApiKey>(`/v1/api-keys/${id}`, params)
  }

  /**
   * Revoke an API key (soft delete)
   *
   * @param id - The API key ID to revoke
   * @returns Confirmation of revocation
   *
   * @remarks
   * Only organization admins can revoke API keys.
   * Revoked keys are deactivated but not deleted from the database.
   *
   * @example
   * ```typescript
   * // Revoke a compromised key
   * const result = await client.apiKeys.revoke('key_123')
   * console.log(result.message) // "API key revoked successfully"
   * ```
   */
  async revoke(id: string): Promise<RevokeApiKeyResponse> {
    return this.post<RevokeApiKeyResponse>(`/v1/api-keys/${id}/revoke`, {})
  }

  /**
   * Get usage statistics for an API key
   *
   * @param id - The API key ID
   * @param params - Optional query parameters
   * @returns Usage statistics and request history
   *
   * @example
   * ```typescript
   * // Get last 30 days of usage (default)
   * const stats = await client.apiKeys.getUsage('key_123')
   * console.log(`Total Requests: ${stats.total_requests}`)
   * console.log(`Success Rate: ${100 - parseFloat(stats.error_rate)}%`)
   * console.log(`Avg Response Time: ${stats.avg_response_time_ms}ms`)
   *
   * // Get last 7 days of usage
   * const weekStats = await client.apiKeys.getUsage('key_123', { days: 7 })
   * for (const record of weekStats.usage.slice(0, 10)) {
   *   console.log(`${record.method} ${record.endpoint} - ${record.status_code}`)
   * }
   * ```
   */
  async getUsage(id: string, params?: GetUsageParams): Promise<ApiKeyUsageStats> {
    return this.get<ApiKeyUsageStats>(`/v1/api-keys/${id}/usage`, params)
  }
}
