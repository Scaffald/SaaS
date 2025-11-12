import { z } from 'zod'

import { jsonSchema } from './json.ts'
import { teamIdSchema } from './team.schema.ts'
import {
  teamInvitationStatusSchema,
  teamMemberStatusSchema,
  teamRoleKeySchema,
} from './constants.ts'

export const teamMemberIdSchema = z.string().uuid('Team member ID must be a valid UUID')

export const teamMemberAddSchema = z.object({
  teamId: teamIdSchema,
  userId: z.string().uuid('User ID must be a valid UUID'),
  roleId: z.string().uuid().optional(),
  roleKey: teamRoleKeySchema.optional(),
  addedBy: z.string().uuid().optional(),
  status: teamMemberStatusSchema.optional(),
  metadata: jsonSchema.optional(),
})

export const teamMemberUpdateSchema = z
  .object({
    teamMemberId: teamMemberIdSchema,
    teamId: teamIdSchema.optional(),
    roleId: z.string().uuid().optional(),
    roleKey: teamRoleKeySchema.optional(),
    status: teamMemberStatusSchema.optional(),
    joinedAt: z.union([z.string().datetime(), z.null()]).optional(),
    removedAt: z.union([z.string().datetime(), z.null()]).optional(),
    notes: z.string().max(500).optional(),
    metadata: jsonSchema.optional(),
  })
  .refine(
    (value) =>
      value.roleId !== undefined ||
      value.roleKey !== undefined ||
      value.status !== undefined ||
      value.joinedAt !== undefined ||
      value.removedAt !== undefined ||
      value.notes !== undefined ||
      value.metadata !== undefined,
    'Provide at least one change when modifying a team member'
  )

export const teamMemberRemoveSchema = z.object({
  teamMemberId: teamMemberIdSchema,
  teamId: teamIdSchema,
  reason: z.string().max(280).optional(),
})

export const teamMemberStatusChangeSchema = z.object({
  teamMemberId: teamMemberIdSchema,
  status: teamMemberStatusSchema,
})

export const teamBulkMemberStatusSchema = z.object({
  teamId: teamIdSchema,
  memberIds: z.array(teamMemberIdSchema).min(1, 'Select at least one team member'),
  status: teamMemberStatusSchema,
})

export const teamInvitationStatusUpdateSchema = z.object({
  invitationId: z.string().uuid('Invitation ID must be a valid UUID'),
  status: teamInvitationStatusSchema,
})

export type TeamMemberAddInput = z.infer<typeof teamMemberAddSchema>
export type TeamMemberUpdateInput = z.infer<typeof teamMemberUpdateSchema>
export type TeamMemberRemoveInput = z.infer<typeof teamMemberRemoveSchema>
export type TeamMemberStatusChangeInput = z.infer<typeof teamMemberStatusChangeSchema>
