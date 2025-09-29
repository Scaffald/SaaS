import { z } from 'zod'
import { phoneNumberSchema } from '@app/ui'

/**
 * General Profile Form Schema
 * Fields: Avatar, First/Last Name, About, Phone, Email
 */
export const generalProfileSchema = z
  .object({
    // Avatar
    avatar_url: z.union([z.string().url(), z.literal('')]).optional(),

    // Name fields
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name too long')
      .optional(),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),

    // About section
    about: z.string().max(500, 'About section must be 500 characters or less').optional(),

    // Contact information
    phone: phoneNumberSchema,

    email: z.string().email('Please enter a valid email address').optional(),
  })
  .partial()

export type GeneralProfileFormData = z.infer<typeof generalProfileSchema>

export const generalProfileDefaults: Partial<GeneralProfileFormData> = {
  avatar_url: '',
  first_name: '',
  last_name: '',
  about: '',
  phone: '',
  email: '',
}
