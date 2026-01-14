/**
 * Relationship Invitations Service
 * 
 * Handles bidirectional relationship invitations between brokers, contractors, and managers.
 * Supports connection via email or relationship codes (BKR/CTR/MGR).
 * Automatically grants referral credits when relationships are established.
 */

import { forsured } from './supabase';
import { generateRelationshipCode, type RelationshipCodeType } from './connectionCodes';

export type ConnectionType = 'broker' | 'subcontractor' | 'manager';
export type ConnectionMethod = 'email' | 'code' | 'both';
export type InvitationStatus = 'pending' | 'accepted' | 'connected' | 'expired' | 'declined';

export interface RelationshipInvitation {
  id: string;
  inviter_org_id: string;
  inviter_user_id: string;
  inviter_type: ConnectionType;
  invitee_email: string;
  invitee_name?: string;
  invitee_company?: string;
  invitee_phone?: string;
  invitee_type: ConnectionType;
  relationship_code: string;
  connection_method: ConnectionMethod;
  status: InvitationStatus;
  relationship_id?: string;
  invitee_org_id?: string;
  invitee_user_id?: string;
  referral_credit_granted: boolean;
  referral_credit_id?: string;
  expires_at?: string;
  invited_at: string;
  accepted_at?: string;
  connected_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateRelationshipInvitationOptions {
  inviterOrgId: string;
  inviterUserId: string;
  inviterType: ConnectionType;
  inviteeEmail: string;
  inviteeName?: string;
  inviteeCompany?: string;
  inviteePhone?: string;
  inviteeType: ConnectionType;
  connectionMethod?: ConnectionMethod;
  expiresInDays?: number;
}

export interface ConnectionResult {
  success: boolean;
  invitation?: RelationshipInvitation;
  error?: string;
  relationshipId?: string;
}

/**
 * Get the appropriate code type for an inviter type
 */
function getCodeTypeForInviter(inviterType: ConnectionType): RelationshipCodeType {
  const codeMap: Record<ConnectionType, RelationshipCodeType> = {
    broker: 'BKR',
    subcontractor: 'CTR',
    manager: 'MGR',
  };
  return codeMap[inviterType];
}

/**
 * Create a relationship invitation
 * 
 * @param options - Invitation creation options
 * @returns The created invitation
 */
export async function createRelationshipInvitation(
  options: CreateRelationshipInvitationOptions
): Promise<RelationshipInvitation> {
  const {
    inviterOrgId,
    inviterUserId,
    inviterType,
    inviteeEmail,
    inviteeName,
    inviteeCompany,
    inviteePhone,
    inviteeType,
    connectionMethod = 'both',
    expiresInDays = 30,
  } = options;

  // Generate relationship code based on inviter type
  const codeType = getCodeTypeForInviter(inviterType);
  const relationshipCode = generateRelationshipCode(codeType);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  console.log('[RelationshipInvitations] Creating invitation:', {
    relationshipCode,
    inviterType,
    inviteeType,
    inviteeEmail,
  });

  const { data, error } = await forsured('relationship_invitations')
    .insert({
      inviter_org_id: inviterOrgId,
      inviter_user_id: inviterUserId,
      inviter_type: inviterType,
      invitee_email: inviteeEmail.toLowerCase().trim(),
      invitee_name: inviteeName,
      invitee_company: inviteeCompany,
      invitee_phone: inviteePhone,
      invitee_type: inviteeType,
      relationship_code: relationshipCode,
      connection_method: connectionMethod,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[RelationshipInvitations] Error creating invitation:', error);
    throw error;
  }

  console.log('[RelationshipInvitations] Invitation created successfully');
  return data;
}

/**
 * Connect using a relationship code
 * 
 * @param code - The relationship code to use
 * @param userOrgId - The connecting user's organization ID
 * @param userId - The connecting user's ID
 * @returns Connection result with invitation and relationship ID
 */
export async function connectByRelationshipCode(
  code: string,
  userOrgId: string,
  userId: string
): Promise<ConnectionResult> {
  const normalizedCode = code.toUpperCase().trim();

  console.log('[RelationshipInvitations] Connecting by code:', normalizedCode);

  // Fetch the invitation
  const { data: invitation, error } = await forsured('relationship_invitations')
    .select('*')
    .eq('relationship_code', normalizedCode)
    .eq('status', 'pending')
    .single();

  if (error || !invitation) {
    console.log('[RelationshipInvitations] Code not found or already used');
    return {
      success: false,
      error: 'Invalid or expired relationship code',
    };
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    console.log('[RelationshipInvitations] Code expired');
    return {
      success: false,
      error: 'Relationship code has expired',
    };
  }

  // Establish the relationship
  const result = await establishRelationship(invitation, userOrgId, userId);
  
  return result;
}

/**
 * Connect using email matching (silent, happens during signup/login)
 *
 * BUSINESS RULES:
 * - Only triggers for NEW accounts (< 24 hours old)
 * - Allows multiple broker relationships for users
 * - Allows multiple manager relationships for contractors
 * - Allows unlimited client relationships for brokers
 *
 * @param email - The email to match
 * @param userOrgId - The user's organization ID
 * @param userId - The user's ID
 * @param isNewSignup - Whether this is a brand new account signup
 * @returns Array of connection results for all matching invitations
 */
export async function connectByEmail(
  email: string,
  userOrgId: string,
  userId: string,
  isNewSignup: boolean = false
): Promise<ConnectionResult[]> {
  const normalizedEmail = email.toLowerCase().trim();

  console.log('[RelationshipInvitations] Checking for email matches:', normalizedEmail, 
    isNewSignup ? '(NEW SIGNUP)' : '(EXISTING ACCOUNT)');

  // BUSINESS RULE: Only auto-connect for new signups
  // Existing accounts must manually enter codes on settings pages
  if (!isNewSignup) {
    console.log('[RelationshipInvitations] Existing account - skipping auto-connect');
    return [];
  }

  // Find pending invitations for this email
  const { data: invitations, error } = await forsured('relationship_invitations')
    .select('*')
    .eq('invitee_email', normalizedEmail)
    .eq('status', 'pending')
    .gte('expires_at', new Date().toISOString());

  if (error || !invitations || invitations.length === 0) {
    console.log('[RelationshipInvitations] No matching invitations found');
    return [];
  }

  console.log(`[RelationshipInvitations] Found ${invitations.length} matching invitation(s)`);

  // Auto-connect all matching invitations
  // Note: establishRelationship will handle broker constraint checks
  const results = await Promise.all(
    invitations.map(invitation => establishRelationship(invitation, userOrgId, userId))
  );

  return results;
}

/**
 * Check if this is a new account (for referral credit eligibility)
 * New accounts are eligible for referral credits, existing accounts are not
 */
async function isNewAccount(userId: string, createdAtThreshold: number = 24 * 60 * 60 * 1000): Promise<boolean> {
  // Check when the user account was created
  const { data: user } = await forsured('users')
    .select('created_at')
    .eq('id', userId)
    .single();

  if (!user || !user.created_at) {
    return false;
  }

  const accountAge = Date.now() - new Date(user.created_at).getTime();
  // Consider "new" if account was created within the threshold (default 24 hours)
  return accountAge < createdAtThreshold;
}

/**
 * Establish a relationship from an invitation
 * Creates the relationship record and grants referral credit (only for new accounts)
 * 
 * Business Rules:
 * - Users can have MULTIPLE brokers (different policies may be handled by different brokers)
 * - Contractors can have multiple managers (no limit)
 * - Brokers can have unlimited clients (no limit)
 * - Referral credits only for NEW accounts (< 24 hours old)
 * 
 * @param invitation - The invitation to establish
 * @param inviteeOrgId - The invitee's organization ID
 * @param inviteeUserId - The invitee's user ID
 * @returns Connection result
 */
async function establishRelationship(
  invitation: RelationshipInvitation,
  inviteeOrgId: string,
  inviteeUserId: string
): Promise<ConnectionResult> {
  console.log('[RelationshipInvitations] Establishing relationship:', invitation.id);

  try {
    // Note: Multiple broker relationships are now allowed
    // Different insurance policies may be handled by specialized brokers
    // (e.g., general liability vs. workers' comp)

    // BUSINESS RULE: Check if account is new for referral credit eligibility
    const isEligibleForCredit = await isNewAccount(inviteeUserId);
    
    if (!isEligibleForCredit) {
      console.log('[RelationshipInvitations] Existing account - no referral credit');
    }

    // Determine relationship table IDs based on types
    let managerOrgId: string;
    let subcontractorOrgId: string;

    if (invitation.inviter_type === 'manager' && invitation.invitee_type === 'subcontractor') {
      managerOrgId = invitation.inviter_org_id;
      subcontractorOrgId = inviteeOrgId;
    } else if (invitation.inviter_type === 'subcontractor' && invitation.invitee_type === 'manager') {
      managerOrgId = inviteeOrgId;
      subcontractorOrgId = invitation.inviter_org_id;
    } else {
      // For broker relationships, we don't create a relationships table entry
      // Instead, we create a broker_clients entry or similar
      console.log('[RelationshipInvitations] Broker relationship - skipping relationships table');
      
      // Update invitation status
      await forsured('relationship_invitations')
        .update({
          status: 'connected',
          invitee_org_id: inviteeOrgId,
          invitee_user_id: inviteeUserId,
          connected_at: new Date().toISOString(),
          metadata: {
            eligible_for_credit: isEligibleForCredit,
            account_age_at_connection: 'existing',
          },
        })
        .eq('id', invitation.id);

      // Grant referral credit only if account is new
      if (isEligibleForCredit) {
        // TODO: Trigger referral credit granting
        console.log('[RelationshipInvitations] New account - eligible for referral credit');
      }

      return {
        success: true,
        invitation: { ...invitation, status: 'connected' as InvitationStatus },
      };
    }

    // Check if relationship already exists
    const { data: existingRelationship } = await forsured('relationships')
      .select('id')
      .eq('manager_org_id', managerOrgId)
      .eq('subcontractor_org_id', subcontractorOrgId)
      .single();

    let relationshipId: string;

    if (existingRelationship) {
      // Relationship exists, just update status
      relationshipId = existingRelationship.id;
      
      await forsured('relationships')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationshipId);
    } else {
      // Create new relationship
      // BUSINESS RULE: Contractors can have multiple managers (no constraint check needed)
      const { data: newRelationship, error: relationshipError } = await forsured('relationships')
        .insert({
          manager_org_id: managerOrgId,
          subcontractor_org_id: subcontractorOrgId,
          status: 'active',
        })
        .select('id')
        .single();

      if (relationshipError || !newRelationship) {
        throw relationshipError || new Error('Failed to create relationship');
      }

      relationshipId = newRelationship.id;
    }

    // Update invitation with connection details
    const { error: updateError } = await forsured('relationship_invitations')
      .update({
        status: 'connected',
        relationship_id: relationshipId,
        invitee_org_id: inviteeOrgId,
        invitee_user_id: inviteeUserId,
        connected_at: new Date().toISOString(),
        metadata: {
          eligible_for_credit: isEligibleForCredit,
          account_age_at_connection: isEligibleForCredit ? 'new' : 'existing',
        },
      })
      .eq('id', invitation.id);

    if (updateError) {
      throw updateError;
    }

    console.log('[RelationshipInvitations] Relationship established successfully');

    // Grant referral credit only if account is new
    if (isEligibleForCredit) {
      console.log('[RelationshipInvitations] New account - eligible for referral credit');
      // Referral credit will be granted by referralCredits service
    } else {
      console.log('[RelationshipInvitations] Existing account - no referral credit granted');
    }

    return {
      success: true,
      invitation: { ...invitation, status: 'connected' as InvitationStatus },
      relationshipId,
    };
  } catch (error) {
    console.error('[RelationshipInvitations] Error establishing relationship:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to establish relationship',
    };
  }
}

/**
 * Get invitations for a user
 * 
 * @param userId - The user ID
 * @param status - Optional status filter
 * @returns List of invitations
 */
export async function getUserInvitations(
  userId: string,
  status?: InvitationStatus
): Promise<RelationshipInvitation[]> {
  let query = forsured('relationship_invitations')
    .select('*')
    .or(`inviter_user_id.eq.${userId},invitee_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[RelationshipInvitations] Error fetching invitations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Cancel/decline an invitation
 * 
 * @param invitationId - The invitation ID
 * @param userId - The user ID performing the action
 * @returns Success boolean
 */
export async function cancelInvitation(
  invitationId: string,
  userId: string
): Promise<boolean> {
  const { error } = await forsured('relationship_invitations')
    .update({
      status: 'declined',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .or(`inviter_user_id.eq.${userId},invitee_user_id.eq.${userId}`);

  if (error) {
    console.error('[RelationshipInvitations] Error canceling invitation:', error);
    return false;
  }

  return true;
}

