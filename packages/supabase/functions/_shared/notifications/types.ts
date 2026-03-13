import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { Database, Json } from '../database.types.ts'

export type NotificationSupabaseClient = SupabaseClient<Database>

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push', 'sms'] as const
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_SEVERITIES = ['info', 'important', 'critical'] as const
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number]

export const NOTIFICATION_DELIVERY_STATUSES = [
  'queued',
  'sending',
  'sent',
  'delivered',
  'failed',
  'bounce',
  'blocked',
] as const
export type NotificationDeliveryStatus = (typeof NOTIFICATION_DELIVERY_STATUSES)[number]

export const NOTIFICATION_EVENT_KINDS = [
  'accepted',
  'delivered',
  'opened',
  'clicked',
  'failed',
  'bounce',
  'complaint',
] as const
export type NotificationEventKind = (typeof NOTIFICATION_EVENT_KINDS)[number]

export const NOTIFICATION_FREQUENCIES = [
  'immediate',
  'digest_daily',
  'digest_weekly',
  'mute',
] as const
export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number]

export const NOTIFICATION_TYPES = [
  'success',
  'warning',
  'info',
  'job.match',
  'app.submitted',
  'app.status_changed',
  'interview.scheduled',
  'offer.extended',
  'hiring.decision',
  'team.invite',
  'team.assigned',
  'team.commented',
  'team.role_changed',
  'profile.viewed',
  'profile.unlocked',
  'review.new',
  'review.reply',
  'skill.endorse',
  'acct.verify',
  'acct.password_reset',
  'payment.success',
  'payment.failed',
  'sub.renewal',
  'bgcheck.completed',
  'profile.reminder',
  'reengage',
  'feature.announcement',
  'platform.update',
  'message.received',
  'connection.request',
  'connection.accepted',
  'policy.renewal',
  'inquiry.sent',
  'inquiry.comment_added',
  'inquiry.fully_accepted',
  'inquiry.section_accepted',
  'inquiry.capability_answered',
  'inquiry.updated',
  'community.post_comment',
  'community.post_rating',
  'community.reputation_change',
  'community.new_follower',
  'community.followed_user_post',
  'community.karma_received',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const notificationEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NOTIFICATION_TYPES),
  severity: z.enum(NOTIFICATION_SEVERITIES).default('info'),
  title: z.string().min(1),
  message: z.string().min(1).optional(),
  preview: z.string().optional(),
  recipients: z.array(z.string().uuid()).min(1),
  channels: z.array(z.enum(NOTIFICATION_CHANNELS)).default(['in_app']),
  body: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).optional(),
  dedupeKey: z.string().optional(),
  actorId: z.string().uuid().optional(),
  tenantId: z.string().optional(),
  timezone: z.string().optional(),
  sendAfter: z.string().datetime().optional(),
  cta: z
    .object({
      label: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
})

export type NotificationEventPayload = z.infer<typeof notificationEventSchema>

export type NotificationRow = Database['core']['Tables']['notifications']['Row']
export type NotificationDeliveryRow = Database['core']['Tables']['notification_deliveries']['Row']
export type NotificationPreferencesRow =
  Database['core']['Tables']['notification_preferences']['Row']
export type NotificationDigestQueueRow =
  Database['core']['Tables']['notification_digest_queue']['Row']

export interface DeliveryWithNotification extends NotificationDeliveryRow {
  notification: NotificationRow
}

export interface AdapterSendParams {
  supabase: NotificationSupabaseClient
  delivery: NotificationDeliveryRow
  notification: NotificationRow
}

export interface AdapterSendResult {
  status: 'sent' | 'retry' | 'failed'
  providerMessageId?: string
  events?: Array<{
    kind: NotificationEventKind
    meta?: Record<string, unknown>
  }>
  error?: string
}

export interface ChannelAdapter {
  send(params: AdapterSendParams): Promise<AdapterSendResult>
}

export type DeliveryMetadata = Record<string, Json | undefined>
