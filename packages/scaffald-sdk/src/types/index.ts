/**
 * Re-export common types
 */

// HTTP types
export type {
  HttpClientConfig,
  RequestOptions,
} from '../http/client.js'

export type { RateLimitInfo } from '../http/rate-limit.js'

export type { RetryConfig } from '../http/retry.js'

// Config types
export type { ScaffaldConfig } from '../config.js'

// Error types
export {
  ScaffaldError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ServerError,
  NetworkError,
} from '../http/errors.js'
