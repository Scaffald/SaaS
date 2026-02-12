/**
 * Generic Invitation Service
 *
 * REQ-128: Flexible Invitation System
 *
 * Service for managing rule-based invitations that handles all ForSured
 * relationship types with constraint checking and referral tracking.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { forsured as defaultForsured } from '../supabase'
import { auditService } from '../audit/AuditService'
import type {
  CreateInvitationInput,
  Invitation,
  InvitationRule,
  InvitationWithRelations,
  ConstraintCheckResult,
  UserRelationship,
} from './types'

/**
 * Generate a unique referral code
 * Uses uppercase letters (excluding I, O, L) and numbers (excluding 0, 1)
 * for better readability
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Create an invitation service instance with an optional db client
 * @param client - Optional Supabase client (defaults to app's anon client)
 */
export function createInvitationService(client?: SupabaseClient) {
  // Schema query helper that uses the provided client or default
  const forsured = (table: string) =>
    client ? client.schema('forsured').from(table) : defaultForsured(table)

  return {
    /**
     * Get all active invitation rules
     */
    async getRules(): Promise<InvitationRule[]> {
      const { data, error } = await forsured('invitation_rules')
        .select('*')
        .eq('is_active', true)
        .order('source_role')

      if (error) throw error
      return data || []
    },

    /**
     * Get rules available for a specific user role
     */
    async getRulesForRole(sourceRole: string): Promise<InvitationRule[]> {
      const { data, error } = await forsured('invitation_rules')
        .select('*')
        .eq('source_role', sourceRole)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    },

    /**
     * Get a single rule by ID
     */
    async getRule(ruleId: string): Promise<InvitationRule | null> {
      const { data, error } = await forsured('invitation_rules')
        .select('*')
        .eq('id', ruleId)
        .single()

      if (error) return null
      return data
    },

    /**
     * Check if a relationship constraint would be violated
     */
    async checkConstraint(
      ruleId: string,
      targetEmail: string
    ): Promise<ConstraintCheckResult> {
      // Get the rule
      const rule = await this.getRule(ruleId)
      if (!rule) {
        throw new Error('Rule not found')
      }

      // Non one-to-one relationships have no constraints
      if (rule.relationship_type !== 'one-to-one') {
        return { allowed: true }
      }

      // Check if target user exists
      const { data: targetUser } = await forsured('users')
        .select('id')
        .eq('email', targetEmail.toLowerCase())
        .single()

      if (!targetUser) {
        // New user, no existing relationships
        return { allowed: true }
      }

      // Build relationship type string (e.g., 'broker_client')
      const relationshipType = `${rule.source_role}_${rule.target_role}`

      // Check for existing relationship of this type
      const { data: existingRel } = await forsured('user_relationships')
        .select(`
          id,
          source_user_id,
          status
        `)
        .eq('target_user_id', targetUser.id)
        .eq('relationship_type', relationshipType)
        .eq('status', 'active')
        .single()

      if (existingRel) {
        // Fetch the source user details
        const { data: sourceUser } = await forsured('users')
          .select('id, full_name, email')
          .eq('id', existingRel.source_user_id)
          .single()

        return {
          allowed: false,
          reason:
            rule.constraint_message ||
            `This user already has a ${rule.source_role}`,
          existingRelationship: sourceUser
            ? {
                id: existingRel.id,
                source_user: {
                  id: sourceUser.id,
                  full_name: sourceUser.full_name || 'Unknown',
                  email: sourceUser.email,
                },
              }
            : undefined,
        }
      }

      return { allowed: true }
    },

    /**
     * Create a new invitation
     */
    async create(
      input: CreateInvitationInput,
      inviterId: string,
      organizationId?: string
    ): Promise<Invitation> {
      // Check constraint first
      const constraint = await this.checkConstraint(input.ruleId, input.inviteeEmail)

      const referralCode = generateReferralCode()
      const expiresAt = input.expiresInDays
        ? new Date(
            Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000
          ).toISOString()
        : null

      const { data, error } = await forsured('generic_invitations')
        .insert({
          rule_id: input.ruleId,
          inviter_id: inviterId,
          inviter_organization_id: organizationId,
          invitee_email: input.inviteeEmail.toLowerCase().trim(),
          invitee_name: input.inviteeName,
          project_id: input.projectId,
          referral_code: referralCode,
          personal_message: input.personalMessage,
          is_referral: true,
          expires_at: expiresAt,
          constraint_blocked: !constraint.allowed,
          constraint_reason: constraint.reason,
        })
        .select()
        .single()

      if (error) throw error

      // Audit log
      await auditService.log({
        category: 'data_modification',
        action: 'generic_invitation_created',
        severity: 'medium',
        user_id: inviterId,
        resource_type: 'generic_invitation',
        resource_name: input.inviteeEmail,
        status: 'success',
        metadata: {
          invitationId: data.id,
          ruleId: input.ruleId,
          projectId: input.projectId,
          constraintBlocked: !constraint.allowed,
          referralCode,
        },
      })

      return data
    },

    /**
     * Accept an invitation
     */
    async accept(
      invitationId: string,
      acceptingUserId: string
    ): Promise<{ success: boolean; relationshipCreated: boolean }> {
      // Get invitation with rule
      const { data: invitation, error: fetchError } = await forsured(
        'generic_invitations'
      )
        .select(`
          *,
          rule:invitation_rules (*)
        `)
        .eq('id', invitationId)
        .single()

      if (fetchError || !invitation) {
        throw new Error('Invitation not found')
      }

      if (invitation.status !== 'pending') {
        throw new Error(`Cannot accept invitation with status: ${invitation.status}`)
      }

      // Update invitation status
      const { error: updateError } = await forsured('generic_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          invitee_user_id: acceptingUserId,
        })
        .eq('id', invitationId)

      if (updateError) throw updateError

      let relationshipCreated = false

      // Create relationship if not constraint-blocked
      if (!invitation.constraint_blocked && invitation.rule) {
        if (invitation.rule.relationship_type === 'one-to-many-via-project') {
          // Project-based relationship (use existing project_subcontractors table)
          if (invitation.project_id) {
            const { error: relError } = await forsured('project_subcontractors')
              .insert({
                project_id: invitation.project_id,
                subcontractor_id: acceptingUserId,
                status: 'active',
                invited_by: invitation.inviter_id,
              })

            if (!relError) relationshipCreated = true
          }
        } else {
          // User-to-user relationship
          const { error: relError } = await forsured('user_relationships')
            .insert({
              source_user_id: invitation.inviter_id,
              source_organization_id: invitation.inviter_organization_id,
              target_user_id: acceptingUserId,
              relationship_type: `${invitation.rule.source_role}_${invitation.rule.target_role}`,
              invitation_id: invitationId,
            })

          if (!relError) relationshipCreated = true
        }
      }

      // Audit log
      await auditService.log({
        category: 'data_modification',
        action: 'generic_invitation_accepted',
        severity: 'medium',
        user_id: acceptingUserId,
        resource_type: 'generic_invitation',
        resource_id: invitationId,
        status: 'success',
        metadata: {
          inviterId: invitation.inviter_id,
          relationshipCreated,
          constraintBlocked: invitation.constraint_blocked,
        },
      })

      return { success: true, relationshipCreated }
    },

    /**
     * Decline an invitation
     */
    async decline(
      invitationId: string,
      decliningUserId: string,
      reason?: string
    ): Promise<void> {
      const { error } = await forsured('generic_invitations')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          decline_reason: reason,
          invitee_user_id: decliningUserId,
        })
        .eq('id', invitationId)

      if (error) throw error

      await auditService.log({
        category: 'data_modification',
        action: 'generic_invitation_declined',
        severity: 'low',
        user_id: decliningUserId,
        resource_type: 'generic_invitation',
        resource_id: invitationId,
        status: 'success',
        metadata: { reason },
      })
    },

    /**
     * Get pending invitations for a user (by email)
     */
    async getPendingForEmail(email: string): Promise<InvitationWithRelations[]> {
      const { data, error } = await forsured('generic_invitations')
        .select(`
          *,
          rule:invitation_rules (*)
        `)
        .eq('invitee_email', email.toLowerCase())
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch inviter details separately (cross-schema join limitation)
      const invitations = data || []
      const inviterIds = [...new Set(invitations.map((inv) => inv.inviter_id))]

      if (inviterIds.length > 0) {
        const { data: inviters } = await forsured('users')
          .select('id, full_name, email')
          .in('id', inviterIds)

        const inviterMap = new Map(inviters?.map((u) => [u.id, u]) || [])

        return invitations.map((inv) => ({
          ...inv,
          inviter: inviterMap.get(inv.inviter_id),
        }))
      }

      return invitations
    },

    /**
     * Get invitations sent by a user
     */
    async getSentByUser(userId: string): Promise<InvitationWithRelations[]> {
      const { data, error } = await forsured('generic_invitations')
        .select(`
          *,
          rule:invitation_rules (*)
        `)
        .eq('inviter_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },

    /**
     * Look up invitation by referral code
     */
    async getByReferralCode(code: string): Promise<InvitationWithRelations | null> {
      const { data, error } = await forsured('generic_invitations')
        .select(`
          *,
          rule:invitation_rules (*)
        `)
        .eq('referral_code', code.toUpperCase())
        .single()

      if (error) return null

      // Fetch inviter details
      if (data?.inviter_id) {
        const { data: inviter } = await forsured('users')
          .select('id, full_name, email')
          .eq('id', data.inviter_id)
          .single()

        if (inviter) {
          return { ...data, inviter }
        }
      }

      return data
    },

    /**
     * Get a single invitation by ID
     */
    async getById(invitationId: string): Promise<InvitationWithRelations | null> {
      const { data, error } = await forsured('generic_invitations')
        .select(`
          *,
          rule:invitation_rules (*)
        `)
        .eq('id', invitationId)
        .single()

      if (error) return null

      // Fetch inviter details
      if (data?.inviter_id) {
        const { data: inviter } = await forsured('users')
          .select('id, full_name, email')
          .eq('id', data.inviter_id)
          .single()

        if (inviter) {
          return { ...data, inviter }
        }
      }

      return data
    },

    /**
     * Update email tracking timestamps
     */
    async trackEmailEvent(
      invitationId: string,
      event: 'sent' | 'opened' | 'clicked'
    ): Promise<void> {
      const field =
        event === 'sent'
          ? 'email_sent_at'
          : event === 'opened'
            ? 'email_opened_at'
            : 'email_clicked_at'

      const { error } = await forsured('generic_invitations')
        .update({ [field]: new Date().toISOString() })
        .eq('id', invitationId)

      if (error) {
        console.error(`Failed to track email ${event} for invitation:`, error)
      }
    },

    /**
     * Get user relationships for a user
     */
    async getRelationships(
      userId: string,
      type?: string
    ): Promise<UserRelationship[]> {
      let query = forsured('user_relationships')
        .select('*')
        .or(`source_user_id.eq.${userId},target_user_id.eq.${userId}`)
        .eq('status', 'active')

      if (type) {
        query = query.eq('relationship_type', type)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },

    /**
     * Remove a user relationship
     */
    async removeRelationship(
      relationshipId: string,
      userId: string
    ): Promise<void> {
      const { error } = await forsured('user_relationships')
        .update({
          status: 'removed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationshipId)
        // Ensure user is part of the relationship
        .or(`source_user_id.eq.${userId},target_user_id.eq.${userId}`)

      if (error) throw error

      await auditService.log({
        category: 'data_modification',
        action: 'user_relationship_removed',
        severity: 'medium',
        user_id: userId,
        resource_type: 'user_relationship',
        resource_id: relationshipId,
        status: 'success',
      })
    },

    // =========================================================================
    // Admin Methods for Rule Management
    // =========================================================================

    /**
     * Get all invitation rules (including inactive) for admin
     */
    async getAllRulesAdmin(): Promise<InvitationRule[]> {
      const { data, error } = await forsured('invitation_rules')
        .select('*')
        .order('source_role')
        .order('target_role')

      if (error) throw error
      return data || []
    },

    /**
     * Update an invitation rule
     */
    async updateRule(
      ruleId: string,
      updates: {
        name?: string
        description?: string
        constraint_message?: string
        allow_referral_only?: boolean
        is_active?: boolean
      },
      adminUserId: string
    ): Promise<InvitationRule> {
      const { data, error } = await forsured('invitation_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId)
        .select()
        .single()

      if (error) throw error

      await auditService.log({
        category: 'data_modification',
        action: 'invitation_rule_updated',
        severity: 'high',
        user_id: adminUserId,
        resource_type: 'invitation_rule',
        resource_id: ruleId,
        status: 'success',
        metadata: { updates },
      })

      return data
    },

    /**
     * Toggle a rule's active status
     */
    async toggleRuleActive(
      ruleId: string,
      isActive: boolean,
      adminUserId: string
    ): Promise<InvitationRule> {
      return this.updateRule(ruleId, { is_active: isActive }, adminUserId)
    },

    /**
     * Create a new invitation rule
     */
    async createRule(
      input: {
        source_role: string
        target_role: string
        relationship_type: 'one-to-one' | 'one-to-many' | 'one-to-many-via-project'
        name: string
        description?: string
        requires_project?: boolean
        constraint_message?: string
        allow_referral_only?: boolean
      },
      adminUserId: string
    ): Promise<InvitationRule> {
      const { data, error } = await forsured('invitation_rules')
        .insert({
          ...input,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      await auditService.log({
        category: 'data_modification',
        action: 'invitation_rule_created',
        severity: 'high',
        user_id: adminUserId,
        resource_type: 'invitation_rule',
        resource_id: data.id,
        status: 'success',
        metadata: { input },
      })

      return data
    },

    /**
     * Get invitation statistics for admin dashboard
     */
    async getInvitationStats(): Promise<{
      totalInvitations: number
      pendingInvitations: number
      acceptedInvitations: number
      declinedInvitations: number
      totalReferrals: number
      activeRelationships: number
    }> {
      const [invitationsResult, relationshipsResult] = await Promise.all([
        forsured('generic_invitations')
          .select('status')
          .then(({ data }) => data || []),
        forsured('user_relationships')
          .select('id')
          .eq('status', 'active')
          .then(({ data }) => data || []),
      ])

      const invitations = invitationsResult
      return {
        totalInvitations: invitations.length,
        pendingInvitations: invitations.filter((i) => i.status === 'pending').length,
        acceptedInvitations: invitations.filter((i) => i.status === 'accepted').length,
        declinedInvitations: invitations.filter((i) => i.status === 'declined').length,
        totalReferrals: invitations.filter((i) => i.status === 'accepted').length, // Simplified
        activeRelationships: relationshipsResult.length,
      }
    },
  }
}

/**
 * Default invitation service instance using the app's default Supabase client
 */
export const invitationService = createInvitationService()

export default invitationService
