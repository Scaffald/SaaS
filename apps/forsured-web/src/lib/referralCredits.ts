/**
 * Referral Credits Service
 * 
 * Handles granting referral credits when:
 * - Relationships are established via relationship invitations
 * - Direct referrals complete signup
 * 
 * Credit amounts and approval workflows are configurable.
 */

import { forsured } from './supabase';
import { createReferral, grantReferralCredit } from './referrals';
import type { RelationshipInvitation } from './relationshipInvitations';

export interface CreditConfig {
  // Credit amounts for different relationship types
  brokerContractorCredit: number;
  brokerManagerCredit: number;
  managerContractorCredit: number;
  directReferralCredit: number;
  
  // Whether credits require approval
  requiresApproval: boolean;
  
  // Auto-approve credits under this amount
  autoApproveThreshold: number;
}

// Default credit configuration
const DEFAULT_CREDIT_CONFIG: CreditConfig = {
  brokerContractorCredit: 100.00,
  brokerManagerCredit: 100.00,
  managerContractorCredit: 50.00,
  directReferralCredit: 25.00,
  requiresApproval: true,
  autoApproveThreshold: 50.00,
};

/**
 * Get credit configuration (can be extended to fetch from database)
 */
export function getCreditConfig(): CreditConfig {
  return DEFAULT_CREDIT_CONFIG;
}

/**
 * Calculate credit amount based on relationship type
 * 
 * @param inviterType - The inviter's user type
 * @param inviteeType - The invitee's user type
 * @returns Credit amount
 */
export function calculateRelationshipCredit(
  inviterType: 'broker' | 'subcontractor' | 'manager',
  inviteeType: 'broker' | 'subcontractor' | 'manager'
): number {
  const config = getCreditConfig();

  // Broker-Contractor relationship
  if (
    (inviterType === 'broker' && inviteeType === 'subcontractor') ||
    (inviterType === 'subcontractor' && inviteeType === 'broker')
  ) {
    return config.brokerContractorCredit;
  }

  // Broker-Manager relationship
  if (
    (inviterType === 'broker' && inviteeType === 'manager') ||
    (inviterType === 'manager' && inviteeType === 'broker')
  ) {
    return config.brokerManagerCredit;
  }

  // Manager-Contractor relationship
  if (
    (inviterType === 'manager' && inviteeType === 'subcontractor') ||
    (inviterType === 'subcontractor' && inviteeType === 'manager')
  ) {
    return config.managerContractorCredit;
  }

  return 0;
}

/**
 * Grant credit for a relationship connection
 * This is the "back-door" into the referral system from relationship invitations
 * 
 * BUSINESS RULE: Only grant credits for NEW accounts (< 24 hours old)
 * 
 * @param invitation - The relationship invitation that was connected
 * @returns Success boolean and referral ID
 */
export async function grantCreditForRelationship(
  invitation: RelationshipInvitation
): Promise<{ success: boolean; referralId?: string; error?: string }> {
  // Check if credit was already granted
  if (invitation.referral_credit_granted) {
    console.log('[ReferralCredits] Credit already granted for this relationship');
    return { success: true, referralId: invitation.referral_credit_id };
  }

  // Check if relationship was actually connected
  if (invitation.status !== 'connected' || !invitation.invitee_user_id) {
    console.log('[ReferralCredits] Relationship not connected yet');
    return { success: false, error: 'Relationship not connected' };
  }

  // BUSINESS RULE: Check if account is eligible for credit (new account only)
  const metadata = invitation.metadata as Record<string, unknown>;
  const isEligibleForCredit = metadata?.eligible_for_credit === true;

  if (!isEligibleForCredit) {
    console.log('[ReferralCredits] Existing account - not eligible for credit');
    return { 
      success: false, 
      error: 'Referral credits only available for new account signups' 
    };
  }

  try {
    // Calculate credit amount
    const creditAmount = calculateRelationshipCredit(
      invitation.inviter_type,
      invitation.invitee_type
    );

    if (creditAmount === 0) {
      console.log('[ReferralCredits] No credit configured for this relationship type');
      return { success: false, error: 'No credit configured' };
    }

    console.log('[ReferralCredits] Granting relationship credit:', {
      inviterType: invitation.inviter_type,
      inviteeType: invitation.invitee_type,
      creditAmount,
    });

    // Create referral record to track the credit
    const referral = await createReferral(
      invitation.inviter_user_id,
      invitation.inviter_org_id,
      invitation.invitee_email,
      `relationship_${invitation.inviter_type}_${invitation.invitee_type}`,
      invitation.id
    );

    // Complete the referral immediately since relationship is already connected
    await forsured('referrals')
      .update({
        referred_user_id: invitation.invitee_user_id,
        referred_org_id: invitation.invitee_org_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    // Grant the credit
    const config = getCreditConfig();
    const creditGranted = await grantReferralCredit(referral.id, creditAmount);

    if (!creditGranted) {
      return { success: false, error: 'Failed to grant credit' };
    }

    // Update relationship invitation to mark credit as granted
    await forsured('relationship_invitations')
      .update({
        referral_credit_granted: true,
        referral_credit_id: referral.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // If credit requires approval and is above threshold, mark as pending
    if (config.requiresApproval && creditAmount > config.autoApproveThreshold) {
      await forsured('referrals')
        .update({
          credit_status: 'pending',
        })
        .eq('id', referral.id);
    } else {
      // Auto-approve if below threshold
      await forsured('referrals')
        .update({
          credit_status: 'approved',
        })
        .eq('id', referral.id);
    }

    console.log('[ReferralCredits] Relationship credit granted successfully');

    return { success: true, referralId: referral.id };
  } catch (error) {
    console.error('[ReferralCredits] Error granting relationship credit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grant credit',
    };
  }
}

/**
 * Grant credit for a direct referral completion
 * 
 * @param referralId - The referral ID
 * @returns Success boolean
 */
export async function grantCreditForReferral(referralId: string): Promise<boolean> {
  try {
    const { data: referral, error: fetchError } = await forsured('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (fetchError || !referral) {
      console.error('[ReferralCredits] Referral not found');
      return false;
    }

    // Check if already credited
    if (referral.status === 'credited') {
      console.log('[ReferralCredits] Referral already credited');
      return true;
    }

    // Check if referral is completed
    if (referral.status !== 'completed') {
      console.log('[ReferralCredits] Referral not completed yet');
      return false;
    }

    const config = getCreditConfig();
    const creditAmount = config.directReferralCredit;

    console.log('[ReferralCredits] Granting direct referral credit:', creditAmount);

    const creditGranted = await grantReferralCredit(referralId, creditAmount);

    if (!creditGranted) {
      return false;
    }

    // If credit requires approval and is above threshold, mark as pending
    if (config.requiresApproval && creditAmount > config.autoApproveThreshold) {
      await forsured('referrals')
        .update({
          credit_status: 'pending',
        })
        .eq('id', referralId);
    } else {
      // Auto-approve if below threshold
      await forsured('referrals')
        .update({
          credit_status: 'approved',
        })
        .eq('id', referralId);
    }

    console.log('[ReferralCredits] Direct referral credit granted successfully');
    return true;
  } catch (error) {
    console.error('[ReferralCredits] Error granting direct referral credit:', error);
    return false;
  }
}

/**
 * Approve a pending credit
 * 
 * @param referralId - The referral ID
 * @param approvedBy - The user ID approving the credit
 * @returns Success boolean
 */
export async function approveCredit(
  referralId: string,
  approvedBy: string
): Promise<boolean> {
  const { error } = await forsured('referrals')
    .update({
      credit_status: 'approved',
      metadata: forsured.sql`metadata || jsonb_build_object('approved_by', ${approvedBy}, 'approved_at', ${new Date().toISOString()})`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .eq('credit_status', 'pending');

  if (error) {
    console.error('[ReferralCredits] Error approving credit:', error);
    return false;
  }

  console.log('[ReferralCredits] Credit approved successfully');
  return true;
}

/**
 * Mark credit as paid
 * 
 * @param referralId - The referral ID
 * @param paidBy - The user ID marking as paid
 * @returns Success boolean
 */
export async function markCreditAsPaid(
  referralId: string,
  paidBy: string
): Promise<boolean> {
  const { error } = await forsured('referrals')
    .update({
      credit_status: 'paid',
      credited_at: new Date().toISOString(),
      metadata: forsured.sql`metadata || jsonb_build_object('paid_by', ${paidBy}, 'paid_at', ${new Date().toISOString()})`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .eq('credit_status', 'approved');

  if (error) {
    console.error('[ReferralCredits] Error marking credit as paid:', error);
    return false;
  }

  console.log('[ReferralCredits] Credit marked as paid successfully');
  return true;
}

/**
 * Get pending credits that require approval
 * 
 * @param limit - Maximum number of results
 * @returns List of referrals with pending credits
 */
export async function getPendingCredits(limit: number = 50) {
  const { data, error } = await forsured('referrals')
    .select('*')
    .eq('credit_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ReferralCredits] Error fetching pending credits:', error);
    throw error;
  }

  return data || [];
}

