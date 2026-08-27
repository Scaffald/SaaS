import { describe, expect, it } from 'vitest'
import {
  APIError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '@scaffald/sdk'
import { isAuthError, shouldRetry, statusCodeOf } from '../retry'

/** Stand-in for the SDK's ScaffaldError, which carries `statusCode`. */
function sdkError(statusCode: number): Error {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })
}

/**
 * The same assertions, against errors the SDK actually constructs.
 *
 * `sdkError` above is a hand-built `{ statusCode }`, which tests the
 * arithmetic and nothing else. It cannot tell you whether a REAL SDK error
 * still carries `statusCode` by the time this predicate reads it — and that
 * plumbing is the part that would break silently. #647 was filed believing a
 * 404 was being retried in the app; the predicate was right and the premise
 * was wrong, but "prove it against the real error type" was the useful half of
 * that report, so it lives here now.
 *
 * If the SDK ever renames the field, drops it from a subclass, or its build
 * output falls behind its source, these fail while the hand-built ones above
 * keep passing.
 */
describe('against errors the SDK really throws', () => {
  const cases: Array<[string, Error, number]> = [
    ['NotFoundError', new NotFoundError('nope'), 404],
    ['AuthenticationError', new AuthenticationError('nope'), 401],
    ['RateLimitError', new RateLimitError('slow down'), 429],
    ['APIError', new APIError('boom', 503, 'api_error'), 503],
  ]

  it.each(cases)('%s carries its status through statusCodeOf', (_name, err, code) => {
    expect(statusCodeOf(err)).toBe(code)
  })

  it('does not retry a real 404 — the case #647 was filed about', () => {
    expect(shouldRetry(0, new NotFoundError('Application not found'), 1)).toBe(false)
  })

  it('does not retry a real 401', () => {
    expect(shouldRetry(0, new AuthenticationError('expired'), 1)).toBe(false)
  })

  it('still retries a real 429 and 503, which are transient', () => {
    expect(shouldRetry(0, new RateLimitError('slow down'), 1)).toBe(true)
    expect(shouldRetry(0, new APIError('boom', 503, 'api_error'), 1)).toBe(true)
  })
})

describe('statusCodeOf', () => {
  it('reads statusCode off an SDK error', () => {
    expect(statusCodeOf(sdkError(404))).toBe(404)
  })

  it('returns undefined for errors that carry no status', () => {
    expect(statusCodeOf(new Error('network down'))).toBeUndefined()
    expect(statusCodeOf(null)).toBeUndefined()
    expect(statusCodeOf('nope')).toBeUndefined()
    expect(statusCodeOf({ statusCode: '401' })).toBeUndefined()
  })
})

describe('isAuthError', () => {
  it('is true only for 401', () => {
    expect(isAuthError(sdkError(401))).toBe(true)
    expect(isAuthError(sdkError(403))).toBe(false)
    expect(isAuthError(new Error('network down'))).toBe(false)
  })
})

describe('shouldRetry', () => {
  // The regression this policy exists for: three attempts against the same
  // stale token, all inside ~3s, leaving nothing to retry with once the
  // refresh landed (#579).
  it('never retries a 401', () => {
    expect(shouldRetry(0, sdkError(401), 2)).toBe(false)
  })

  it.each([400, 403, 404, 409, 422])('never retries %i', (status) => {
    expect(shouldRetry(0, sdkError(status), 2)).toBe(false)
  })

  it('retries 5xx up to the limit', () => {
    expect(shouldRetry(0, sdkError(500), 2)).toBe(true)
    expect(shouldRetry(1, sdkError(500), 2)).toBe(true)
    expect(shouldRetry(2, sdkError(500), 2)).toBe(false)
  })

  it('retries 429, which is transient by definition', () => {
    expect(shouldRetry(0, sdkError(429), 2)).toBe(true)
  })

  it('retries statusless errors — a dropped connection is worth another go', () => {
    expect(shouldRetry(0, new Error('network down'), 2)).toBe(true)
    expect(shouldRetry(2, new Error('network down'), 2)).toBe(false)
  })

  it('honours a mutation-sized budget of one', () => {
    expect(shouldRetry(0, sdkError(503), 1)).toBe(true)
    expect(shouldRetry(1, sdkError(503), 1)).toBe(false)
  })
})
