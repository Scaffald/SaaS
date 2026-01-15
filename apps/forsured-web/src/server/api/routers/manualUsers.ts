/**
 * Manual Users tRPC Router
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-3: Implement manual user management tRPC router
 *
 * Provides CRUD operations for manually-created placeholder users
 * and integration with the relationship invitation system.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { forsured } from '../../../lib/supabase'
import { createRelationshipInvitation, type ConnectionType } from '../../../lib/relationshipInvitations'
import { sendEmail } from '../../../lib/email/emailConfig'

/**
 * User types that can create manual users
 */
const ALLOWED_CREATOR_TYPES = ['manager', 'broker'] as const

/**
 * User types that can be manually created
 */
const ALLOWED_MANUAL_USER_TYPES = ['contractor', 'broker', 'manager'] as const

/**
 * Input validation schemas
 */
const createManualUserInput = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  userType: z.enum(ALLOWED_MANUAL_USER_TYPES),
  sendInvitation: z.boolean().default(false),
})

const updateManualUserInput = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
})

const sendInvitationInput = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  updateProfile: z.boolean().default(true),
})

/**
 * Build invitation email HTML for manual users
 */
function buildManualUserInvitationEmailHtml(params: {
  inviterName: string
  inviterCompany?: string
  inviteeName: string
  targetRole: string
  acceptUrl: string
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e40af; margin-bottom: 24px;">You've Been Invited to ForSured</h2>

      <p style="font-size: 16px; color: #374151; line-height: 1.6;">
        Hi ${params.inviteeName},
      </p>

      <p style="font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>${params.inviterName}</strong>${params.inviterCompany ? ` from ${params.inviterCompany}` : ''}
        has added you to their network as a <strong>${params.targetRole}</strong> and would like you to join ForSured.
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${params.acceptUrl}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Create Your Account
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        By creating an account, you'll be able to connect with ${params.inviterName} and manage your compliance requirements.
      </p>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 12px; color: #9ca3af;">
        This invitation was sent by ForSured. If you did not expect this invitation, you can safely ignore it.
      </p>
    </div>
  `
}

/**
 * Get the current user's profile
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
 * Manual Users tRPC Router
 */
export const manualUsersRouter = createTRPCRouter({
  /**
   * Create a manually-added user
   */
  create: protectedProcedure
    .input(createManualUserInput)
    .mutation(async ({ input, ctx }) => {
      // Get current user's profile to validate permissions and get creator info
      const creatorProfile = await getCurrentUserProfile(ctx.userId)

      // Validate that the creator is allowed to create manual users
      if (!ALLOWED_CREATOR_TYPES.includes(creatorProfile.user_type as typeof ALLOWED_CREATOR_TYPES[number])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers and brokers can create manual users',
        })
      }

      // Check for duplicate email if provided
      if (input.email) {
        const { data: existingUser } = await forsured('user_profiles')
          .select('id, name, is_manually_created')
          .eq('email', input.email.toLowerCase().trim())
          .single()

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: existingUser.is_manually_created
              ? `A manual user with email ${input.email} already exists`
              : `A registered user with email ${input.email} already exists. Consider sending them an invitation instead.`,
          })
        }
      }

      // Create the manual user profile
      const { data: manualUser, error: createError } = await forsured('user_profiles')
        .insert({
          user_type: input.userType,
          is_manually_created: true,
          created_by_user_id: creatorProfile.id,
          name: input.name,
          email: input.email?.toLowerCase().trim() || null,
          phone: input.phone || null,
          company: input.company || null,
          onboarding_completed: false,
          onboarding_step: 0,
        })
        .select('id, name, email, phone, company, user_type, is_manually_created, created_at')
        .single()

      if (createError || !manualUser) {
        console.error('[ManualUsers] Error creating manual user:', createError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create manual user',
        })
      }

      console.log('[ManualUsers] Manual user created:', manualUser.id)

      let invitationId: string | null = null

      // Send invitation if requested and email is provided
      if (input.sendInvitation && input.email && ctx.organizationId) {
        try {
          // Create relationship invitation linked to manual user
          const invitation = await createRelationshipInvitation({
            inviterOrgId: ctx.organizationId,
            inviterUserId: ctx.userId,
            inviterType: creatorProfile.user_type as ConnectionType,
            inviteeEmail: input.email,
            inviteeName: input.name,
            inviteeCompany: input.company || undefined,
            inviteePhone: input.phone || undefined,
            inviteeType: input.userType as ConnectionType,
            connectionMethod: 'email',
          })

          // Link the invitation to the manual user
          await forsured('relationship_invitations')
            .update({ manual_user_id: manualUser.id })
            .eq('id', invitation.id)

          invitationId = invitation.id

          // Send invitation email
          const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173'
          const acceptUrl = `${baseUrl}/invite/${invitation.relationship_code}?action=accept`

          await sendEmail({
            to: input.email,
            subject: `${creatorProfile.name || 'A ForSured user'} invited you to ForSured`,
            html: buildManualUserInvitationEmailHtml({
              inviterName: creatorProfile.name || 'A ForSured user',
              inviterCompany: creatorProfile.company || undefined,
              inviteeName: input.name,
              targetRole: input.userType,
              acceptUrl,
            }),
            metadata: {
              invitationId: invitation.id,
              manualUserId: manualUser.id,
            },
          })

          console.log('[ManualUsers] Invitation sent to:', input.email)
        } catch (inviteError) {
          console.error('[ManualUsers] Failed to send invitation:', inviteError)
          // Don't fail the creation if invitation fails
        }
      }

      return {
        user: manualUser,
        invitationId,
      }
    }),

  /**
   * Update a manually-added user
   */
  update: protectedProcedure
    .input(updateManualUserInput)
    .mutation(async ({ input, ctx }) => {
      const creatorProfile = await getCurrentUserProfile(ctx.userId)

      // Verify the manual user exists and was created by the current user
      const { data: manualUser, error: fetchError } = await forsured('user_profiles')
        .select('id, is_manually_created, created_by_user_id, email')
        .eq('id', input.userId)
        .single()

      if (fetchError || !manualUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Manual user not found',
        })
      }

      if (!manualUser.is_manually_created) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update a registered user profile',
        })
      }

      if (manualUser.created_by_user_id !== creatorProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update manual users you created',
        })
      }

      // Check for duplicate email if updating
      if (input.email && input.email !== manualUser.email) {
        const { data: existingUser } = await forsured('user_profiles')
          .select('id')
          .eq('email', input.email.toLowerCase().trim())
          .neq('id', input.userId)
          .single()

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A user with email ${input.email} already exists`,
          })
        }
      }

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (input.name !== undefined) updateData.name = input.name
      if (input.email !== undefined) updateData.email = input.email?.toLowerCase().trim() || null
      if (input.phone !== undefined) updateData.phone = input.phone || null
      if (input.company !== undefined) updateData.company = input.company || null

      const { data: updatedUser, error: updateError } = await forsured('user_profiles')
        .update(updateData)
        .eq('id', input.userId)
        .select('id, name, email, phone, company, user_type, is_manually_created, updated_at')
        .single()

      if (updateError || !updatedUser) {
        console.error('[ManualUsers] Error updating manual user:', updateError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update manual user',
        })
      }

      console.log('[ManualUsers] Manual user updated:', updatedUser.id)

      return { user: updatedUser }
    }),

  /**
   * Send invitation to a manual user
   */
  sendInvitation: protectedProcedure
    .input(sendInvitationInput)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Organization ID is required to send invitations',
        })
      }

      const creatorProfile = await getCurrentUserProfile(ctx.userId)

      // Verify the manual user exists and was created by the current user
      const { data: manualUser, error: fetchError } = await forsured('user_profiles')
        .select('id, name, email, phone, company, user_type, is_manually_created, created_by_user_id')
        .eq('id', input.userId)
        .single()

      if (fetchError || !manualUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Manual user not found',
        })
      }

      if (!manualUser.is_manually_created) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot send invitation to a registered user',
        })
      }

      if (manualUser.created_by_user_id !== creatorProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only send invitations to manual users you created',
        })
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await forsured('relationship_invitations')
        .select('id, status')
        .eq('manual_user_id', input.userId)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An invitation is already pending for this user',
        })
      }

      // Update the manual user's email if requested
      if (input.updateProfile && input.email !== manualUser.email) {
        const { error: updateError } = await forsured('user_profiles')
          .update({
            email: input.email.toLowerCase().trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.userId)

        if (updateError) {
          console.error('[ManualUsers] Error updating email:', updateError)
        }
      }

      // Create the relationship invitation
      const invitation = await createRelationshipInvitation({
        inviterOrgId: ctx.organizationId,
        inviterUserId: ctx.userId,
        inviterType: creatorProfile.user_type as ConnectionType,
        inviteeEmail: input.email,
        inviteeName: manualUser.name || undefined,
        inviteeCompany: manualUser.company || undefined,
        inviteePhone: manualUser.phone || undefined,
        inviteeType: manualUser.user_type as ConnectionType,
        connectionMethod: 'email',
      })

      // Link the invitation to the manual user
      await forsured('relationship_invitations')
        .update({ manual_user_id: manualUser.id })
        .eq('id', invitation.id)

      // Send invitation email
      const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173'
      const acceptUrl = `${baseUrl}/invite/${invitation.relationship_code}?action=accept`

      try {
        await sendEmail({
          to: input.email,
          subject: `${creatorProfile.name || 'A ForSured user'} invited you to ForSured`,
          html: buildManualUserInvitationEmailHtml({
            inviterName: creatorProfile.name || 'A ForSured user',
            inviterCompany: creatorProfile.company || undefined,
            inviteeName: manualUser.name || 'there',
            targetRole: manualUser.user_type,
            acceptUrl,
          }),
          metadata: {
            invitationId: invitation.id,
            manualUserId: manualUser.id,
          },
        })

        console.log('[ManualUsers] Invitation sent to:', input.email)
      } catch (emailError) {
        console.error('[ManualUsers] Failed to send email:', emailError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send invitation email',
        })
      }

      return {
        invitationId: invitation.id,
        emailSent: true,
      }
    }),

  /**
   * Delete a manual user
   */
  delete: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const creatorProfile = await getCurrentUserProfile(ctx.userId)

      // Verify the manual user exists and was created by the current user
      const { data: manualUser, error: fetchError } = await forsured('user_profiles')
        .select('id, is_manually_created, created_by_user_id')
        .eq('id', input.userId)
        .single()

      if (fetchError || !manualUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Manual user not found',
        })
      }

      if (!manualUser.is_manually_created) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete a registered user profile',
        })
      }

      if (manualUser.created_by_user_id !== creatorProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete manual users you created',
        })
      }

      // Delete the manual user (cascade will handle related records)
      const { error: deleteError } = await forsured('user_profiles')
        .delete()
        .eq('id', input.userId)

      if (deleteError) {
        console.error('[ManualUsers] Error deleting manual user:', deleteError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete manual user',
        })
      }

      console.log('[ManualUsers] Manual user deleted:', input.userId)

      return { success: true }
    }),

  /**
   * List manual users created by the current user
   */
  list: protectedProcedure
    .input(
      z.object({
        userType: z.enum(ALLOWED_MANUAL_USER_TYPES).optional(),
        includeInvited: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const creatorProfile = await getCurrentUserProfile(ctx.userId)

      // Build query for manual users created by current user
      let query = forsured('user_profiles')
        .select(`
          id,
          name,
          email,
          phone,
          company,
          user_type,
          is_manually_created,
          created_at,
          updated_at
        `)
        .eq('is_manually_created', true)
        .eq('created_by_user_id', creatorProfile.id)
        .order('created_at', { ascending: false })

      if (input?.userType) {
        query = query.eq('user_type', input.userType)
      }

      const { data: manualUsers, error } = await query

      if (error) {
        console.error('[ManualUsers] Error fetching manual users:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch manual users',
        })
      }

      if (!manualUsers || manualUsers.length === 0) {
        return []
      }

      // Get invitation status for each manual user
      const userIds = manualUsers.map(u => u.id)
      const { data: invitations } = await forsured('relationship_invitations')
        .select('manual_user_id, status, invited_at, accepted_at, connected_at')
        .in('manual_user_id', userIds)
        .order('invited_at', { ascending: false })

      // Build a map of user ID to latest invitation
      const invitationMap = new Map<string, {
        status: string
        invitedAt: string | null
        acceptedAt: string | null
        connectedAt: string | null
      }>()

      for (const inv of invitations || []) {
        if (inv.manual_user_id && !invitationMap.has(inv.manual_user_id)) {
          invitationMap.set(inv.manual_user_id, {
            status: inv.status,
            invitedAt: inv.invited_at,
            acceptedAt: inv.accepted_at,
            connectedAt: inv.connected_at,
          })
        }
      }

      // Combine manual users with invitation status
      const result = manualUsers.map(user => ({
        ...user,
        invitation: invitationMap.get(user.id) || null,
      }))

      // Filter out invited users if requested
      if (input?.includeInvited === false) {
        return result.filter(u => !u.invitation)
      }

      return result
    }),

  /**
   * Get a single manual user by ID
   */
  getById: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const creatorProfile = await getCurrentUserProfile(ctx.userId)

      const { data: manualUser, error } = await forsured('user_profiles')
        .select(`
          id,
          name,
          email,
          phone,
          company,
          user_type,
          is_manually_created,
          created_by_user_id,
          created_at,
          updated_at
        `)
        .eq('id', input.userId)
        .single()

      if (error || !manualUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Manual user not found',
        })
      }

      if (!manualUser.is_manually_created) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This is not a manual user',
        })
      }

      if (manualUser.created_by_user_id !== creatorProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view manual users you created',
        })
      }

      // Get invitation status
      const { data: invitation } = await forsured('relationship_invitations')
        .select('id, status, relationship_code, invited_at, accepted_at, connected_at')
        .eq('manual_user_id', input.userId)
        .order('invited_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...manualUser,
        invitation: invitation || null,
      }
    }),
})
