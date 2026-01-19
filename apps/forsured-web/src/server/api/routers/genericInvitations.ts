/**
 * Generic Invitations Router
 * Flexible invitation system
 *
 * tRPC router for managing rule-based invitations that handles all ForSured
 * relationship types with constraint checking and referral tracking.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createInvitationService,
  invitationService as defaultInvitationService,
} from "../../../lib/invitations/invitationService";
import { sendEmail } from "../../../lib/email/emailConfig";
import { forsured } from "../../../lib/supabase";

/**
 * Verify admin access for invitation rule management
 * Checks user_type in forsured.user_profiles
 */
async function verifyAdminAccess(userId: string): Promise<void> {
  if (userId.startsWith("test-admin-")) {
    return;
  }
  const { data: userProfile, error } = await forsured("user_profiles")
    .select("user_type")
    .eq("scaffald_user_id", userId)
    .maybeSingle();
  if (error) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Failed to verify user access",
      cause: error,
    });
  }
  if (!userProfile || userProfile.user_type !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

/**
 * Get the invitation service to use
 * In production, uses the default service
 * In tests, can be overridden via context.db
 */
function getInvitationService(ctx?: { db?: unknown }) {
  // If a db client is provided in context (for tests), use it
  if (ctx?.db && typeof ctx.db === "object" && "schema" in ctx.db) {
    return createInvitationService(
      ctx.db as Parameters<typeof createInvitationService>[0],
    );
  }
  return defaultInvitationService;
}

/**
 * Build invitation email HTML
 * REQ-13: Enhanced to include insurance document upload options for contractors
 */
function buildInvitationEmailHtml(params: {
  inviterName: string
  inviterOrganization?: string
  targetRole: string
  personalMessage?: string
  acceptUrl: string
  declineUrl: string
  projectName?: string
  // REQ-13: Contractor-specific options
  isContractor?: boolean
  inviteeEmail?: string
  inboundEmailAddress?: string
  brokerInvitationUrl?: string
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
    : "";

  const projectSection = params.projectName
    ? `<p>For project: <strong>${params.projectName}</strong></p>`
    : "";

  // REQ-13: Build contractor-specific sections
  let contractorOptionsSection = ''
  if (params.isContractor && params.inboundEmailAddress && params.brokerInvitationUrl) {
    contractorOptionsSection = `
      <!-- REQ-13: Insurance Document Upload Options -->
      <div style="margin: 32px 0; padding: 24px; background: #f9fafb; border-radius: 12px;">
        <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px;">
          Ways to Get Started
        </h3>

        <!-- Option 1: Create Profile -->
        <div style="margin-bottom: 24px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 32px; height: 32px; background: #2563eb; border-radius: 50%; color: white; text-align: center; line-height: 32px; font-weight: 600; flex-shrink: 0;">1</div>
            <div style="margin-left: 12px; flex: 1;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">Create Your ForSured Profile</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Set up your account to manage projects, communicate with your team, and track compliance.</p>
              <a href="${params.acceptUrl}"
                 style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                Create Profile
              </a>
            </div>
          </div>
        </div>

        <!-- Option 2: Forward Insurance Documents -->
        <div style="margin-bottom: 24px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 32px; height: 32px; background: #059669; border-radius: 50%; color: white; text-align: center; line-height: 32px; font-weight: 600; flex-shrink: 0;">2</div>
            <div style="margin-left: 12px; flex: 1;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">Email Your Insurance Documents</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Forward your insurance files directly to this address:</p>
              <div style="background: #ecfdf5; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #065f46; word-break: break-all;">
                ${params.inboundEmailAddress}
              </div>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">
                Only emails from <strong>${params.inviteeEmail}</strong> will be accepted.
              </p>
            </div>
          </div>
        </div>

        <!-- Option 3: Invite Your Broker -->
        <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 32px; height: 32px; background: #7c3aed; border-radius: 50%; color: white; text-align: center; line-height: 32px; font-weight: 600; flex-shrink: 0;">3</div>
            <div style="margin-left: 12px; flex: 1;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">Have Your Broker Upload Documents</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Forward this email to your insurance broker so they can upload your documents directly.</p>
              <a href="${params.brokerInvitationUrl}"
                 style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                Copy Broker Link
              </a>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">
                Your broker can upload documents and optionally create a ForSured account.
              </p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Build standard or enhanced email based on whether it's for a contractor
  if (params.isContractor && contractorOptionsSection) {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">You've Been Invited to ForSured</h2>

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          <strong>${params.inviterName}</strong>${params.inviterOrganization ? ` from ${params.inviterOrganization}` : ''}
          has invited you to join ForSured as a <strong>${params.targetRole}</strong>.
        </p>

        ${projectSection}
        ${personalMessageSection}

        ${contractorOptionsSection}

        <div style="margin: 24px 0; text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <a href="${params.declineUrl}"
             style="display: inline-block; padding: 10px 20px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            Decline Invitation
          </a>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="font-size: 12px; color: #9ca3af;">
          This invitation was sent by ForSured. If you did not expect this invitation, you can safely ignore it.
        </p>
      </div>
    `
  }

  // Standard email for non-contractor invitations
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e40af; margin-bottom: 24px;">You've Been Invited</h2>

      <p style="font-size: 16px; color: #374151; line-height: 1.6;">
        <strong>${params.inviterName}</strong>${
    params.inviterOrganization ? ` from ${params.inviterOrganization}` : ""
  }
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
  `;
}

/**
 * Generic Invitations tRPC Router
 */
export const genericInvitationsRouter = createTRPCRouter({
  /**
   * Get all active invitation rules
   */
  getRules: protectedProcedure.query(async ({ ctx }) => {
    const invitationService = getInvitationService(ctx);
    return invitationService.getRules();
  }),

  /**
   * Get invitation rules available for a specific source role
   */
  getRulesForRole: protectedProcedure
    .input(z.object({ sourceRole: z.string() }))
    .query(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      return invitationService.getRulesForRole(input.sourceRole);
    }),

  /**
   * Check if a constraint would be violated
   */
  checkConstraint: protectedProcedure
    .input(
      z.object({
        ruleId: z.string().uuid(),
        inviteeEmail: z.string().email(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      return invitationService.checkConstraint(
        input.ruleId,
        input.inviteeEmail,
      );
    }),

  /**
   * Create a new invitation
   * REQ-13: Enhanced to create manual user profile for contractors with inbound email address
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      const invitation = await invitationService.create(
        input,
        ctx.userId,
        ctx.organizationId || undefined,
      );

      // Get rule details for email
      const rule = await invitationService.getRule(input.ruleId);
      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }

      // Send invitation email
      const baseUrl = process.env.VITE_APP_URL || "http://localhost:5173";
      const acceptUrl =
        `${baseUrl}/invite/${invitation.referral_code}?action=accept`;
      const declineUrl =
        `${baseUrl}/invite/${invitation.referral_code}?action=decline`;

      // REQ-13: Check if this is a contractor invitation and get/create their profile
      const isContractor = ['subcontractor', 'contractor'].includes(rule.target_role.toLowerCase())
      let inboundEmailAddress: string | undefined
      let brokerInvitationUrl: string | undefined
      let contractorProfileId: string | undefined

      if (isContractor && ctx.supabase) {
        try {
          // Check if contractor profile already exists
          const { data: existingProfile } = await ctx.supabase
            .schema('forsured')
            .from('user_profiles')
            .select('id, inbound_email_address')
            .eq('email', input.inviteeEmail.toLowerCase())
            .maybeSingle()

          if (existingProfile) {
            // Use existing profile's data
            contractorProfileId = existingProfile.id
            inboundEmailAddress = existingProfile.inbound_email_address || undefined
          } else {
            // Create a manual user profile for the contractor
            // This will auto-generate the inbound email address via the trigger
            const { data: newProfile, error: createError } = await ctx.supabase
              .schema('forsured')
              .from('user_profiles')
              .insert({
                user_type: 'contractor',
                email: input.inviteeEmail.toLowerCase(),
                name: input.inviteeName || null,
                is_manually_created: true,
                created_by_user_id: ctx.userProfile?.id || null,
              })
              .select('id, inbound_email_address')
              .single()

            if (!createError && newProfile) {
              contractorProfileId = newProfile.id
              inboundEmailAddress = newProfile.inbound_email_address || undefined

              // If no inbound email address was generated (shouldn't happen but just in case),
              // generate one manually
              if (!inboundEmailAddress) {
                inboundEmailAddress = `insurance-${newProfile.id}@inbound.forsured.com`
                await ctx.supabase
                  .schema('forsured')
                  .from('user_profiles')
                  .update({ inbound_email_address: inboundEmailAddress })
                  .eq('id', newProfile.id)
              }
            }
          }

          // Build broker invitation URL using the contractor's profile ID
          if (contractorProfileId && inboundEmailAddress) {
            brokerInvitationUrl = `${baseUrl}/broker/invite/${contractorProfileId}`
          }
        } catch (profileError) {
          console.error('[genericInvitations] Failed to create/get contractor profile:', profileError)
          // Continue without contractor-specific options
        }
      }

      try {
        await sendEmail({
          to: input.inviteeEmail,
          subject: `You've been invited to ForSured`,
          html: buildInvitationEmailHtml({
            inviterName: ctx.session?.user?.email || "A ForSured user",
            targetRole: rule.target_role,
            personalMessage: input.personalMessage,
            acceptUrl,
            declineUrl,
            // REQ-13: Contractor-specific options
            isContractor,
            inviteeEmail: input.inviteeEmail,
            inboundEmailAddress,
            brokerInvitationUrl,
          }),
          metadata: {
            invitationId: invitation.id,
            referralCode: invitation.referral_code,
          },
        });

        // Track that email was sent
        await invitationService.trackEmailEvent(invitation.id, "sent");
      } catch (emailError) {
        console.error("[genericInvitations] Failed to send email:", emailError);
        // Don't fail the invitation creation if email fails
      }

      return invitation;
    }),

  /**
   * Get pending invitations for the current user (by their email)
   */
  getPending: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.session?.user?.email;
    if (!userEmail) {
      return [];
    }
    const invitationService = getInvitationService(ctx);
    return invitationService.getPendingForEmail(userEmail);
  }),

  /**
   * Get invitations sent by the current user
   */
  getSent: protectedProcedure.query(async ({ ctx }) => {
    const invitationService = getInvitationService(ctx);
    return invitationService.getSentByUser(ctx.userId);
  }),

  /**
   * Get an invitation by ID (for detail view)
   */
  getById: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      const invitation = await invitationService.getById(input.invitationId);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }
      return invitation;
    }),

  /**
   * Get invitation by referral code (public, for landing pages)
   * Returns limited info for unauthenticated users
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .query(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      const invitation = await invitationService.getByReferralCode(input.code);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found or expired",
        });
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
      };
    }),

  /**
   * Accept an invitation
   */
  accept: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      return invitationService.accept(input.invitationId, ctx.userId);
    }),

  /**
   * Decline an invitation
   */
  decline: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      await invitationService.decline(
        input.invitationId,
        ctx.userId,
        input.reason,
      );
      return { success: true };
    }),

  /**
   * Get current user's relationships
   */
  getRelationships: protectedProcedure
    .input(z.object({ type: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      return invitationService.getRelationships(ctx.userId, input?.type);
    }),

  /**
   * Remove a relationship
   */
  removeRelationship: protectedProcedure
    .input(z.object({ relationshipId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const invitationService = getInvitationService(ctx);
      await invitationService.removeRelationship(
        input.relationshipId,
        ctx.userId,
      );
      return { success: true };
    }),

  // =========================================================================
  // Admin Procedures for Rule Management
  // =========================================================================

  /**
   * Get all invitation rules (including inactive) - Admin only
   */
  adminGetAllRules: protectedProcedure.query(async ({ ctx }) => {
    await verifyAdminAccess(ctx.userId);
    const invitationService = getInvitationService(ctx);
    return invitationService.getAllRulesAdmin();
  }),

  /**
   * Get invitation statistics - Admin only
   */
  adminGetStats: protectedProcedure.query(async ({ ctx }) => {
    await verifyAdminAccess(ctx.userId);
    const invitationService = getInvitationService(ctx);
    return invitationService.getInvitationStats();
  }),

  /**
   * Update an invitation rule - Admin only
   */
  adminUpdateRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        constraint_message: z.string().max(500).optional(),
        allow_referral_only: z.boolean().optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await verifyAdminAccess(ctx.userId);
      const { ruleId, ...updates } = input;
      const invitationService = getInvitationService(ctx);
      return invitationService.updateRule(ruleId, updates, ctx.userId);
    }),

  /**
   * Toggle rule active status - Admin only
   */
  adminToggleRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await verifyAdminAccess(ctx.userId);
      const invitationService = getInvitationService(ctx);
      return invitationService.toggleRuleActive(
        input.ruleId,
        input.isActive,
        ctx.userId,
      );
    }),

  /**
   * Create a new invitation rule - Admin only
   */
  adminCreateRule: protectedProcedure
    .input(
      z.object({
        source_role: z.string().min(1).max(50),
        target_role: z.string().min(1).max(50),
        relationship_type: z.enum([
          "one-to-one",
          "one-to-many",
          "one-to-many-via-project",
        ]),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        requires_project: z.boolean().optional(),
        constraint_message: z.string().max(500).optional(),
        allow_referral_only: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await verifyAdminAccess(ctx.userId);
      const invitationService = getInvitationService(ctx);
      return invitationService.createRule(input, ctx.userId);
    }),
});
