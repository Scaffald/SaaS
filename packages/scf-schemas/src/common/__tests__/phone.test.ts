import { describe, expect, it } from 'vitest';

import {
  formatPhoneNumber,
  getE164Format,
  getPhoneNumberType,
  getPhoneRegionCode,
  isValidPhoneNumber,
  phoneNumberSchema,
  requiredPhoneNumberSchema,
} from '../phone';

describe('phone schemas', () => {
  it('accepts undefined optional phone numbers', () => {
    const result = phoneNumberSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it('rejects invalid phone numbers with a helpful error', () => {
    const result = phoneNumberSchema.safeParse('123-not-valid')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Please enter a valid phone number')
    }
  })

  it('requires a value for required phone schema', () => {
    const result = requiredPhoneNumberSchema.safeParse('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Phone number is required')
    }
  })

  it('formats US phone numbers in international form', () => {
    const formatted = formatPhoneNumber('+14155552671')
    expect(formatted).toBe('+1 (415) 555-2671')
  })

  it('converts phone numbers to E.164 for storage', () => {
    expect(getE164Format('(415) 555-2671', 'US')).toBe('+14155552671')
  })

  it('classifies valid phone numbers with region metadata', () => {
    expect(isValidPhoneNumber('+14155552671')).toBe(true)
    expect(getPhoneRegionCode('+14155552671')).toBe('US')
    expect(getPhoneNumberType('+14155552671')).toBe('fixed-line-or-mobile')
  })

  it('flags invalid phone numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false)
    expect(isValidPhoneNumber('+000000')).toBe(false)
  })
})
