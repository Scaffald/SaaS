import { z } from 'zod'

import { jsonSchema } from './json.ts'
import { teamInvitationPolicySchema, teamRoleKeySchema, teamVisibilitySchema } from './constants.ts'

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

const teamMetadataSchema = jsonSchema
  .default({})
  .refine(
    (value) => typeof value === 'object' && value !== null,
    'Team metadata must resolve to an object'
  )

const teamImageUrlSchema = z.string().url('Image must be a valid URL').max(2048)

export const teamCreateBaseSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  name: teamNameSchema,
  slug: teamSlugSchema.optional(),
  purpose: teamPurposeSchema,
  visibility: teamVisibilitySchema.default('organization'),
  invitationPolicy: teamInvitationPolicySchema.default('invite_only'),
  description: jsonSchema.optional(),
  imageUrl: teamImageUrlSchema.optional(),
  metadata: teamMetadataSchema,
  defaultRoleId: z.string().uuid('Default role ID must be a valid UUID').optional(),
  defaultRoleKey: teamRoleKeySchema.default('member'),
})

export const teamCreateSchema = teamCreateBaseSchema.refine(
  (input) => Boolean(input.defaultRoleId ?? input.defaultRoleKey),
  'A default role must be provided for the team'
)

const teamUpdateBodySchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID').optional(),
  name: teamNameSchema.optional(),
  slug: teamSlugSchema.optional(),
  purpose: z.union([teamPurposeValueSchema, z.null()]).optional(),
  visibility: teamVisibilitySchema.optional(),
  invitationPolicy: teamInvitationPolicySchema.optional(),
  description: jsonSchema.optional(),
  imageUrl: z.union([teamImageUrlSchema, z.null()]).optional(),
  metadata: teamMetadataSchema.optional(),
  defaultRoleId: z.string().uuid().optional(),
  defaultRoleKey: teamRoleKeySchema.optional(),
  archivedAt: z.union([z.string().datetime(), z.null()]).optional(),
  archivedBy: z.union([z.string().uuid(), z.null()]).optional(),
  isArchived: z.boolean().optional(),
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
      input.invitationPolicy !== undefined ||
      input.description !== undefined ||
      input.imageUrl !== undefined ||
      input.metadata !== undefined ||
      input.defaultRoleId !== undefined ||
      input.defaultRoleKey !== undefined ||
      input.archivedAt !== undefined ||
      input.archivedBy !== undefined ||
      input.isArchived !== undefined,
    'At least one field must be provided to update a team'
  )

export const teamArchiveSchema = z.object({
  teamId: teamIdSchema,
  reason: z.string().max(280, 'Archive reason must be 280 characters or fewer').optional(),
  archivedBy: z.string().uuid().optional(),
})

export type TeamCreateInput = z.infer<typeof teamCreateSchema>
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>
export type TeamArchiveInput = z.infer<typeof teamArchiveSchema>
