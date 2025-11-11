import { z } from 'zod'

import { jsonSchema } from './json'
import {
  TEAM_INVITATION_TTL_DEFAULT,
  TEAM_INVITATION_TTL_MAX,
  TEAM_INVITATION_TTL_MIN,
  teamRoleKeySchema,
  teamVisibilitySchema,
} from './constants'

export const teamIdSchema = z.string().uuid('Team ID must be a valid UUID')

const teamSlugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be 50 characters or fewer')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug may only contain letters, numbers, and hyphens')

const teamNameSchema = z
  .string()
  .min(2, 'Team name must be at least 2 characters')
  .max(80, 'Team name must be 80 characters or fewer')

const teamPurposeValueSchema = z.string().max(160, 'Purpose must be 160 characters or fewer')
const teamPurposeSchema = teamPurposeValueSchema.optional()

const teamSettingsSchema = jsonSchema
  .default({})
  .refine(
    (value) => typeof value === 'object' && value !== null,
    'Team settings must resolve to an object'
  )

const teamImageUrlSchema = z.string().url('Image must be a valid URL').max(2048)

const invitationExpirationDaysSchema = z
  .number({ invalid_type_error: 'Invitation expiration must be a number' })
  .int('Invitation expiration must be a whole number of days')
  .min(
    TEAM_INVITATION_TTL_MIN,
    `Invitation expiration must be at least ${TEAM_INVITATION_TTL_MIN} day(s)`
  )
  .max(
    TEAM_INVITATION_TTL_MAX,
    `Invitation expiration cannot exceed ${TEAM_INVITATION_TTL_MAX} days`
  )

const teamCreateBodySchema = z
  .object({
    organizationId: z.string().uuid('Organization ID must be a valid UUID'),
    name: teamNameSchema,
    slug: teamSlugSchema.optional(),
    purpose: teamPurposeSchema,
    visibility: teamVisibilitySchema.default('organization'),
    description: jsonSchema.optional(),
    imageUrl: teamImageUrlSchema.optional(),
    settings: teamSettingsSchema,
    parentTeamId: teamIdSchema.optional(),
    invitationExpirationDays: invitationExpirationDaysSchema.default(TEAM_INVITATION_TTL_DEFAULT),
    allowSelfJoin: z.boolean().default(false),
    autoAssignJobs: z.boolean().default(false),
    defaultRoleId: z.string().uuid().optional(),
    defaultRoleKey: teamRoleKeySchema.optional().default('member'),
  })
  .refine(
    (input) => Boolean(input.defaultRoleId ?? input.defaultRoleKey),
    'A default role must be provided for the team'
  )

export const teamCreateSchema = teamCreateBodySchema

const teamUpdateBodySchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID').optional(),
  name: teamNameSchema.optional(),
  slug: teamSlugSchema.optional(),
  purpose: z.union([teamPurposeValueSchema, z.null()]).optional(),
  visibility: teamVisibilitySchema.optional(),
  description: jsonSchema.optional(),
  imageUrl: z.union([teamImageUrlSchema, z.null()]).optional(),
  settings: teamSettingsSchema.optional(),
  parentTeamId: z.union([teamIdSchema, z.null()]).optional(),
  invitationExpirationDays: invitationExpirationDaysSchema.optional(),
  allowSelfJoin: z.boolean().optional(),
  autoAssignJobs: z.boolean().optional(),
  defaultRoleId: z.string().uuid().optional(),
  defaultRoleKey: teamRoleKeySchema.optional(),
})

export const teamUpdateSchema = z
  .object({
    teamId: teamIdSchema,
  })
  .merge(teamUpdateBodySchema)
  .refine(
    (input) =>
      input.organizationId !== undefined ||
      input.name !== undefined ||
      input.slug !== undefined ||
      input.purpose !== undefined ||
      input.visibility !== undefined ||
      input.description !== undefined ||
      input.imageUrl !== undefined ||
      input.settings !== undefined ||
      input.parentTeamId !== undefined ||
      input.invitationExpirationDays !== undefined ||
      input.allowSelfJoin !== undefined ||
      input.autoAssignJobs !== undefined ||
      input.defaultRoleId !== undefined ||
      input.defaultRoleKey !== undefined,
    'At least one field must be provided to update a team'
  )

export const teamArchiveSchema = z.object({
  teamId: teamIdSchema,
  reason: z.string().max(280, 'Archive reason must be 280 characters or fewer').optional(),
})

export type TeamCreateInput = z.infer<typeof teamCreateSchema>
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>
export type TeamArchiveInput = z.infer<typeof teamArchiveSchema>
