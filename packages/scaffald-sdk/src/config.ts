/**
 * SDK Configuration Types
 */

export interface ScaffaldConfig {
  /**
   * API key for server-side authentication
   * Format: sk_live_... or sk_test_...
   */
  apiKey?: string

  /**
   * OAuth access token for user-facing applications
   */
  accessToken?: string

  /**
   * Base URL for the Scaffald API
   * @default 'https://api.scaffald.com'
   */
  baseUrl?: string

  /**
   * Maximum number of retry attempts for failed requests
   * @default 3
   */
  maxRetries?: number

  /**
   * Timeout for API requests in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number

  /**
   * Custom headers to include with every request
   */
  headers?: Record<string, string>

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

export interface ScaffaldConfigInternal
  extends Required<Omit<ScaffaldConfig, 'apiKey' | 'accessToken'>> {
  apiKey?: string
  accessToken?: string
}

export const DEFAULT_CONFIG: Omit<ScaffaldConfigInternal, 'apiKey' | 'accessToken'> = {
  baseUrl: 'https://api.scaffald.com',
  maxRetries: 3,
  timeout: 30000,
  headers: {},
  debug: false,
}
