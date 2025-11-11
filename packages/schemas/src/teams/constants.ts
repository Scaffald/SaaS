import { z } from 'zod'

export const TEAM_VISIBILITIES = ['organization', 'private'] as const
export const TEAM_INVITATION_POLICIES = ['invite_only', 'request_to_join'] as const

export const TEAM_ROLE_KEYS = [
  'admin',
  'team_admin',
  'lead',
  'team_lead',
  'recruiter',
  'reviewer',
  'member',
] as const

export const TEAM_MEMBER_STATUSES = ['active', 'pending', 'removed'] as const

export const TEAM_INVITATION_STATUSES = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked',
] as const
export const TEAM_INVITATION_ACTIONS = ['accept', 'decline'] as const

export const TEAM_INVITATION_TTL_DEFAULT = 7
export const TEAM_INVITATION_TTL_MIN = 1
export const TEAM_INVITATION_TTL_MAX = 90

export const teamVisibilitySchema = z.enum(TEAM_VISIBILITIES)
export const teamInvitationPolicySchema = z.enum(TEAM_INVITATION_POLICIES)
export const teamRoleKeySchema = z.enum(TEAM_ROLE_KEYS)
export const teamMemberStatusSchema = z.enum(TEAM_MEMBER_STATUSES)
export const teamInvitationStatusSchema = z.enum(TEAM_INVITATION_STATUSES)
export const teamInvitationActionSchema = z.enum(TEAM_INVITATION_ACTIONS)
