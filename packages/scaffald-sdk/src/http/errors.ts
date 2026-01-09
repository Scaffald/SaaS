/**
 * SDK Error Types
 */

export class ScaffaldError extends Error {
  public readonly statusCode?: number
  public readonly code?: string
  public readonly requestId?: string

  constructor(message: string, statusCode?: number, code?: string, requestId?: string) {
    super(message)
    this.name = 'ScaffaldError'
    this.statusCode = statusCode
    this.code = code
    this.requestId = requestId

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScaffaldError)
    }
  }
}

export class AuthenticationError extends ScaffaldError {
  constructor(message: string, requestId?: string) {
    super(message, 401, 'authentication_error', requestId)
    this.name = 'AuthenticationError'
  }
}

export class PermissionError extends ScaffaldError {
  constructor(message: string, requestId?: string) {
    super(message, 403, 'permission_error', requestId)
    this.name = 'PermissionError'
  }
}

export class NotFoundError extends ScaffaldError {
  constructor(message: string, requestId?: string) {
    super(message, 404, 'not_found', requestId)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ScaffaldError {
  public readonly errors?: Record<string, string[]>

  constructor(message: string, errors?: Record<string, string[]>, requestId?: string) {
    super(message, 422, 'validation_error', requestId)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class RateLimitError extends ScaffaldError {
  public readonly retryAfter?: number

  constructor(message: string, retryAfter?: number, requestId?: string) {
    super(message, 429, 'rate_limit_error', requestId)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

export class APIError extends ScaffaldError {
  constructor(message: string, statusCode: number, code: string, requestId?: string) {
    super(message, statusCode, code, requestId)
    this.name = 'APIError'
  }
}

export function createErrorFromResponse(
  statusCode: number,
  body: any,
  requestId?: string
): ScaffaldError {
  const message = body?.error?.message || body?.message || 'HTTP ' + statusCode + ' error'
  const code = body?.error?.code || body?.code

  switch (statusCode) {
    case 401:
      return new AuthenticationError(message, requestId)
    case 403:
      return new PermissionError(message, requestId)
    case 404:
      return new NotFoundError(message, requestId)
    case 422:
      return new ValidationError(message, body?.error?.errors || body?.errors, requestId)
    case 429:
      return new RateLimitError(message, body?.retry_after, requestId)
    default:
      return new APIError(message, statusCode, code || 'api_error', requestId)
  }
}
