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
      // Basic phone validation - accepts various formats
      // E.164 format, national formats, etc.
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
      return phoneRegex.test(phone)
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
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
      return phoneRegex.test(phone)
    },
    {
      message: 'Please enter a valid phone number',
    }
  )
