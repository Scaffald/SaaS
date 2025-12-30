import { TRPCError } from '@trpc/server'
import type { Context } from '../context.ts';

import {
  FEEDBACK_ALLOWED_MIME_TYPES,
  FEEDBACK_MAX_SCREENSHOT_SIZE_BYTES,
  feedbackHistoryQuerySchema,
  feedbackSubmitSchema,
  feedbackUploadRequestSchema,
} from '../../_shared/feedback-schemas.ts';
import { protectedProcedure, t } from '../middleware.ts';

const FEEDBACK_BUCKET_ID = 'feedback-screenshots'
const DEFAULT_HISTORY_LIMIT = 20

function sanitizeFileName(fileName: string): string {
  const name = fileName.replace(/[^A-Za-z0-9._-]/g, '_')
  return name.length > 255 ? name.slice(-255) : name
}

async function resolveUserDisplayName(supabase: Context['supabase'], userId: string): Promise<string | null> {
  // Fetch display name / username
  const { data: userRow, error: userError } = await supabase
    .schema('core')
    .from('users')
    .select('display_name, username')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.warn('[feedback.resolveUserDisplayName] Failed to load users row', {
      userId,
      error: userError.message,
    })
  }

  const { data: profileRow, error: profileError } = await supabase
    .schema('core')
    .from('profile')
    .select('first_name, last_name')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError) {
    console.warn('[feedback.resolveUserDisplayName] Failed to load profile row', {
      userId,
      error: profileError.message,
    })
  }

  const fallbackName = [profileRow?.first_name ?? '', profileRow?.last_name ?? '']
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')

  const displayName = userRow?.display_name?.trim() || fallbackName || userRow?.username?.trim()

  return displayName && displayName.length > 0 ? displayName : null
}

export const feedbackRouter = t.router({
  submit: protectedProcedure.input(feedbackSubmitSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    if (!user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to submit feedback',
      })
    }

    const userEmail = user.email

    if (!userEmail) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to resolve user email for feedback submission',
      })
    }

    if (input.screenshotPath && !input.screenshotPath.startsWith(`${user.id}/`)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Screenshot path must belong to the authenticated user',
      })
    }

    const userName = await resolveUserDisplayName(supabase, user.id)

    const insertPayload = {
      user_id: user.id,
      user_email: userEmail,
      user_name: userName,
      feedback_type: input.feedbackType,
      feedback_text: input.feedbackText,
      screenshot_path: input.screenshotPath ?? null,
      page_url: input.pageUrl,
      page_title: input.pageTitle ?? null,
      user_agent: input.userAgent,
      browser_name: input.browserName ?? null,
      browser_version: input.browserVersion ?? null,
      operating_system: input.operatingSystem ?? null,
      screen_resolution: input.screenResolution ?? null,
      viewport_size: input.viewportSize ?? null,
      braingrid_sync_status: 'pending',
      sync_retry_count: 0,
    }

    const { data, error } = await supabase
      .schema('logs')
      .from('user_feedback')
      .insert(insertPayload)
      .select('id, braingrid_sync_status, created_at')
      .single()

    if (error) {
      console.error('[feedback.submit] Failed to insert feedback', {
        userId: user.id,
        message: error.message,
      })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to submit feedback',
      })
    }

    let syncStatus = data.braingrid_sync_status ?? 'pending'

    try {
      const { data: syncResult, error: syncError } = await supabase.functions.invoke(
        'feedback-to-braingrid',
        {
          body: {
            feedbackId: data.id,
            trigger: 'submission',
          },
        }
      )

      if (syncError) {
        console.error('[feedback.submit] Braingrid sync invocation failed', {
          feedbackId: data.id,
          message: syncError.message,
        })

        await supabase
          .schema('logs')
          .from('user_feedback')
          .update({
            braingrid_sync_status: 'failed',
            braingrid_sync_error: syncError.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id)

        syncStatus = 'failed'
      } else if (
        syncResult &&
        typeof syncResult === 'object' &&
        'success' in syncResult &&
        (syncResult as { success?: boolean }).success
      ) {
        syncStatus = 'synced'
      } else if (syncResult && typeof syncResult === 'object' && 'error' in syncResult) {
        const errorMessage =
          (syncResult as { error?: string }).error ?? 'Unknown Braingrid sync error'
        console.warn('[feedback.submit] Braingrid sync returned error', {
          feedbackId: data.id,
          error: errorMessage,
        })

        await supabase
          .schema('logs')
          .from('user_feedback')
          .update({
            braingrid_sync_status: 'failed',
            braingrid_sync_error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id)

        syncStatus = 'failed'
      }
    } catch (invokeError) {
      console.error('[feedback.submit] Unexpected Braingrid invocation error', {
        feedbackId: data.id,
        error: invokeError instanceof Error ? invokeError.message : invokeError,
      })

      await supabase
        .schema('logs')
        .from('user_feedback')
        .update({
          braingrid_sync_status: 'failed',
          braingrid_sync_error:
            invokeError instanceof Error ? invokeError.message : String(invokeError),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      syncStatus = 'failed'
    }

    return {
      id: data.id,
      status: syncStatus,
      createdAt: data.created_at,
    }
  }),

  getUserFeedback: protectedProcedure
    .input(feedbackHistoryQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view feedback submissions',
        })
      }

      const limit = input?.limit ?? DEFAULT_HISTORY_LIMIT
      const offset = input?.offset ?? 0

      const { data, error, count } = await supabase
        .schema('logs')
        .from('user_feedback')
        .select(
          `
            id,
            feedback_type,
            feedback_text,
            screenshot_path,
            page_url,
            page_title,
            user_agent,
            browser_name,
            browser_version,
            operating_system,
            screen_resolution,
            viewport_size,
            braingrid_feature_id,
            braingrid_sync_status,
            braingrid_sync_error,
            braingrid_synced_at,
            created_at,
            updated_at
          `,
          { count: 'exact' }
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('[feedback.getUserFeedback] Query failed', {
          userId: user.id,
          message: error.message,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load feedback history',
        })
      }

      const items = data ?? []
      const totalCount = count ?? items.length
      const nextOffset = offset + items.length

      return {
        items,
        totalCount,
        hasMore: nextOffset < totalCount,
        nextOffset: nextOffset < totalCount ? nextOffset : null,
      }
    }),

  getUploadUrl: protectedProcedure
    .input(feedbackUploadRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to upload screenshots',
        })
      }

      if (!FEEDBACK_ALLOWED_MIME_TYPES.includes(input.fileType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unsupported file type',
        })
      }

      if (input.fileSize > FEEDBACK_MAX_SCREENSHOT_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File exceeds maximum size of 5MB',
        })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const sanitizedFileName = sanitizeFileName(input.fileName)
      const filePath = `${user.id}/${timestamp}-${sanitizedFileName}`

      const { data, error } = await supabase.storage
        .from(FEEDBACK_BUCKET_ID)
        .createSignedUploadUrl(filePath)

      if (error || !data) {
        console.error('[feedback.getUploadUrl] Failed to create signed URL', {
          userId: user.id,
          message: error?.message,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to create upload URL',
        })
      }

      return {
        uploadUrl: data.signedUrl,
        token: data.token,
        filePath,
        bucket: FEEDBACK_BUCKET_ID,
        expiresIn: 60 * 5,
      }
    }),
})
