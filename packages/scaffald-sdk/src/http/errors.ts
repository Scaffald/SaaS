/**
 * Base error class for all Scaffald SDK errors
 */
export class ScaffaldError extends Error {
  public readonly statusCode?: number
  public readonly response?: Response
  public readonly data?: unknown

  constructor(message: string, statusCode?: number, response?: Response, data?: unknown) {
    super(message)
    this.name = 'ScaffaldError'
    this.statusCode = statusCode
    this.response = response
    this.data = data

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScaffaldError)
    }
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends ScaffaldError {
  public readonly retryAfter: number
  public readonly limit: number
  public readonly remaining: number
  public readonly reset: number

  constructor(
    message: string,
    retryAfter: number,
    limit: number,
    remaining: number,
    reset: number,
    response?: Response
  ) {
    super(message, 429, response)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
    this.limit = limit
    this.remaining = remaining
    this.reset = reset
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends ScaffaldError {
  constructor(message: string, response?: Response, data?: unknown) {
    super(message, 401, response, data)
    this.name = 'AuthenticationError'
  }
}

/**
 * Error thrown when authorization fails (user doesn't have permission)
 */
export class AuthorizationError extends ScaffaldError {
  constructor(message: string, response?: Response, data?: unknown) {
    super(message, 403, response, data)
    this.name = 'AuthorizationError'
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends ScaffaldError {
  constructor(message: string, response?: Response, data?: unknown) {
    super(message, 404, response, data)
    this.name = 'NotFoundError'
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends ScaffaldError {
  public readonly errors?: unknown

  constructor(message: string, errors?: unknown, response?: Response) {
    super(message, 400, response, errors)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

/**
 * Error thrown when the server returns a 5xx error
 */
export class ServerError extends ScaffaldError {
  constructor(message: string, statusCode: number, response?: Response, data?: unknown) {
    super(message, statusCode, response, data)
    this.name = 'ServerError'
  }
}

/**
 * Error thrown when a network request fails
 */
export class NetworkError extends ScaffaldError {
  constructor(message: string, cause?: Error) {
    super(message, undefined, undefined, { cause })
    this.name = 'NetworkError'
  }
}

/**
 * Parse error response and throw appropriate error
 */
export async function handleErrorResponse(response: Response): Promise<never> {
  let data: unknown

  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
  } catch {
    // Ignore parsing errors
  }

  const message =
    typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message: unknown }).message)
      : typeof data === 'string'
        ? data
        : `Request failed with status ${response.status}`

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
    const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0', 10)
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10)
    const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10)

    throw new RateLimitError(message, retryAfter, limit, remaining, reset, response)
  }

  // Handle authentication errors
  if (response.status === 401) {
    throw new AuthenticationError(message, response, data)
  }

  // Handle authorization errors
  if (response.status === 403) {
    throw new AuthorizationError(message, response, data)
  }

  // Handle not found
  if (response.status === 404) {
    throw new NotFoundError(message, response, data)
  }

  // Handle validation errors
  if (response.status === 400 || response.status === 422) {
    const errors =
      typeof data === 'object' && data !== null && 'errors' in data
        ? (data as { errors: unknown }).errors
        : undefined
    throw new ValidationError(message, errors, response)
  }

  // Handle server errors
  if (response.status >= 500) {
    throw new ServerError(message, response.status, response, data)
  }

  // Generic error
  throw new ScaffaldError(message, response.status, response, data)
}
