/**
 * Feedback System tRPC Router
 * REQ-NEW: Feedback Modal System
 *
 * Provides user and admin procedures for:
 * - Creating feedback items (bugs, features, support, general)
 * - Conversation threading between users and admins
 * - File attachments via Supabase storage
 * - Admin assignment, claiming, and reassignment
 * - Status management and notifications
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { forsured, supabase, supabaseServiceRole } from '../../../lib/supabase'
import { sendEmail } from '../../../lib/email/emailConfig'

/**
 * Feedback types
 */
const FEEDBACK_TYPES = ['bug', 'feature', 'support', 'general'] as const
type FeedbackType = typeof FEEDBACK_TYPES[number]

/**
 * Feedback statuses
 */
const FEEDBACK_STATUSES = ['open', 'in_progress', 'resolved', 'archived'] as const
type FeedbackStatus = typeof FEEDBACK_STATUSES[number]

/**
 * Get the appropriate Supabase client for privileged operations
 */
function getForsuredAdmin(tableName: string) {
  if (supabaseServiceRole) {
    return forsured(tableName, supabaseServiceRole)
  }
  console.warn('[Feedback] Service role client not available, using regular client')
  return forsured(tableName)
}

/**
 * Get the service role Supabase client for storage operations
 */
function getStorageAdmin() {
  if (supabaseServiceRole) {
    return supabaseServiceRole.storage
  }
  return supabase.storage
}

/**
 * Input validation schemas
 */
const createFeedbackInput = z.object({
  type: z.enum(FEEDBACK_TYPES),
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.string().min(1, 'Message is required').max(10000),
  sourceUrl: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    filePath: z.string(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
  })).optional(),
})

const replyInput = z.object({
  feedbackId: z.string().uuid(),
  content: z.string().min(1, 'Message is required').max(10000),
  attachments: z.array(z.object({
    fileName: z.string(),
    filePath: z.string(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
  })).optional(),
})

const adminListInput = z.object({
  tab: z.enum(['unassigned', 'mine', 'all']).default('all'),
  type: z.enum(FEEDBACK_TYPES).optional(),
  status: z.enum(FEEDBACK_STATUSES).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

const adminReassignInput = z.object({
  feedbackId: z.string().uuid(),
  assignToUserId: z.string().uuid(),
})

const adminUpdateStatusInput = z.object({
  feedbackId: z.string().uuid(),
  status: z.enum(FEEDBACK_STATUSES),
})

/**
 * Get the current user's forsured profile
 */
async function getCurrentUserProfile(userId: string) {
  const { data, error } = await forsured('user_profiles')
    .select('id, scaffald_user_id, user_type, name, email, company')
    .eq('scaffald_user_id', userId)
    .single()

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User profile not found',
    })
  }

  return data
}

/**
 * Check if user is an admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const { data } = await forsured('user_profiles')
    .select('user_type')
    .eq('scaffald_user_id', userId)
    .single()

  return data?.user_type === 'admin'
}

/**
 * Get admin users for reassignment dropdown
 */
async function getAdminUsers() {
  const { data } = await forsured('user_profiles')
    .select('id, name, email')
    .eq('user_type', 'admin')
    .order('name')

  return data || []
}

/**
 * Build email HTML for admin reassignment notification
 */
function buildReassignmentEmailHtml(params: {
  fromAdminName: string
  subject: string
  feedbackUrl: string
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e40af; margin-bottom: 24px;">Feedback Item Assigned to You</h2>

      <p style="font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>${params.fromAdminName}</strong> has assigned a feedback item to you:
      </p>

      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="font-size: 16px; color: #374151; margin: 0;">
          <strong>${params.subject}</strong>
        </p>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${params.feedbackUrl}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Feedback
        </a>
      </div>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 12px; color: #9ca3af;">
        This notification was sent by ForSured.
      </p>
    </div>
  `
}

/**
 * Create a notification for the user when admin replies
 */
async function createUserNotification(params: {
  userId: string
  feedbackId: string
  feedbackSubject: string
}) {
  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

  // Insert notification using service role to bypass RLS
  const { error } = await getForsuredAdmin('notifications')
    .insert({
      user_id: params.userId,
      type: 'info',
      title: 'New reply to your feedback',
      message: `An admin has replied to your feedback: ${params.feedbackSubject}`,
      destination_url: `${baseUrl}?feedback=${params.feedbackId}`,
      read: false,
    })

  if (error) {
    console.error('[Feedback] Failed to create notification:', error)
  }
}

/**
 * Feedback tRPC Router
 */
export const feedbackRouter = createTRPCRouter({
  // =========================================================
  // USER PROCEDURES
  // =========================================================

  /**
   * Create a new feedback item with initial message
   */
  create: protectedProcedure
    .input(createFeedbackInput)
    .mutation(async ({ input, ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      // Create feedback item
      const { data: feedbackItem, error: feedbackError } = await getForsuredAdmin('feedback_items')
        .insert({
          user_id: userProfile.id,
          type: input.type,
          subject: input.subject,
          source_url: input.sourceUrl || null,
          status: 'open',
        })
        .select('id')
        .single()

      if (feedbackError || !feedbackItem) {
        console.error('[Feedback] Error creating feedback item:', feedbackError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create feedback',
        })
      }

      // Create initial message
      const { data: message, error: messageError } = await getForsuredAdmin('feedback_messages')
        .insert({
          feedback_id: feedbackItem.id,
          sender_id: userProfile.id,
          sender_type: 'user',
          content: input.content,
        })
        .select('id')
        .single()

      if (messageError || !message) {
        console.error('[Feedback] Error creating message:', messageError)
        // Clean up the feedback item
        await getForsuredAdmin('feedback_items').delete().eq('id', feedbackItem.id)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create feedback message',
        })
      }

      // Create attachments if provided
      if (input.attachments && input.attachments.length > 0) {
        const attachmentRecords = input.attachments.map(att => ({
          message_id: message.id,
          file_name: att.fileName,
          file_path: att.filePath,
          file_size: att.fileSize || null,
          mime_type: att.mimeType || null,
        }))

        const { error: attachmentError } = await getForsuredAdmin('feedback_attachments')
          .insert(attachmentRecords)

        if (attachmentError) {
          console.error('[Feedback] Error creating attachments:', attachmentError)
          // Don't fail the whole operation for attachment errors
        }
      }

      console.log('[Feedback] Feedback created:', feedbackItem.id)

      return { feedbackId: feedbackItem.id }
    }),

  /**
   * List user's feedback items
   */
  list: protectedProcedure
    .input(z.object({
      includeArchived: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      let query = getForsuredAdmin('feedback_items')
        .select(`
          id,
          type,
          status,
          subject,
          source_url,
          created_at,
          updated_at,
          user_archived_at
        `)
        .eq('user_id', userProfile.id)
        .order('updated_at', { ascending: false })

      // Exclude archived unless requested
      if (!input?.includeArchived) {
        query = query.is('user_archived_at', null)
      }

      const { data: items, error } = await query

      if (error) {
        console.error('[Feedback] Error fetching feedback list:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch feedback',
        })
      }

      // Get unread message counts for each item
      const itemIds = items?.map(i => i.id) || []

      if (itemIds.length === 0) {
        return []
      }

      // Count unread admin messages for each feedback item
      const { data: unreadCounts } = await getForsuredAdmin('feedback_messages')
        .select('feedback_id')
        .in('feedback_id', itemIds)
        .eq('sender_type', 'admin')
        .is('read_at', null)

      const unreadMap = new Map<string, number>()
      for (const msg of unreadCounts || []) {
        const count = unreadMap.get(msg.feedback_id) || 0
        unreadMap.set(msg.feedback_id, count + 1)
      }

      return (items || []).map(item => ({
        ...item,
        unreadCount: unreadMap.get(item.id) || 0,
      }))
    }),

  /**
   * Get a single feedback item with all messages
   */
  get: protectedProcedure
    .input(z.object({ feedbackId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      // Get feedback item
      const { data: item, error } = await getForsuredAdmin('feedback_items')
        .select(`
          id,
          type,
          status,
          subject,
          source_url,
          assigned_to,
          user_archived_at,
          created_at,
          updated_at
        `)
        .eq('id', input.feedbackId)
        .eq('user_id', userProfile.id)
        .single()

      if (error || !item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feedback not found',
        })
      }

      // Get messages with attachments
      const { data: messages } = await getForsuredAdmin('feedback_messages')
        .select(`
          id,
          sender_id,
          sender_type,
          content,
          read_at,
          created_at
        `)
        .eq('feedback_id', input.feedbackId)
        .order('created_at', { ascending: true })

      // Get attachments for all messages
      const messageIds = messages?.map(m => m.id) || []
      const { data: attachments } = messageIds.length > 0
        ? await getForsuredAdmin('feedback_attachments')
            .select('id, message_id, file_name, file_path, file_size, mime_type')
            .in('message_id', messageIds)
        : { data: [] }

      // Group attachments by message
      const attachmentMap = new Map<string, typeof attachments>()
      for (const att of attachments || []) {
        const existing = attachmentMap.get(att.message_id) || []
        existing.push(att)
        attachmentMap.set(att.message_id, existing)
      }

      // Mark admin messages as read
      const unreadAdminMessageIds = messages
        ?.filter(m => m.sender_type === 'admin' && !m.read_at)
        .map(m => m.id) || []

      if (unreadAdminMessageIds.length > 0) {
        await getForsuredAdmin('feedback_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadAdminMessageIds)
      }

      // Get sender names for admin messages
      const adminSenderIds = [...new Set(messages?.filter(m => m.sender_type === 'admin').map(m => m.sender_id) || [])]
      const { data: adminProfiles } = adminSenderIds.length > 0
        ? await getForsuredAdmin('user_profiles')
            .select('id, name')
            .in('id', adminSenderIds)
        : { data: [] }

      const adminNameMap = new Map<string, string>()
      for (const profile of adminProfiles || []) {
        adminNameMap.set(profile.id, profile.name || 'Admin')
      }

      return {
        ...item,
        messages: (messages || []).map(m => ({
          ...m,
          senderName: m.sender_type === 'admin'
            ? adminNameMap.get(m.sender_id) || 'Admin'
            : userProfile.name || 'You',
          attachments: attachmentMap.get(m.id) || [],
        })),
      }
    }),

  /**
   * Reply to a feedback conversation
   */
  reply: protectedProcedure
    .input(replyInput)
    .mutation(async ({ input, ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      // Verify user owns this feedback and it's not archived
      const { data: item, error: itemError } = await getForsuredAdmin('feedback_items')
        .select('id, user_archived_at')
        .eq('id', input.feedbackId)
        .eq('user_id', userProfile.id)
        .single()

      if (itemError || !item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feedback not found',
        })
      }

      if (item.user_archived_at) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot reply to archived feedback',
        })
      }

      // Create message
      const { data: message, error: messageError } = await getForsuredAdmin('feedback_messages')
        .insert({
          feedback_id: input.feedbackId,
          sender_id: userProfile.id,
          sender_type: 'user',
          content: input.content,
        })
        .select('id')
        .single()

      if (messageError || !message) {
        console.error('[Feedback] Error creating reply:', messageError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send reply',
        })
      }

      // Create attachments if provided
      if (input.attachments && input.attachments.length > 0) {
        const attachmentRecords = input.attachments.map(att => ({
          message_id: message.id,
          file_name: att.fileName,
          file_path: att.filePath,
          file_size: att.fileSize || null,
          mime_type: att.mimeType || null,
        }))

        await getForsuredAdmin('feedback_attachments').insert(attachmentRecords)
      }

      return { messageId: message.id }
    }),

  /**
   * Archive a feedback item (user side)
   */
  archive: protectedProcedure
    .input(z.object({ feedbackId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      const { error } = await getForsuredAdmin('feedback_items')
        .update({ user_archived_at: new Date().toISOString() })
        .eq('id', input.feedbackId)
        .eq('user_id', userProfile.id)

      if (error) {
        console.error('[Feedback] Error archiving feedback:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive feedback',
        })
      }

      return { success: true }
    }),

  /**
   * Get unread count for badge
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      // Get all user's non-archived feedback item IDs
      const { data: items } = await getForsuredAdmin('feedback_items')
        .select('id')
        .eq('user_id', userProfile.id)
        .is('user_archived_at', null)

      if (!items || items.length === 0) {
        return { count: 0 }
      }

      const itemIds = items.map(i => i.id)

      // Count unread admin messages
      const { count, error } = await getForsuredAdmin('feedback_messages')
        .select('id', { count: 'exact', head: true })
        .in('feedback_id', itemIds)
        .eq('sender_type', 'admin')
        .is('read_at', null)

      if (error) {
        console.error('[Feedback] Error counting unread:', error)
        return { count: 0 }
      }

      return { count: count || 0 }
    }),

  /**
   * Get signed URL for uploading attachment
   */
  getUploadUrl: protectedProcedure
    .input(z.object({
      feedbackId: z.string().uuid(),
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userProfile = await getCurrentUserProfile(ctx.userId)

      // Generate unique file path
      const timestamp = Date.now()
      const safeName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${userProfile.id}/${input.feedbackId}/${timestamp}-${safeName}`

      // Create signed upload URL
      const { data, error } = await getStorageAdmin()
        .from('feedback-attachments')
        .createSignedUploadUrl(filePath)

      if (error) {
        console.error('[Feedback] Error creating upload URL:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create upload URL',
        })
      }

      return {
        signedUrl: data.signedUrl,
        path: filePath,
        token: data.token,
      }
    }),

  /**
   * Get signed URL for downloading attachment
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await getStorageAdmin()
        .from('feedback-attachments')
        .createSignedUrl(input.filePath, 3600) // 1 hour expiry

      if (error) {
        console.error('[Feedback] Error creating download URL:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get download URL',
        })
      }

      return { signedUrl: data.signedUrl }
    }),

  // =========================================================
  // ADMIN PROCEDURES
  // =========================================================

  admin: createTRPCRouter({
    /**
     * List all feedback items (admin view)
     */
    list: protectedProcedure
      .input(adminListInput)
      .query(async ({ input, ctx }) => {
        // Verify user is admin
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        const adminProfile = await getCurrentUserProfile(ctx.userId)

        let query = getForsuredAdmin('feedback_items')
          .select(`
            id,
            user_id,
            type,
            status,
            subject,
            source_url,
            assigned_to,
            user_archived_at,
            created_at,
            updated_at
          `)
          .order('updated_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1)

        // Tab filtering
        if (input.tab === 'unassigned') {
          query = query.is('assigned_to', null)
        } else if (input.tab === 'mine') {
          query = query.eq('assigned_to', adminProfile.id)
        }

        // Type filtering
        if (input.type) {
          query = query.eq('type', input.type)
        }

        // Status filtering
        if (input.status) {
          query = query.eq('status', input.status)
        }

        // Search filtering (will filter in-memory for simplicity)
        const { data: items, error } = await query

        if (error) {
          console.error('[Feedback] Admin list error:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch feedback',
          })
        }

        if (!items || items.length === 0) {
          return []
        }

        // Get user profiles for all feedback items
        const userIds = [...new Set(items.map(i => i.user_id))]
        const { data: userProfiles } = await getForsuredAdmin('user_profiles')
          .select('id, name, email')
          .in('id', userIds)

        const userMap = new Map<string, { name: string; email: string }>()
        for (const profile of userProfiles || []) {
          userMap.set(profile.id, { name: profile.name || 'Unknown', email: profile.email || '' })
        }

        // Get unread user message counts
        const itemIds = items.map(i => i.id)
        const { data: unreadCounts } = await getForsuredAdmin('feedback_messages')
          .select('feedback_id')
          .in('feedback_id', itemIds)
          .eq('sender_type', 'user')
          .is('read_at', null)

        const unreadMap = new Map<string, number>()
        for (const msg of unreadCounts || []) {
          const count = unreadMap.get(msg.feedback_id) || 0
          unreadMap.set(msg.feedback_id, count + 1)
        }

        // Get assigned admin names
        const assignedIds = [...new Set(items.filter(i => i.assigned_to).map(i => i.assigned_to!))]
        const { data: assignedProfiles } = assignedIds.length > 0
          ? await getForsuredAdmin('user_profiles')
              .select('id, name')
              .in('id', assignedIds)
          : { data: [] }

        const assignedMap = new Map<string, string>()
        for (const profile of assignedProfiles || []) {
          assignedMap.set(profile.id, profile.name || 'Unknown')
        }

        let results = items.map(item => ({
          ...item,
          userName: userMap.get(item.user_id)?.name || 'Unknown',
          userEmail: userMap.get(item.user_id)?.email || '',
          assignedToName: item.assigned_to ? assignedMap.get(item.assigned_to) || 'Unknown' : null,
          unreadCount: unreadMap.get(item.id) || 0,
        }))

        // Apply search filter if provided
        if (input.search) {
          const searchLower = input.search.toLowerCase()
          results = results.filter(item =>
            item.subject.toLowerCase().includes(searchLower) ||
            item.userName.toLowerCase().includes(searchLower) ||
            item.userEmail.toLowerCase().includes(searchLower)
          )
        }

        return results
      }),

    /**
     * Get a single feedback item with all messages (admin view)
     */
    get: protectedProcedure
      .input(z.object({ feedbackId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        // Get feedback item
        const { data: item, error } = await getForsuredAdmin('feedback_items')
          .select(`
            id,
            user_id,
            type,
            status,
            subject,
            source_url,
            assigned_to,
            user_archived_at,
            created_at,
            updated_at
          `)
          .eq('id', input.feedbackId)
          .single()

        if (error || !item) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Feedback not found',
          })
        }

        // Get user profile
        const { data: userProfile } = await getForsuredAdmin('user_profiles')
          .select('id, name, email, company')
          .eq('id', item.user_id)
          .single()

        // Get assigned admin profile if assigned
        let assignedProfile = null
        if (item.assigned_to) {
          const { data } = await getForsuredAdmin('user_profiles')
            .select('id, name, email')
            .eq('id', item.assigned_to)
            .single()
          assignedProfile = data
        }

        // Get messages with attachments
        const { data: messages } = await getForsuredAdmin('feedback_messages')
          .select(`
            id,
            sender_id,
            sender_type,
            content,
            read_at,
            created_at
          `)
          .eq('feedback_id', input.feedbackId)
          .order('created_at', { ascending: true })

        // Get attachments
        const messageIds = messages?.map(m => m.id) || []
        const { data: attachments } = messageIds.length > 0
          ? await getForsuredAdmin('feedback_attachments')
              .select('id, message_id, file_name, file_path, file_size, mime_type')
              .in('message_id', messageIds)
          : { data: [] }

        const attachmentMap = new Map<string, typeof attachments>()
        for (const att of attachments || []) {
          const existing = attachmentMap.get(att.message_id) || []
          existing.push(att)
          attachmentMap.set(att.message_id, existing)
        }

        // Mark user messages as read
        const unreadUserMessageIds = messages
          ?.filter(m => m.sender_type === 'user' && !m.read_at)
          .map(m => m.id) || []

        if (unreadUserMessageIds.length > 0) {
          await getForsuredAdmin('feedback_messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadUserMessageIds)
        }

        // Get sender names
        const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])]
        const { data: senderProfiles } = senderIds.length > 0
          ? await getForsuredAdmin('user_profiles')
              .select('id, name')
              .in('id', senderIds)
          : { data: [] }

        const senderNameMap = new Map<string, string>()
        for (const profile of senderProfiles || []) {
          senderNameMap.set(profile.id, profile.name || 'Unknown')
        }

        return {
          ...item,
          user: userProfile,
          assignedTo: assignedProfile,
          messages: (messages || []).map(m => ({
            ...m,
            senderName: senderNameMap.get(m.sender_id) || 'Unknown',
            attachments: attachmentMap.get(m.id) || [],
          })),
        }
      }),

    /**
     * Admin reply to feedback
     */
    reply: protectedProcedure
      .input(replyInput)
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        const adminProfile = await getCurrentUserProfile(ctx.userId)

        // Get feedback item
        const { data: item, error: itemError } = await getForsuredAdmin('feedback_items')
          .select('id, user_id, subject, assigned_to, status')
          .eq('id', input.feedbackId)
          .single()

        if (itemError || !item) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Feedback not found',
          })
        }

        // Create message
        const { data: message, error: messageError } = await getForsuredAdmin('feedback_messages')
          .insert({
            feedback_id: input.feedbackId,
            sender_id: adminProfile.id,
            sender_type: 'admin',
            content: input.content,
          })
          .select('id')
          .single()

        if (messageError || !message) {
          console.error('[Feedback] Error creating admin reply:', messageError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send reply',
          })
        }

        // Create attachments if provided
        if (input.attachments && input.attachments.length > 0) {
          const attachmentRecords = input.attachments.map(att => ({
            message_id: message.id,
            file_name: att.fileName,
            file_path: att.filePath,
            file_size: att.fileSize || null,
            mime_type: att.mimeType || null,
          }))

          await getForsuredAdmin('feedback_attachments').insert(attachmentRecords)
        }

        // Auto-claim if unassigned
        if (!item.assigned_to) {
          await getForsuredAdmin('feedback_items')
            .update({ assigned_to: adminProfile.id })
            .eq('id', input.feedbackId)
        }

        // Update status to in_progress if currently open
        if (item.status === 'open') {
          await getForsuredAdmin('feedback_items')
            .update({ status: 'in_progress' })
            .eq('id', input.feedbackId)
        }

        // Get user's scaffald_user_id for notification
        const { data: userProfile } = await getForsuredAdmin('user_profiles')
          .select('scaffald_user_id')
          .eq('id', item.user_id)
          .single()

        // Create notification for user
        if (userProfile?.scaffald_user_id) {
          await createUserNotification({
            userId: userProfile.scaffald_user_id,
            feedbackId: input.feedbackId,
            feedbackSubject: item.subject,
          })
        }

        return { messageId: message.id }
      }),

    /**
     * Claim an unassigned feedback item
     */
    claim: protectedProcedure
      .input(z.object({ feedbackId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        const adminProfile = await getCurrentUserProfile(ctx.userId)

        // Check if already assigned
        const { data: item } = await getForsuredAdmin('feedback_items')
          .select('id, assigned_to')
          .eq('id', input.feedbackId)
          .single()

        if (!item) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Feedback not found',
          })
        }

        if (item.assigned_to) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Feedback is already assigned',
          })
        }

        // Claim it
        await getForsuredAdmin('feedback_items')
          .update({ assigned_to: adminProfile.id })
          .eq('id', input.feedbackId)

        return { success: true }
      }),

    /**
     * Reassign feedback to another admin
     */
    reassign: protectedProcedure
      .input(adminReassignInput)
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        const adminProfile = await getCurrentUserProfile(ctx.userId)

        // Get feedback item
        const { data: item } = await getForsuredAdmin('feedback_items')
          .select('id, subject')
          .eq('id', input.feedbackId)
          .single()

        if (!item) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Feedback not found',
          })
        }

        // Get new assignee profile
        const { data: newAssignee } = await getForsuredAdmin('user_profiles')
          .select('id, name, email, user_type')
          .eq('id', input.assignToUserId)
          .single()

        if (!newAssignee || newAssignee.user_type !== 'admin') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid assignee - must be an admin user',
          })
        }

        // Update assignment
        await getForsuredAdmin('feedback_items')
          .update({ assigned_to: input.assignToUserId })
          .eq('id', input.feedbackId)

        // Add system message about reassignment
        await getForsuredAdmin('feedback_messages')
          .insert({
            feedback_id: input.feedbackId,
            sender_id: adminProfile.id,
            sender_type: 'admin',
            content: `[System] Reassigned from ${adminProfile.name || 'Admin'} to ${newAssignee.name || 'Admin'}`,
          })

        // Send email to new assignee
        if (newAssignee.email) {
          const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173'
          const feedbackUrl = `${baseUrl}/admin/feedback?id=${input.feedbackId}`

          try {
            await sendEmail({
              to: newAssignee.email,
              subject: `Feedback assigned to you: ${item.subject}`,
              html: buildReassignmentEmailHtml({
                fromAdminName: adminProfile.name || 'An admin',
                subject: item.subject,
                feedbackUrl,
              }),
            })
          } catch (emailError) {
            console.error('[Feedback] Failed to send reassignment email:', emailError)
            // Don't fail the operation
          }
        }

        return { success: true }
      }),

    /**
     * Update feedback status
     */
    updateStatus: protectedProcedure
      .input(adminUpdateStatusInput)
      .mutation(async ({ input, ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        await getForsuredAdmin('feedback_items')
          .update({ status: input.status })
          .eq('id', input.feedbackId)

        return { success: true }
      }),

    /**
     * Get stats for admin header badge
     */
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        const adminProfile = await getCurrentUserProfile(ctx.userId)

        // Count unassigned items
        const { count: unassignedCount } = await getForsuredAdmin('feedback_items')
          .select('id', { count: 'exact', head: true })
          .is('assigned_to', null)
          .neq('status', 'archived')

        // Get my assigned items
        const { data: myItems } = await getForsuredAdmin('feedback_items')
          .select('id')
          .eq('assigned_to', adminProfile.id)
          .neq('status', 'archived')

        const myItemIds = myItems?.map(i => i.id) || []

        // Count unread user messages on my items
        let myUnreadCount = 0
        if (myItemIds.length > 0) {
          const { count } = await getForsuredAdmin('feedback_messages')
            .select('id', { count: 'exact', head: true })
            .in('feedback_id', myItemIds)
            .eq('sender_type', 'user')
            .is('read_at', null)

          myUnreadCount = count || 0
        }

        return {
          unassignedCount: unassignedCount || 0,
          myUnreadCount,
          totalBadge: (unassignedCount || 0) + myUnreadCount,
        }
      }),

    /**
     * Get list of admin users for reassignment
     */
    getAdminUsers: protectedProcedure
      .query(async ({ ctx }) => {
        const isAdmin = await isUserAdmin(ctx.userId)
        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          })
        }

        return getAdminUsers()
      }),
  }),
})
