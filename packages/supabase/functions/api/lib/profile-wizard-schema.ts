/**
 * Profile wizard schemas and constants for the REST API.
 * Kept in sync with packages/scf-trpc/src/schemas/consolidated.ts (PROFILE_WIZARD_*).
 * Local copy avoids cross-package import map resolution in the edge runtime.
 */

import { z } from 'zod'

// =============================================================================
// PROFILE WIZARD SCHEMAS & CONSTANTS
// =============================================================================

export const PROFILE_WIZARD_STEPS = [
  'general',
  'skills',
  'experience',
  'certifications',
  'preferences',
  'education',
] as const

export type ProfileWizardStepId = (typeof PROFILE_WIZARD_STEPS)[number]

export const PROFILE_WIZARD_OPTIONAL_STEPS: ProfileWizardStepId[] = [
  'certifications',
  'education',
]

export const PROFILE_WIZARD_REQUIRED_STEPS = PROFILE_WIZARD_STEPS.filter(
  (step) => !PROFILE_WIZARD_OPTIONAL_STEPS.includes(step)
) as ProfileWizardStepId[]

export const PROFILE_WIZARD_STEP_WEIGHTS: Record<ProfileWizardStepId, number> = {
  general: 20,
  skills: 20,
  experience: 20,
  certifications: 10,
  preferences: 15,
  education: 15,
}

export const profileWizardStepSchema = z.enum(PROFILE_WIZARD_STEPS)

const generalStepSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    headline: z.string().optional(),
    bio: z.string().nullable().optional(),
  })
  .strip()

const skillsStepSchema = z
  .object({
    skills: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          taxonomy: z.enum(['csi', 'onet']).optional(),
          proficiency: z.number().int().min(1).max(5).optional(),
        })
      )
      .optional(),
  })
  .strip()

const experienceStepSchema = z
  .object({
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().optional(),
    summary: z.string().nullable().optional(),
  })
  .strip()

const certificationEntrySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().optional(),
    issuer: z.string().optional(),
    issuedOn: z.string().nullable().optional(),
    expiresOn: z.string().nullable().optional(),
  })
  .strip()

const certificationsStepSchema = z
  .object({
    certifications: z.array(certificationEntrySchema).optional(),
  })
  .strip()

const preferencesStepSchema = z
  .object({
    locationPreference: z.string().nullable().optional(),
    hourlyRate: z.string().nullable().optional(),
    availability: z.string().nullable().optional(),
    remotePreference: z.enum(['remote', 'hybrid', 'onsite']).nullable().optional(),
  })
  .strip()

const educationStepSchema = z
  .object({
    degreeType: z.string().optional(),
    institutionName: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().optional(),
  })
  .strip()

const profileWizardStepSchemas = {
  general: generalStepSchema,
  skills: skillsStepSchema,
  experience: experienceStepSchema,
  certifications: certificationsStepSchema,
  preferences: preferencesStepSchema,
  education: educationStepSchema,
} as const

export type ProfileWizardStepData = {
  [Step in ProfileWizardStepId]?: z.infer<(typeof profileWizardStepSchemas)[Step]>
}

const profileWizardStepDataSchema = z
  .object({
    general: generalStepSchema.optional(),
    skills: skillsStepSchema.optional(),
    experience: experienceStepSchema.optional(),
    certifications: certificationsStepSchema.optional(),
    preferences: preferencesStepSchema.optional(),
    education: educationStepSchema.optional(),
  })
  .partial()
  .strip()

export const profileWizardSaveStepInputSchema = z.discriminatedUnion('step', [
  z.object({
    step: z.literal('general'),
    data: generalStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal('skills'),
    data: skillsStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal('experience'),
    data: experienceStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal('certifications'),
    data: certificationsStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal('preferences'),
    data: preferencesStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal('education'),
    data: educationStepSchema,
    skip: z.boolean().optional(),
  }),
])

export const profileWizardProgressSchema = z
  .object({
    currentStep: profileWizardStepSchema,
    completedSteps: z.array(profileWizardStepSchema),
    completionPercentage: z.number().min(0).max(100),
    lastSavedAt: z.string().datetime().nullable(),
    requiredSteps: z.array(profileWizardStepSchema),
    completedAt: z.string().datetime().nullable().optional(),
    stepData: profileWizardStepDataSchema.default({}),
  })
  .strip()

export type ProfileWizardProgress = z.infer<typeof profileWizardProgressSchema>
export type ProfileWizardSaveStepInput = z.infer<typeof profileWizardSaveStepInputSchema>

export const profileWizardDefaultProgress: ProfileWizardProgress = {
  currentStep: PROFILE_WIZARD_STEPS[0],
  completedSteps: [],
  completionPercentage: 0,
  lastSavedAt: null,
  requiredSteps: PROFILE_WIZARD_REQUIRED_STEPS,
  completedAt: null,
  stepData: {},
}
