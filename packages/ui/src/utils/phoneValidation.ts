import { z } from 'zod'
import PhoneNumber from 'awesome-phonenumber'

/**
 * Zod schema for phone number validation
 * Validates using awesome-phonenumber library
 */
export const phoneNumberSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone) return true // Optional field
      try {
        const pn = new PhoneNumber(phone)
        return pn.isValid()
      } catch {
        return false
      }
    },
    {
      message: 'Please enter a valid phone number',
    }
  )

/**
 * Zod schema for required phone number validation
 */
export const requiredPhoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (phone) => {
      try {
        const pn = new PhoneNumber(phone)
        return pn.isValid()
      } catch {
        return false
      }
    },
    {
      message: 'Please enter a valid phone number',
    }
  )

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string, countryCode?: string): string => {
  try {
    const pn = new PhoneNumber(phone, countryCode)
    return pn.getNumber('international')
  } catch {
    return phone
  }
}

/**
 * Get E.164 format (unformatted) for storage
 */
export const getE164Format = (phone: string, countryCode?: string): string => {
  try {
    const pn = new PhoneNumber(phone, countryCode)
    return pn.getNumber('e164')
  } catch {
    return phone
  }
}

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string, countryCode?: string): boolean => {
  try {
    const pn = new PhoneNumber(phone, countryCode)
    return pn.isValid()
  } catch {
    return false
  }
}

/**
 * Get phone number region code
 */
export const getPhoneRegionCode = (phone: string): string | undefined => {
  try {
    const pn = new PhoneNumber(phone)
    return pn.getRegionCode()
  } catch {
    return undefined
  }
}

/**
 * Get phone number type (mobile, fixed-line, etc.)
 */
export const getPhoneNumberType = (phone: string, countryCode?: string): string | undefined => {
  try {
    const pn = new PhoneNumber(phone, countryCode)
    return pn.getType()
  } catch {
    return undefined
  }
}
