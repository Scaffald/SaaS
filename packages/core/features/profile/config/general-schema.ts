import { z } from 'zod'

/**
 * General Profile Form Schema
 * Fields: Avatar, First/Last Name, About, Phone, Email
 */
export const generalProfileSchema = z.object({
  // Avatar
  avatar_url: z.string().url().optional().or(z.literal('')),

  // Name fields
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),

  // About section
  about: z.string().max(500, 'About section must be 500 characters or less').optional(),

  // Contact information
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),

  email: z.string().email('Please enter a valid email address'),
})

export type GeneralProfileFormData = z.infer<typeof generalProfileSchema>

export const generalProfileDefaults: Partial<GeneralProfileFormData> = {
  avatar_url: '',
  first_name: '',
  last_name: '',
  about: '',
  phone: '',
  email: '',
}
