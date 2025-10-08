import { z } from 'zod'

/**
 * Phone number validation schema
 * Accepts various phone number formats including E.164, national formats, etc.
 * This is optional by default - use requiredPhoneNumberSchema for required fields
 */
export const phoneNumberSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone) return true // Optional field
      // Remove all formatting characters for validation
      const digitsOnly = phone.replace(/[^\d]/g, '')
      // Must have at least 10 digits (for US/international numbers)
      // and no more than 15 digits (E.164 standard max)
      return digitsOnly.length >= 10 && digitsOnly.length <= 15
    },
    {
      message: 'Please enter a valid phone number',
    }
  )

/**
 * Required phone number validation schema
 */
export const requiredPhoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (phone) => {
      // Remove all formatting characters for validation
      const digitsOnly = phone.replace(/[^\d]/g, '')
      // Must have at least 10 digits (for US/international numbers)
      // and no more than 15 digits (E.164 standard max)
      return digitsOnly.length >= 10 && digitsOnly.length <= 15
    },
    {
      message: 'Please enter a valid phone number',
    }
  )
