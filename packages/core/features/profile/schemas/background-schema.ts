import { z } from 'zod'
import { formFields } from '@app/core/utils/SchemaForm'
import { DRIVER_LICENSE_OPTIONS, EDUCATION_OPTIONS } from '../../onboarding/data'

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9]+$/.test(value), `${label} must be a whole number`)

export const BackgroundSchema = z.object({
  openToTravel: z.boolean().describe('Open to Travel // I am willing to travel for work'),

  travelMileage: numericString('Travel mileage')
    .optional()
    .describe('Travel Radius (miles) // How far are you willing to travel?'),

  driversLicenseClass: z
    .enum(DRIVER_LICENSE_OPTIONS.map((option) => option.value) as [string, ...string[]])
    .optional()
    .describe("Driver's License Class // Select your license class"),

  certifications: formFields.text
    .optional()
    .describe('Certifications // List your certifications (one per line)'),

  educationLevel: z
    .enum(EDUCATION_OPTIONS.map((option) => option.value) as [string, ...string[]])
    .optional()
    .describe('Education Level // Select your highest education level'),
})

export type BackgroundFormValues = z.infer<typeof BackgroundSchema>
