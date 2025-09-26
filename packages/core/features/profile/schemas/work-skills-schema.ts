import { z } from 'zod'
import { formFields } from '@app/core/utils/SchemaForm'

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9]+$/.test(value), `${label} must be a whole number`)

export const WorkSkillsSchema = z.object({
  yearsExperience: numericString('Years of experience').describe('Years of Experience // e.g. 5'),

  headline: formFields.text
    .max(120, 'Headline must be shorter than 120 characters')
    .describe('Professional Headline // e.g. Senior Electrical Foreman'),

  jobTitle: formFields.text
    .max(100, 'Job title must be shorter than 100 characters')
    .describe('Current/Desired Job Title // e.g. Electrical Foreman'),

  primarySkills: z
    .array(z.string())
    .min(1, 'At least one skill is required')
    .describe('Primary Skills // Select your main skills'),

  industryId: formFields.text
    .min(1, 'Industry is required')
    .describe('Industry // Select your industry'),

  bio: formFields.text
    .max(600, 'Bio must be shorter than 600 characters')
    .optional()
    .describe('Professional Bio // Tell us about your experience and expertise'),
})

export type WorkSkillsFormValues = z.infer<typeof WorkSkillsSchema>
