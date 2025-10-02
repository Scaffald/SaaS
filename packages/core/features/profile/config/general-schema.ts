import { z } from 'zod'
import { phoneNumberSchema } from '@app/ui'

/**
 * General Profile Form Schema
 * Fields: Avatar, First/Last Name, About, Phone, Email, Home Address
 */
export const generalProfileSchema = z.object({
  // Avatar - optional (can be full URL or path)
  avatar_path: z.union([z.string().url(), z.string().min(1), z.literal('')]).optional(),

  // Name fields - required (as shown with asterisks in UI)
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),

  // About section - optional
  about: z.string().max(500, 'About section must be 500 characters or less').optional(),

  // Contact information - optional
  phone: phoneNumberSchema.optional(),

  // Email - optional (read-only, managed by auth system)
  email: z.string().email('Please enter a valid email address').optional(),

  // Home Address
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
})

export type GeneralProfileFormData = z.infer<typeof generalProfileSchema>

export const generalProfileDefaults: GeneralProfileFormData = {
  avatar_path: '',
  first_name: '',
  last_name: '',
  about: '',
  phone: '',
  email: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    latitude: undefined,
    longitude: undefined,
  },
}
