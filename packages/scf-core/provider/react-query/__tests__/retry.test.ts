import { describe, expect, it } from 'vitest'
import { isAuthError, shouldRetry, statusCodeOf } from '../retry'

/** Stand-in for the SDK's ScaffaldError, which carries `statusCode`. */
function sdkError(statusCode: number): Error {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })
}

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
