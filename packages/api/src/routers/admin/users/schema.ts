import { z } from 'zod'

export const verificationStatuses = [
  'verified',
  'revoked',
  'pending',
  'unverified',
  'unknown',
] as const

export const verificationSubjectTypes = ['profile', 'user', 'user_private'] as const

export type VerificationStatus = (typeof verificationStatuses)[number]

export type VerificationSubjectType = (typeof verificationSubjectTypes)[number]

export const baseAdminContextSchema = z.object({
  organizationId: z.string().uuid().optional(),
})

export const searchWorkersInputSchema = baseAdminContextSchema.extend({
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

export const workerIdentifierSchema = baseAdminContextSchema.extend({
  workerId: z.string().uuid(),
})

export const workerPublicUpdateSchema = z
  .object({
    displayName: z.string().trim().max(120).nullable().optional(),
    username: z.string().trim().max(60).nullable().optional(),
    slug: z.string().trim().max(120).nullable().optional(),
    headline: z.string().trim().max(280).nullable().optional(),
    bio: z.string().nullable().optional(),
    industryId: z.string().uuid().nullable().optional(),
    openToWork: z.boolean().nullable().optional(),
    yearsOfExperience: z.number().int().min(0).max(100).nullable().optional(),
    skillsSummary: z.unknown().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    avatarMediaId: z.string().uuid().nullable().optional(),
  })
  .strict()

export const workerPrivateUpdateSchema = z
  .object({
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().max(60).nullable().optional(),
    address: z.record(z.unknown()).nullable().optional(),
    location: z.string().trim().max(160).nullable().optional(),
    openToTravel: z.boolean().nullable().optional(),
    travelMileage: z.number().int().min(0).max(10000).nullable().optional(),
    usResident: z.boolean().nullable().optional(),
    usPassport: z.boolean().nullable().optional(),
    veteran: z.boolean().nullable().optional(),
    educationLevel: z.string().trim().max(160).nullable().optional(),
    hourlyRateCents: z.number().int().min(0).nullable().optional(),
    contactPrefs: z.array(z.string().trim().max(120)).nullable().optional(),
    availability: z.array(z.string().trim().max(120)).nullable().optional(),
    certifications: z.array(z.string().trim().max(160)).nullable().optional(),
    phoneOs: z.string().trim().max(32).nullable().optional(),
    driversLicenseClass: z.string().trim().max(64).nullable().optional(),
  })
  .strict()

export const workerProfileUpdateSchema = z
  .object({
    name: z.string().trim().max(120).nullable().optional(),
    about: z.string().nullable().optional(),
    avatarUrl: z.string().url().trim().max(512).nullable().optional(),
    publicData: workerPublicUpdateSchema.optional(),
    privateData: workerPrivateUpdateSchema.optional(),
  })
  .strict()
  .refine(
    (value) => {
      if (value.publicData || value.privateData) {
        return true
      }

      return value.name !== undefined || value.about !== undefined || value.avatarUrl !== undefined
    },
    {
      message:
        'At least one of name, about, avatarUrl, publicData, or privateData must be provided',
      path: ['publicData'],
    }
  )

export const updateWorkerInputSchema = workerIdentifierSchema
  .extend({
    profileData: workerProfileUpdateSchema.optional(),
    publicData: workerPublicUpdateSchema.optional(),
    privateData: workerPrivateUpdateSchema.optional(),
  })
  .refine(
    (value) => {
      if (value.publicData || value.privateData) {
        return true
      }

      const profile = value.profileData
      if (!profile) {
        return false
      }

      return Boolean(
        profile.publicData ||
          profile.privateData ||
          profile.name !== undefined ||
          profile.about !== undefined ||
          profile.avatarUrl !== undefined
      )
    },
    {
      message: 'At least one of profileData, publicData, or privateData must be provided',
      path: ['profileData'],
    }
  )

export const verificationFieldSchema = z.string().trim().min(1).max(160)

export const verificationSubjectSchema = z.enum(verificationSubjectTypes)

export const verifyWorkerInputSchema = workerIdentifierSchema.extend({
  reason: z.string().trim().max(280).optional(),
  field: verificationFieldSchema,
  subjectType: verificationSubjectSchema,
})

export type WorkerPublicUpdateInput = z.infer<typeof workerPublicUpdateSchema>

export type WorkerPrivateUpdateInput = z.infer<typeof workerPrivateUpdateSchema>

export type WorkerProfileUpdateInput = z.infer<typeof workerProfileUpdateSchema>
