import { z } from 'zod'
import { parsePhoneNumber } from 'awesome-phonenumber'

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
        const pn = parsePhoneNumber(phone)
        return pn.valid
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
        const pn = parsePhoneNumber(phone)
        return pn.valid
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
    const pn = parsePhoneNumber(phone, { regionCode: countryCode })
    return pn.number?.international || phone
  } catch {
    return phone
  }
}

/**
 * Get E.164 format (unformatted) for storage
 */
export const getE164Format = (phone: string, countryCode?: string): string => {
  try {
    const pn = parsePhoneNumber(phone, { regionCode: countryCode })
    return pn.number?.e164 || phone
  } catch {
    return phone
  }
}

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string, countryCode?: string): boolean => {
  try {
    const pn = parsePhoneNumber(phone, { regionCode: countryCode })
    return pn.valid
  } catch {
    return false
  }
}

/**
 * Get phone number region code
 */
export const getPhoneRegionCode = (phone: string): string | undefined => {
  try {
    const pn = parsePhoneNumber(phone)
    return pn.regionCode
  } catch {
    return undefined
  }
}

/**
 * Get phone number type (mobile, fixed-line, etc.)
 */
export const getPhoneNumberType = (phone: string, countryCode?: string): string | undefined => {
  try {
    const pn = parsePhoneNumber(phone, { regionCode: countryCode })
    return pn.type
  } catch {
    return undefined
  }
}
