/**
 * Generic Invitations Router
 * REQ-128: Flexible Invitation System
 *
 * tRPC router for managing rule-based invitations that handles all ForSured
 * relationship types with constraint checking and referral tracking.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { invitationService } from '../../../lib/invitations/invitationService'
import { sendEmail } from '../../../lib/email/emailConfig'

/**
 * Build invitation email HTML
 */
function buildInvitationEmailHtml(params: {
  inviterName: string
  inviterOrganization?: string
  targetRole: string
  personalMessage?: string
  acceptUrl: string
  declineUrl: string
  projectName?: string
}): string {
  const personalMessageSection = params.personalMessage
    ? `
      <div style="background: #f0f7ff; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">
          Personal message from ${params.inviterName}:
        </p>
        <p style="margin: 0; font-style: italic; color: #374151;">
          "${params.personalMessage}"
        </p>
      </div>
    `
    : ''

  const projectSection = params.projectName
    ? `<p>For project: <strong>${params.projectName}</strong></p>`
    : ''

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e40af; margin-bottom: 24px;">You've Been Invited</h2>

      <p style="font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>${params.inviterName}</strong>${params.inviterOrganization ? ` from ${params.inviterOrganization}` : ''}
        has invited you to join ForSured as a <strong>${params.targetRole}</strong>.
      </p>

      ${projectSection}
      ${personalMessageSection}

      <div style="margin: 32px 0; text-align: center;">
        <a href="${params.acceptUrl}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-right: 12px; font-weight: 500;">
          Accept Invitation
        </a>
        <a href="${params.declineUrl}"
           style="display: inline-block; padding: 12px 24px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Decline
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        If you don't have a ForSured account yet, you'll be prompted to create one when you accept.
      </p>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 12px; color: #9ca3af;">
        This invitation was sent by ForSured. If you did not expect this invitation, you can safely ignore it.
      </p>
    </div>
  `
}

/**
 * Generic Invitations tRPC Router
 */
export const genericInvitationsRouter = createTRPCRouter({
  /**
   * Get all active invitation rules
   */
  getRules: protectedProcedure.query(async () => {
    return invitationService.getRules()
  }),

  /**
   * Get invitation rules available for a specific source role
   */
  getRulesForRole: protectedProcedure
    .input(z.object({ sourceRole: z.string() }))
    .query(async ({ input }) => {
      return invitationService.getRulesForRole(input.sourceRole)
    }),

  /**
   * Check if a constraint would be violated
   */
  checkConstraint: protectedProcedure
    .input(
      z.object({
        ruleId: z.string().uuid(),
        inviteeEmail: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      return invitationService.checkConstraint(input.ruleId, input.inviteeEmail)
    }),

  /**
   * Create a new invitation
   */
  create: protectedProcedure
    .input(
      z.object({
        ruleId: z.string().uuid(),
        inviteeEmail: z.string().email(),
        inviteeName: z.string().max(200).optional(),
        personalMessage: z.string().max(1000).optional(),
        projectId: z.string().uuid().optional(),
        expiresInDays: z.number().min(1).max(90).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invitation = await invitationService.create(
        input,
        ctx.userId,
        ctx.organizationId || undefined
      )

      // Get rule details for email
      const rule = await invitationService.getRule(input.ruleId)
      if (!rule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rule not found' })
      }

      // Send invitation email
      const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173'
      const acceptUrl = `${baseUrl}/invite/${invitation.referral_code}?action=accept`
      const declineUrl = `${baseUrl}/invite/${invitation.referral_code}?action=decline`

      try {
        await sendEmail({
          to: input.inviteeEmail,
          subject: `You've been invited to ForSured`,
          html: buildInvitationEmailHtml({
            inviterName: ctx.session?.user?.email || 'A ForSured user',
            targetRole: rule.target_role,
            personalMessage: input.personalMessage,
            acceptUrl,
            declineUrl,
          }),
          metadata: {
            invitationId: invitation.id,
            referralCode: invitation.referral_code,
          },
        })

        // Track that email was sent
        await invitationService.trackEmailEvent(invitation.id, 'sent')
      } catch (emailError) {
        console.error('[genericInvitations] Failed to send email:', emailError)
        // Don't fail the invitation creation if email fails
      }

      return invitation
    }),

  /**
   * Get pending invitations for the current user (by their email)
   */
  getPending: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.session?.user?.email
    if (!userEmail) {
      return []
    }
    return invitationService.getPendingForEmail(userEmail)
  }),

  /**
   * Get invitations sent by the current user
   */
  getSent: protectedProcedure.query(async ({ ctx }) => {
    return invitationService.getSentByUser(ctx.userId)
  }),

  /**
   * Get an invitation by ID (for detail view)
   */
  getById: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .query(async ({ input }) => {
      const invitation = await invitationService.getById(input.invitationId)
      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' })
      }
      return invitation
    }),

  /**
   * Get invitation by referral code (public, for landing pages)
   * Returns limited info for unauthenticated users
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      const invitation = await invitationService.getByReferralCode(input.code)
      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found or expired' })
      }

      // Return limited info for public access
      return {
        id: invitation.id,
        status: invitation.status,
        inviter: invitation.inviter
          ? {
              full_name: invitation.inviter.full_name,
            }
          : undefined,
        personal_message: invitation.personal_message,
        rule: invitation.rule
          ? {
              name: invitation.rule.name,
              target_role: invitation.rule.target_role,
              source_role: invitation.rule.source_role,
            }
          : undefined,
        constraint_blocked: invitation.constraint_blocked,
        constraint_reason: invitation.constraint_reason,
      }
    }),

  /**
   * Accept an invitation
   */
  accept: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return invitationService.accept(input.invitationId, ctx.userId)
    }),

  /**
   * Decline an invitation
   */
  decline: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await invitationService.decline(input.invitationId, ctx.userId, input.reason)
      return { success: true }
    }),

  /**
   * Get current user's relationships
   */
  getRelationships: protectedProcedure
    .input(z.object({ type: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return invitationService.getRelationships(ctx.userId, input?.type)
    }),

  /**
   * Remove a relationship
   */
  removeRelationship: protectedProcedure
    .input(z.object({ relationshipId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await invitationService.removeRelationship(input.relationshipId, ctx.userId)
      return { success: true }
    }),
})
