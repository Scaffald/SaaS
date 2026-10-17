import { describe, expect, it } from 'vitest'
import { describeLoadFailure, failureStatus } from '../load-failure'

/** Failed loads in words, not HTTP (#1165). */
describe('failureStatus', () => {
  it('reads an SDK error', () => {
    expect(failureStatus({ statusCode: 403, message: 'x' })).toBe(403)
  })

  it('reads a status named in the message, as the hooks that throw plain Errors do', () => {
    expect(failureStatus(new Error('HTTP 403 error'))).toBe(403)
  })

  it('returns null when nothing says', () => {
    expect(failureStatus(new Error('Network request failed'))).toBeNull()
    expect(failureStatus(undefined)).toBeNull()
  })
})

describe('describeLoadFailure', () => {
  it('says the same thing for 403 and 404, and offers no retry', () => {
    const forbidden = describeLoadFailure({ statusCode: 403 }, 'candidate')
    const missing = describeLoadFailure(new Error('Application not found (404)'), 'candidate')
    expect(forbidden).toEqual(missing)
    expect(forbidden.title).toBe("You can't open this candidate")
    expect(forbidden.canRetry).toBe(false)
  })

  it('never repeats the raw message', () => {
    const copy = describeLoadFailure(new Error('HTTP 403 error'), 'inquiry')
    expect(`${copy.title} ${copy.description}`).not.toMatch(/HTTP|403/)
  })

  it('offers a retry for anything else', () => {
    expect(describeLoadFailure(new Error('timeout'), 'hire').canRetry).toBe(true)
  })
})
