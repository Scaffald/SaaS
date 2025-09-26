import { z } from 'zod'
import { formFields } from '@app/core/utils/SchemaForm'

export const BasicInfoSchema = z.object({
  firstName: formFields.text
    .min(1, 'First name is required')
    .describe('First Name // Your first name'),

  lastName: formFields.text.min(1, 'Last name is required').describe('Last Name // Your last name'),

  phone: formFields.text
    .max(32)
    .optional()
    .refine((value) => !value || /^[0-9+()\-\s]+$/.test(value), 'Enter a valid phone number')
    .describe('Phone Number // (555) 123-4567'),

  location: formFields.text
    .min(1, 'Location is required')
    .max(120, 'Location must be shorter than 120 characters')
    .describe('Location // City, State'),

  usResident: z.boolean().describe('US Resident // I am a US resident'),

  usPassport: z.boolean().describe('US Passport // I have a valid US passport'),

  veteran: z.boolean().describe('Veteran Status // I am a veteran'),
})

export type BasicInfoFormValues = z.infer<typeof BasicInfoSchema>
