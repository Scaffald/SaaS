/**
 * Generic Invitation System Types
 *
 * REQ-128: Flexible Invitation System
 *
 * Types for the rule-based invitation system that handles all ForSured
 * relationship types with referral tracking, personal messages, and
 * admin-managed invitation rules.
 */

/**
 * Relationship type determines how many relationships are allowed
 */
export type RelationshipType =
  | 'one-to-one' // Target can only have one (e.g., one broker per client)
  | 'one-to-many' // Target can have multiple (e.g., broker with many managers)
  | 'one-to-many-via-project' // Relationship tied to a project

/**
 * Invitation lifecycle status
 */
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

/**
 * How the referral was attributed
 */
export type ReferralSource = 'invitation' | 'link' | 'cookie'

/**
 * Relationship status between users
 */
export type RelationshipStatus = 'active' | 'inactive' | 'removed'

/**
 * Admin-managed rule defining an invitation type
 */
export interface InvitationRule {
  id: string
  source_role: string
  target_role: string
  relationship_type: RelationshipType
  name: string
  description?: string
  email_template_id?: string
  requires_project: boolean
  constraint_message?: string
  allow_referral_only: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * An invitation record
 */
export interface Invitation {
  id: string
  rule_id: string
  inviter_id: string
  inviter_organization_id?: string
  invitee_email: string
  invitee_name?: string
  invitee_user_id?: string
  project_id?: string
  is_referral: boolean
  referral_code: string
  personal_message?: string
  status: InvitationStatus
  expires_at?: string
  constraint_blocked: boolean
  constraint_reason?: string
  created_at: string
  accepted_at?: string
  declined_at?: string
  decline_reason?: string
  email_sent_at?: string
  email_opened_at?: string
  email_clicked_at?: string
  metadata: Record<string, unknown>
}

/**
 * Invitation with related data (rule, inviter, project)
 */
export interface InvitationWithRelations extends Invitation {
  rule?: InvitationRule
  inviter?: {
    id: string
    full_name: string
    email: string
  }
  project?: {
    id: string
    name: string
  }
}

/**
 * User relationship record
 */
export interface UserRelationship {
  id: string
  source_user_id: string
  source_organization_id?: string
  target_user_id: string
  target_organization_id?: string
  relationship_type: string
  invitation_id?: string
  status: RelationshipStatus
  created_at: string
  updated_at: string
}

/**
 * Input for creating a new invitation
 */
export interface CreateInvitationInput {
  ruleId: string
  inviteeEmail: string
  inviteeName?: string
  personalMessage?: string
  projectId?: string
  expiresInDays?: number
}

/**
 * Result of checking a relationship constraint
 */
export interface ConstraintCheckResult {
  allowed: boolean
  reason?: string
  existingRelationship?: {
    id: string
    source_user: {
      id: string
      full_name: string
      email: string
    }
  }
}

/**
 * Referral data stored in localStorage/cookie
 */
export interface ReferralData {
  code: string
  type?: string
  timestamp: number
  landingUrl?: string
}

/**
 * Email data for sending invitation emails
 */
export interface InvitationEmailData {
  recipientEmail: string
  recipientName?: string
  inviterName: string
  inviterOrganization?: string
  targetRole: string
  personalMessage?: string
  referralCode: string
  acceptUrl: string
  declineUrl: string
  projectName?: string
  projectId?: string
}
