import { z } from 'zod'

import { jsonSchema } from './json.ts'
import {
  teamInvitationActionSchema,
  teamInvitationStatusSchema,
  teamRoleKeySchema,
} from './constants.ts'
import { teamIdSchema } from './team.schema.ts'

export const teamInvitationIdSchema = z.string().uuid('Invitation ID must be a valid UUID')

export const teamInvitationCreateSchema = z
  .object({
    teamId: teamIdSchema,
    organizationId: z.string().uuid('Organization ID must be a valid UUID').optional(),
    email: z.string().email('Invitation email must be valid').optional(),
    userId: z.string().uuid('Invitee user ID must be a valid UUID').optional(),
    roleId: z.string().uuid().optional(),
    roleKey: teamRoleKeySchema.optional(),
    expiresAt: z.string().datetime().optional(),
    message: z.string().max(500).optional(),
    metadata: jsonSchema.optional(),
  })
  .refine(
    (value) => value.roleId !== undefined || value.roleKey !== undefined,
    'A role must be provided when creating an invitation'
  )
  .refine(
    (value) => value.email !== undefined || value.userId !== undefined,
    'Provide an email or user ID when creating an invitation'
  )

export const teamInvitationResendSchema = z.object({
  invitationId: teamInvitationIdSchema,
  teamId: teamIdSchema,
})

export const teamInvitationCancelSchema = z.object({
  invitationId: teamInvitationIdSchema,
  teamId: teamIdSchema,
  reason: z.string().max(280).optional(),
})

export const teamInvitationRespondSchema = z.object({
  token: z.string().min(16, 'Invitation token appears to be invalid'),
  action: teamInvitationActionSchema,
  responderId: z.string().uuid().optional(),
  responseMetadata: jsonSchema.optional(),
})

export const teamInvitationStatusFilterSchema = teamInvitationStatusSchema.optional()

export type TeamInvitationCreateInput = z.infer<typeof teamInvitationCreateSchema>
export type TeamInvitationRespondInput = z.infer<typeof teamInvitationRespondSchema>
export type TeamInvitationCancelInput = z.infer<typeof teamInvitationCancelSchema>
