import { z } from 'zod'
import { formFields } from '@app/core/utils/SchemaForm'
import { CONTACT_METHODS, PHONE_OS_OPTIONS, AVAILABILITY_OPTIONS } from '../../onboarding/data'

const currencyString = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), 'Enter a valid rate')

export const ContactAvailabilitySchema = z.object({
  contactMethods: z
    .array(z.string())
    .min(1, 'At least one contact method is required')
    .describe('Preferred Contact Methods // How should employers reach you?'),

  phoneOs: z
    .enum(PHONE_OS_OPTIONS.map((option) => option.value) as [string, ...string[]])
    .optional()
    .describe('Phone Operating System // Select your phone OS'),

  availability: z.array(z.string()).describe('Availability // When are you available to work?'),

  hourlyRate: currencyString.optional().describe('Desired Hourly Rate // e.g. 32.50'),
})

export type ContactAvailabilityFormValues = z.infer<typeof ContactAvailabilitySchema>
