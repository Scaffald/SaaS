import { parsePhoneNumber } from 'awesome-phonenumber'
import { z } from 'zod'

const PHONE_INVALID_MESSAGE = 'Please enter a valid phone number'

const validatePhoneNumber = (phone: string | undefined, countryCode?: string): boolean => {
  if (!phone) {
    return true
  }

  try {
    const parsed = parsePhoneNumber(phone, countryCode ? { regionCode: countryCode } : undefined)
    return parsed.valid
  } catch {
    return false
  }
}

/**
 * Format phone number for display using the international format.
 * US numbers are formatted as +1 (234) 567-8900
 */
export const formatPhoneNumber = (phone: string, countryCode?: string): string => {
  try {
    const parsed = parsePhoneNumber(phone, countryCode ? { regionCode: countryCode } : undefined)
    if (parsed.regionCode === 'US' && parsed.number?.national) {
      // Format US numbers as +1 (234) 567-8900
      const national = parsed.number.national
      if (national.length === 10) {
        const area = national.slice(0, 3)
        const exchange = national.slice(3, 6)
        const line = national.slice(6)
        return `+1 (${area}) ${exchange}-${line}`
      }
      // Fallback for non-standard US numbers
      return `+1 ${national}`
    }
    return parsed.number?.international ?? phone
  } catch {
    return phone
  }
}

/**
 * Convert a phone number into the E.164 format for storage.
 */
export const getE164Format = (phone: string, countryCode?: string): string => {
  try {
    const parsed = parsePhoneNumber(phone, countryCode ? { regionCode: countryCode } : undefined)
    return parsed.number?.e164 ?? phone
  } catch {
    return phone
  }
}

/**
 * Determine whether a phone number is valid for a specific region.
 */
export const isValidPhoneNumber = (phone: string, countryCode?: string): boolean => {
  if (!phone) {
    return false
  }

  return validatePhoneNumber(phone, countryCode)
}

/**
 * Extract the detected region code (ISO 3166 alpha-2) from a phone number.
 */
export const getPhoneRegionCode = (phone: string): string | undefined => {
  try {
    const parsed = parsePhoneNumber(phone)
    return parsed.regionCode ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Determine the number type (mobile, fixed-line, etc.).
 */
export const getPhoneNumberType = (phone: string, countryCode?: string): string | undefined => {
  try {
    const parsed = parsePhoneNumber(phone, countryCode ? { regionCode: countryCode } : undefined)
    return parsed.type ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Phone number validation schema (Zod)
 * Accepts various phone number formats including E.164, national formats, etc.
 * This is optional by default - use requiredPhoneNumberSchema for required fields
 */
export const phoneNumberSchema = z
  .string()
  .optional()
  .refine((phone) => validatePhoneNumber(phone), {
    message: PHONE_INVALID_MESSAGE,
  })

/**
 * Required phone number validation schema (Zod)
 */
export const requiredPhoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine((phone) => validatePhoneNumber(phone), {
    message: PHONE_INVALID_MESSAGE,
  })
