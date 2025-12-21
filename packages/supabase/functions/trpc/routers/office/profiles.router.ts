import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { officeProcedure, t } from '../../middleware.ts';

const getGhostProfilesInputSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  query: z.string().trim().max(120).optional(),
})

const sendReminderInputSchema = z.object({
  userId: z.string().uuid(),
  message: z.string().trim().max(280).optional(),
})

const uiPreferencesSchema = z
  .object({
    is_ghost_profile: z.boolean().optional(),
    ghost_profile_marked_at: z.string().optional(),
    ghost_profile_last_checked_at: z.string().optional(),
    ghost_profile_completion_score: z.number().optional(),
    ghost_profile_last_reminder_at: z.string().optional(),
  })
  .passthrough()

const reminderEntrySchema = z.object({
  type: z.string().optional(),
  sentAt: z.string(),
  message: z.string().optional(),
})

const nudgeHistorySchema = z
  .object({
    dismissed: z
      .record(
        z.object({
          dismissedAt: z.string(),
          reason: z.string().optional(),
        })
      )
      .optional(),
    reminders: z.array(reminderEntrySchema).optional(),
  })
  .partial()

type ParsedUIPreferences = z.infer<typeof uiPreferencesSchema>
type ParsedNudgeHistory = z.infer<typeof nudgeHistorySchema>

export function parseUIPreferences(raw: unknown): ParsedUIPreferences {
  const parsed = uiPreferencesSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : {}
}

export function parseNudgeHistory(raw: unknown): ParsedNudgeHistory {
  const parsed = nudgeHistorySchema.safeParse(raw ?? {})
  return parsed.success
    ? {
        dismissed: parsed.data.dismissed ?? {},
        reminders: parsed.data.reminders ?? [],
      }
    : { dismissed: {}, reminders: [] }
}

export const officeProfilesRouter = t.router({
  getGhostProfiles: officeProcedure
    .input(getGhostProfilesInputSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('preferences')
        .select(
          `
            user_id,
            prerequisites_completed_at,
            ui_preferences,
            nudge_history,
            users:users(email, display_name, headline, created_at),
            profile:profile(first_name, last_name, location)
          `
        )
        .filter('ui_preferences->>is_ghost_profile', 'eq', 'true')
        .limit(500)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load ghost profiles: ${error.message}`,
        })
      }

      const rows = data ?? []
      const filteredRows = input.query
        ? rows.filter((row: { users?: { display_name?: string | null; email?: string | null } | null; profile?: { first_name?: string | null; last_name?: string | null } | null; [key: string]: unknown }) => {
            const displayName = row.users?.display_name ?? ''
            const email = row.users?.email ?? ''
            const firstName = row.profile?.first_name ?? ''
            const lastName = row.profile?.last_name ?? ''
            const target = `${displayName} ${email} ${firstName} ${lastName}`.toLowerCase()
            return target.includes(input.query?.toLowerCase() ?? '')
          })
        : rows
      const total = filteredRows.length
      const paginatedRows = filteredRows.slice(input.offset, input.offset + input.limit)

      const userIds = paginatedRows.map((row: { user_id: string; [key: string]: unknown }) => row.user_id)
      const completionScores =
        userIds.length > 0
          ? await ctx.supabaseAdmin
              .schema('core')
              .from('v_profile_completion_scores')
              .select('user_id, completion_score')
              .in('user_id', userIds)
          : { data: [] as Array<{ user_id: string; completion_score: number }> }

      if (completionScores.error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load completion scores: ${completionScores.error.message}`,
        })
      }

      const scoreMap = new Map(
        (completionScores.data ?? []).map((entry: { user_id: string; completion_score: number }) => [entry.user_id, entry.completion_score])
      )

      const items = paginatedRows.map((row: { user_id: string; ui_preferences?: unknown; nudge_history?: unknown; users?: { display_name?: string | null; email?: string | null; headline?: string | null; created_at?: string | null } | null; profile?: { first_name?: string | null; last_name?: string | null; location?: string | null } | null; prerequisites_completed_at?: string | null; [key: string]: unknown }) => {
        const uiPreferences = parseUIPreferences(row.ui_preferences)
        const nudgeHistory = parseNudgeHistory(row.nudge_history)
        const markedAt = uiPreferences.ghost_profile_marked_at ?? null
        const lastReminder =
          uiPreferences.ghost_profile_last_reminder_at ??
          nudgeHistory.reminders?.slice(-1)[0]?.sentAt ??
          null

        return {
          userId: row.user_id,
          displayName: row.users?.display_name ?? '',
          email: row.users?.email ?? '',
          headline: row.users?.headline ?? '',
          firstName: row.profile?.first_name ?? '',
          lastName: row.profile?.last_name ?? '',
          location: row.profile?.location ?? '',
          completionScore:
            scoreMap.get(row.user_id) ?? uiPreferences.ghost_profile_completion_score ?? 0,
          prerequisitesCompletedAt: row.prerequisites_completed_at,
          ghostProfileMarkedAt: markedAt,
          lastReminderAt: lastReminder,
          reminderCount: nudgeHistory.reminders?.length ?? 0,
        }
      })

      return {
        items,
        total,
      }
    }),

  sendReminder: officeProcedure.input(sendReminderInputSchema).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabaseAdmin
      .schema('core')
      .from('preferences')
      .select('nudge_history, ui_preferences')
      .eq('user_id', input.userId)
      .maybeSingle()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load preferences: ${error.message}`,
      })
    }

    if (!data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User preferences not found.',
      })
    }

    const uiPreferences = parseUIPreferences(data.ui_preferences)
    const nudgeHistory = parseNudgeHistory(data.nudge_history)

    const nowIso = new Date().toISOString()
    const reminderEntry = {
      type: 'ghost_profile_reminder',
      sentAt: nowIso,
      message: input.message,
    }

    const reminders = [...(nudgeHistory.reminders ?? []), reminderEntry]
    const updatedHistory = {
      ...nudgeHistory,
      reminders,
    }

    const updatedUIPreferences: ParsedUIPreferences = {
      ...uiPreferences,
      is_ghost_profile: true,
      ghost_profile_last_reminder_at: nowIso,
    }

    const { error: updateError } = await ctx.supabaseAdmin
      .schema('core')
      .from('preferences')
      .upsert(
        {
          user_id: input.userId,
          nudge_history: updatedHistory,
          ui_preferences: updatedUIPreferences,
          updated_at: nowIso,
        },
        { onConflict: 'user_id' }
      )

    if (updateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to record reminder: ${updateError.message}`,
      })
    }

    console.log('[ghost-profile] Reminder dispatched', {
      userId: input.userId,
      sentAt: nowIso,
    })

    return {
      success: true,
      reminderSentAt: nowIso,
    }
  }),
})
