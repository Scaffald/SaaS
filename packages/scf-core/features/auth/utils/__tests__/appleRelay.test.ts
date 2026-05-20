import { describe, expect, it } from 'vitest'
import { isAppleRelayEmail } from '../appleRelay'

describe('isAppleRelayEmail', () => {
  it('returns true for canonical Apple private relay addresses', () => {
    expect(isAppleRelayEmail('abc123@privaterelay.appleid.com')).toBe(true)
    expect(isAppleRelayEmail('long.token-string_xyz@privaterelay.appleid.com')).toBe(true)
  })

  it('is case-insensitive (Apple sometimes title-cases the host)', () => {
    expect(isAppleRelayEmail('abc@PRIVATERELAY.APPLEID.COM')).toBe(true)
    expect(isAppleRelayEmail('ABC@PrivateRelay.AppleID.com')).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    expect(isAppleRelayEmail('  abc@privaterelay.appleid.com  ')).toBe(true)
  })

  it('returns false for real-email Apple sign-ins', () => {
    expect(isAppleRelayEmail('clay@unicorn.love')).toBe(false)
    expect(isAppleRelayEmail('test+foo@gmail.com')).toBe(false)
  })

  it('returns false for empty / null / undefined inputs', () => {
    expect(isAppleRelayEmail('')).toBe(false)
    expect(isAppleRelayEmail(null)).toBe(false)
    expect(isAppleRelayEmail(undefined)).toBe(false)
  })

  it('does not match suffix-only collisions', () => {
    // No `@` separator before the relay host.
    expect(isAppleRelayEmail('fakeprivaterelay.appleid.com')).toBe(false)
    // Different host that ends in `.appleid.com`.
    expect(isAppleRelayEmail('abc@something.appleid.com')).toBe(false)
  })
})
