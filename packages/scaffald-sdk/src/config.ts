/**
 * Scaffald SDK configuration
 */
export interface ScaffaldConfig {
  /**
   * API key for server-side authentication
   * Format: sk_live_... or sk_test_...
   */
  apiKey?: string

  /**
   * OAuth access token for user authentication
   */
  accessToken?: string

  /**
   * Base URL for the API
   * @default "https://api.scaffald.com"
   */
  baseUrl?: string

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Request timeout in milliseconds
   * @default 60000 (60 seconds)
   */
  timeout?: number

  /**
   * Additional headers to include in all requests
   */
  headers?: Record<string, string>
}

/**
 * Validate SDK configuration
 */
export function validateConfig(config: ScaffaldConfig): void {
  if (!config.apiKey && !config.accessToken) {
    throw new Error('Either apiKey or accessToken must be provided')
  }

  if (config.apiKey && config.accessToken) {
    throw new Error('Cannot provide both apiKey and accessToken')
  }

  if (config.apiKey && !config.apiKey.startsWith('sk_')) {
    throw new Error('API key must start with "sk_"')
  }

  if (config.maxRetries !== undefined && (config.maxRetries < 0 || config.maxRetries > 10)) {
    throw new Error('maxRetries must be between 0 and 10')
  }

  if (config.timeout !== undefined && (config.timeout < 1000 || config.timeout > 300000)) {
    throw new Error('timeout must be between 1000ms and 300000ms (5 minutes)')
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): Partial<ScaffaldConfig> {
  return {
    baseUrl: 'https://api.scaffald.com',
    maxRetries: 3,
    timeout: 60000,
  }
}
