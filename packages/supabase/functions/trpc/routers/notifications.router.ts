import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { Context } from '../context'
import { officeProcedure, protectedProcedure, t } from '../middleware'

const listInputSchema = z.object({
  status: z.enum(['all', 'unread', 'read', 'archived']).default('all'),
  limit: z.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
})

const quietHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

const channelSettingsSchema = z.object({
  in_app: z.boolean().default(true),
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
})

const typeOverridesSchema = z
  .record(
    z.string(),
    z.object({
      channels: channelSettingsSchema.partial().optional(),
      frequency: z.enum(['immediate', 'digest_daily', 'digest_weekly', 'mute']).optional(),
    })
  )
  .optional()

const preferencesUpsertSchema = z.object({
  globalEnabled: z.boolean().default(true),
  channelEnabled: channelSettingsSchema.partial().optional(),
  quietHours: quietHoursSchema.optional(),
  digestFrequency: z
    .enum(['immediate', 'digest_daily', 'digest_weekly', 'mute'])
    .default('immediate'),
  typeOverrides: typeOverridesSchema,
})

const bulkIdsInput = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

const notificationSelection = `
  id,
  user_id,
  type,
  severity,
  title,
  message,
  preview,
  body,
  metadata,
  read,
  read_at,
  archived_at,
  routed_channels,
  cta_label,
  cta_url,
  created_at,
  updated_at
`

function buildListQuery(
  ctx: { supabase: Context['supabase']; user: { id: string } },
  input: z.infer<typeof listInputSchema>
) {
  const { supabase, user } = ctx
  let query = supabase
    .schema('core')
    .from('notifications')
    .select(notificationSelection)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(input.limit + 1)

  switch (input.status) {
    case 'unread':
      query = query.eq('read', false).is('archived_at', null)
      break
    case 'read':
      query = query.eq('read', true).is('archived_at', null)
      break
    case 'archived':
      query = query.not('archived_at', 'is', null)
      break
    default:
      query = query.is('archived_at', null)
  }

  if (input.cursor) {
    query = query.lt('created_at', input.cursor)
  }

  return query
}

function mapPreferences(row: Record<string, unknown> | null) {
  return {
    globalEnabled: row?.global_enabled ?? true,
    channelEnabled: {
      in_app: row?.channel_enabled?.in_app ?? true,
      email: row?.channel_enabled?.email ?? true,
      push: row?.channel_enabled?.push ?? true,
      sms: row?.channel_enabled?.sms ?? false,
    },
    quietHours: row?.quiet_hours ?? null,
    digestFrequency: row?.digest_frequency ?? 'immediate',
    typeOverrides: row?.type_overrides ?? {},
    updatedAt: row?.updated_at ?? null,
  }
}

export const notificationsRouter = t.router({
  list: protectedProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    const { data, error } = await buildListQuery(ctx, input)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch notifications: ${error.message}`,
      })
    }

    const notifications = data ?? []
    const hasNext = notifications.length > input.limit
    const items = hasNext ? notifications.slice(0, -1) : notifications
    const nextCursor = hasNext ? (items[items.length - 1]?.created_at ?? null) : null

    return {
      items,
      nextCursor,
    }
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    const { count, error } = await supabase
      .schema('core')
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .is('archived_at', null)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get unread count: ${error.message}`,
      })
    }

    return { count: count ?? 0 }
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const timestamp = new Date().toISOString()

      const { data, error } = await supabase
        .schema('core')
        .from('notifications')
        .update({ read: true, read_at: timestamp, updated_at: timestamp })
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select(notificationSelection)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to mark notification as read: ${error.message}`,
        })
      }

      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' })
      }

      return data
    }),

  markAsUnread: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('notifications')
        .update({ read: false, read_at: null, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select(notificationSelection)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to mark notification as unread: ${error.message}`,
        })
      }

      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' })
      }

      return data
    }),

  markManyRead: protectedProcedure.input(bulkIdsInput).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    const timestamp = new Date().toISOString()

    const { error } = await supabase
      .schema('core')
      .from('notifications')
      .update({ read: true, read_at: timestamp, updated_at: timestamp })
      .eq('user_id', user.id)
      .in('id', input.ids)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to mark notifications as read: ${error.message}`,
      })
    }

    return { success: true }
  }),

  markManyUnread: protectedProcedure.input(bulkIdsInput).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    const { error } = await supabase
      .schema('core')
      .from('notifications')
      .update({ read: false, read_at: null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('id', input.ids)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to mark notifications as unread: ${error.message}`,
      })
    }

    return { success: true }
  }),

  archiveMany: protectedProcedure.input(bulkIdsInput).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    const timestamp = new Date().toISOString()

    const { error } = await supabase
      .schema('core')
      .from('notifications')
      .update({ archived_at: timestamp, updated_at: timestamp })
      .eq('user_id', user.id)
      .in('id', input.ids)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to archive notifications: ${error.message}`,
      })
    }

    return { success: true }
  }),

  restoreMany: protectedProcedure.input(bulkIdsInput).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    const { error } = await supabase
      .schema('core')
      .from('notifications')
      .update({ archived_at: null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('id', input.ids)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to restore notifications: ${error.message}`,
      })
    }

    return { success: true }
  }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { supabase, user } = ctx
    const timestamp = new Date().toISOString()

    const { count, error } = await supabase
      .schema('core')
      .from('notifications')
      .update({ read: true, read_at: timestamp, updated_at: timestamp })
      .eq('user_id', user.id)
      .eq('read', false)
      .is('archived_at', null)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to mark all notifications as read: ${error.message}`,
      })
    }

    return { success: true, updated: count ?? 0 }
  }),

  preferences: t.router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { supabase, user } = ctx
      const { data, error } = await supabase
        .schema('core')
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load notification preferences: ${error.message}`,
        })
      }

      return mapPreferences(data ?? {})
    }),

    save: protectedProcedure.input(preferencesUpsertSchema).mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const timestamp = new Date().toISOString()

      const payload = {
        user_id: user.id,
        global_enabled: input.globalEnabled,
        channel_enabled: {
          in_app: input.channelEnabled?.in_app ?? true,
          email: input.channelEnabled?.email ?? true,
          push: input.channelEnabled?.push ?? true,
          sms: input.channelEnabled?.sms ?? false,
        },
        quiet_hours: input.quietHours ?? null,
        digest_frequency: input.digestFrequency,
        type_overrides: input.typeOverrides ?? {},
        updated_at: timestamp,
      }

      const { error } = await supabase
        .schema('core')
        .from('notification_preferences')
        .upsert(payload)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update notification preferences: ${error.message}`,
        })
      }

      return { success: true }
    }),
  }),

  devices: t.router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { supabase, user } = ctx
      const { data, error } = await supabase
        .schema('core')
        .from('notification_devices')
        .select('id, token, platform, metadata, last_seen_at, created_at')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load devices: ${error.message}`,
        })
      }

      return data ?? []
    }),

    register: protectedProcedure
      .input(
        z.object({
          token: z.string().min(10),
          platform: z.enum(['ios', 'android', 'web']),
          metadata: z.record(z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx
        const timestamp = new Date().toISOString()

        const { error } = await supabase
          .schema('core')
          .from('notification_devices')
          .upsert({
            user_id: user.id,
            token: input.token,
            platform: input.platform,
            metadata: input.metadata ?? {},
            last_seen_at: timestamp,
            updated_at: timestamp,
          })

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to register device: ${error.message}`,
          })
        }

        return { success: true }
      }),

    remove: protectedProcedure
      .input(z.object({ token: z.string().min(10) }))
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx
        const { error } = await supabase
          .schema('core')
          .from('notification_devices')
          .delete()
          .eq('user_id', user.id)
          .eq('token', input.token)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to remove device: ${error.message}`,
          })
        }

        return { success: true }
      }),
  }),

  admin: t.router({
    deliveries: officeProcedure
      .input(
        z.object({
          status: z
            .enum(['all', 'queued', 'sending', 'sent', 'delivered', 'failed', 'bounce', 'blocked'])
            .default('queued'),
          limit: z.number().int().min(1).max(200).default(100),
        })
      )
      .query(async ({ ctx, input }) => {
        let query = ctx.supabase
          .schema('core')
          .from('notification_deliveries')
          .select(
            `
            id,
            notification_id,
            channel,
            provider,
            provider_msg_id,
            status,
            attempts,
            last_error,
            next_attempt_at,
            metadata,
            created_at,
            updated_at,
            notification:notifications(${notificationSelection})
          `
          )
          .order('created_at', { ascending: false })
          .limit(input.limit)

        if (input.status !== 'all') {
          query = query.eq('status', input.status)
        }

        const { data, error } = await query

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to load delivery queue: ${error.message}`,
          })
        }

        return data ?? []
      }),

    digestQueue: officeProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(200).default(100),
        })
      )
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .schema('core')
          .from('notification_digest_queue')
          .select(
            'id, user_id, type, bucket, count, channels, examples, last_event_at, processed_at, updated_at'
          )
          .order('last_event_at', { ascending: false })
          .limit(input.limit)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to load digest queue: ${error.message}`,
          })
        }

        return data ?? []
      }),
  }),
})
