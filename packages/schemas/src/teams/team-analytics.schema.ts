import { z } from 'zod'

const dateTimeString = z.string().datetime({ offset: true })

export const teamAnalyticsOverviewInputSchema = z.object({
  teamId: z.string().uuid(),
  startDate: dateTimeString.optional(),
  endDate: dateTimeString.optional(),
  limit: z.number().int().min(1).max(90).optional(),
})

export const teamAnalyticsActivityFeedSchema = z.object({
  teamId: z.string().uuid(),
  cursor: dateTimeString.optional(),
  pageSize: z.number().int().min(1).max(100).default(25),
  startDate: dateTimeString.optional(),
  endDate: dateTimeString.optional(),
})

export const teamWorkloadSnapshotInputSchema = z.object({
  teamId: z.string().uuid(),
  asOf: dateTimeString.optional(),
  includeHistorical: z.boolean().default(false),
})

export const teamJobAssignmentListSchema = z.object({
  jobId: z.string().uuid(),
})

export const teamJobAssignmentCreateSchema = z.object({
  jobId: z.string().uuid(),
  teamId: z.string().uuid(),
  roleKey: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/i, 'Role keys may only include alphanumeric characters and underscores')
    .optional(),
  isPrimary: z.boolean().optional(),
})

export const teamJobAssignmentUpdateSchema = z.object({
  assignmentId: z.string().uuid(),
  roleKey: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/i, 'Role keys may only include alphanumeric characters and underscores')
    .optional(),
  isPrimary: z.boolean().optional(),
})

export const teamJobAssignmentDeleteSchema = z.object({
  assignmentId: z.string().uuid(),
})

export const teamOwnershipTransferSchema = z.object({
  teamId: z.string().uuid(),
  memberId: z.string().uuid(),
  roleKey: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/i)
    .optional(),
  notify: z.boolean().default(true),
})

export const teamMemberSelfRemovalSchema = z.object({
  teamId: z.string().uuid(),
  reason: z.string().max(512).optional(),
})

export const teamActivityCommentSchema = z.object({
  teamId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  mentions: z.array(z.string().uuid()).default([]),
  applicationId: z.string().uuid().optional(),
})
