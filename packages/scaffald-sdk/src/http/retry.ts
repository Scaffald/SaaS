import { NetworkError } from './errors.js'

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number
  initialDelay?: number
  maxDelay?: number
  retryableStatusCodes?: number[]
}

/**
 * Default retryable status codes
 */
const DEFAULT_RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  const delay = Math.min(initialDelay * 2 ** attempt, maxDelay)
  // Add jitter (random 0-20%)
  const jitter = delay * 0.2 * Math.random()
  return delay + jitter
}

/**
 * Check if an HTTP method is idempotent
 */
function isIdempotent(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase())
}

/**
 * Check if error is retryable
 */
function isRetryableError(
  error: unknown,
  statusCode: number | undefined,
  retryableStatusCodes: number[]
): boolean {
  // Network errors are always retryable
  if (error instanceof NetworkError) {
    return true
  }

  // Check if status code is retryable
  if (statusCode !== undefined && retryableStatusCodes.includes(statusCode)) {
    return true
  }

  return false
}

/**
 * Retry middleware with exponential backoff
 */
export class RetryMiddleware {
  private maxRetries: number
  private initialDelay: number
  private maxDelay: number
  private retryableStatusCodes: number[]

  constructor(config: RetryConfig) {
    this.maxRetries = config.maxRetries
    this.initialDelay = config.initialDelay || 1000 // 1 second
    this.maxDelay = config.maxDelay || 30000 // 30 seconds
    this.retryableStatusCodes = config.retryableStatusCodes || DEFAULT_RETRYABLE_STATUS_CODES
  }

  async execute(fetchFn: () => Promise<Response>, method: string, attempt = 0): Promise<Response> {
    try {
      const response = await fetchFn()

      // Success - return immediately
      if (response.ok) {
        return response
      }

      // Don't retry non-idempotent methods unless explicitly allowed
      if (!isIdempotent(method) && !this.retryableStatusCodes.includes(response.status)) {
        return response
      }

      // Check if we should retry
      const shouldRetry =
        attempt < this.maxRetries &&
        isRetryableError(null, response.status, this.retryableStatusCodes)

      if (!shouldRetry) {
        return response
      }

      // Handle Retry-After header for 429 responses
      let delay: number
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        if (retryAfter) {
          // Can be seconds or HTTP date
          const retryAfterNum = parseInt(retryAfter, 10)
          if (!Number.isNaN(retryAfterNum)) {
            delay = retryAfterNum * 1000
          } else {
            const retryDate = new Date(retryAfter)
            delay = Math.max(0, retryDate.getTime() - Date.now())
          }
        } else {
          delay = calculateDelay(attempt, this.initialDelay, this.maxDelay)
        }
      } else {
        delay = calculateDelay(attempt, this.initialDelay, this.maxDelay)
      }

      await sleep(delay)
      return this.execute(fetchFn, method, attempt + 1)
    } catch (error) {
      // Network or other fetch errors
      const shouldRetry =
        attempt < this.maxRetries && isRetryableError(error, undefined, this.retryableStatusCodes)

      if (!shouldRetry) {
        throw error
      }

      const delay = calculateDelay(attempt, this.initialDelay, this.maxDelay)
      await sleep(delay)
      return this.execute(fetchFn, method, attempt + 1)
    }
  }
}
