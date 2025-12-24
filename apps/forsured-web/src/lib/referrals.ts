/**
 * Referrals Service
 * 
 * Handles general referral system with RFR- codes.
 * Users can refer any business/user type without creating specific relationships.
 * Tracks referral credits and statistics.
 */

import { forsured } from './supabase';
import { generateReferralCode } from './connectionCodes';

export type ReferralStatus = 'pending' | 'completed' | 'credited' | 'expired';
export type CreditStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface Referral {
  id: string;
  referrer_user_id: string;
  referrer_org_id: string;
  referred_user_id?: string;
  referred_org_id?: string;
  referred_email: string;
  referral_code: string;
  referral_source?: string;
  source_relationship_id?: string;
  status: ReferralStatus;
  credit_amount: number;
  credit_status: CreditStatus;
  credit_granted_at?: string;
  expires_at?: string;
  referred_at: string;
  completed_at?: string;
  credited_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserReferralCode {
  id: string;
  user_id: string;
  org_id: string;
  referral_code: string;
  is_active: boolean;
  total_referrals: number;
  completed_referrals: number;
  total_credit: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCredit: number;
  approvedCredit: number;
  paidCredit: number;
  referralCode: string;
}

/**
 * Create or get a user's referral code
 * Each user has one active referral code at a time
 * 
 * @param userId - The user ID
 * @param orgId - The user's organization ID
 * @returns The user's referral code
 */
export async function createUserReferralCode(
  userId: string,
  orgId: string
): Promise<UserReferralCode> {
  // Check if user already has an active referral code
  const { data: existing, error: fetchError } = await forsured('user_referral_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!fetchError && existing) {
    console.log('[Referrals] User already has an active referral code');
    return existing;
  }

  // Generate new referral code
  const referralCode = generateReferralCode();

  console.log('[Referrals] Creating new referral code:', referralCode);

  const { data, error } = await forsured('user_referral_codes')
    .insert({
      user_id: userId,
      org_id: orgId,
      referral_code: referralCode,
      is_active: true,
      total_referrals: 0,
      completed_referrals: 0,
      total_credit: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[Referrals] Error creating referral code:', error);
    throw error;
  }

  console.log('[Referrals] Referral code created successfully');
  return data;
}

/**
 * Get a user's active referral code
 * 
 * @param userId - The user ID
 * @returns The user's referral code or null
 */
export async function getUserReferralCode(userId: string): Promise<UserReferralCode | null> {
  const { data, error } = await forsured('user_referral_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.log('[Referrals] No active referral code found for user');
    return null;
  }

  return data;
}

/**
 * Create a referral record
 * 
 * @param referrerUserId - The user making the referral
 * @param referrerOrgId - The referrer's organization ID
 * @param referredEmail - The referred party's email
 * @param referralSource - Source of the referral (optional)
 * @param sourceRelationshipId - Related relationship invitation ID (optional)
 * @returns The created referral
 */
export async function createReferral(
  referrerUserId: string,
  referrerOrgId: string,
  referredEmail: string,
  referralSource?: string,
  sourceRelationshipId?: string
): Promise<Referral> {
  // Get the user's referral code
  let userCode = await getUserReferralCode(referrerUserId);
  
  if (!userCode) {
    // Create one if it doesn't exist
    userCode = await createUserReferralCode(referrerUserId, referrerOrgId);
  }

  console.log('[Referrals] Creating referral for:', referredEmail);

  const { data, error } = await forsured('referrals')
    .insert({
      referrer_user_id: referrerUserId,
      referrer_org_id: referrerOrgId,
      referred_email: referredEmail.toLowerCase().trim(),
      referral_code: userCode.referral_code,
      referral_source: referralSource || 'direct_referral',
      source_relationship_id: sourceRelationshipId,
      status: 'pending',
      credit_amount: 0,
      credit_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[Referrals] Error creating referral:', error);
    throw error;
  }

  // Update user's referral code stats
  await forsured('user_referral_codes')
    .update({
      total_referrals: userCode.total_referrals + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userCode.id);

  console.log('[Referrals] Referral created successfully');
  return data;
}

/**
 * Connect using a referral code (during signup)
 * 
 * @param code - The referral code
 * @param referredUserId - The referred user's ID (set after signup)
 * @param referredOrgId - The referred user's organization ID (set after signup)
 * @returns Success boolean and referral ID
 */
export async function connectByReferralCode(
  code: string,
  referredUserId: string,
  referredOrgId: string
): Promise<{ success: boolean; referralId?: string; error?: string }> {
  const normalizedCode = code.toUpperCase().trim();

  console.log('[Referrals] Connecting by referral code:', normalizedCode);

  // Find the user referral code
  const { data: userCode, error: codeError } = await forsured('user_referral_codes')
    .select('*')
    .eq('referral_code', normalizedCode)
    .eq('is_active', true)
    .single();

  if (codeError || !userCode) {
    console.log('[Referrals] Referral code not found');
    return {
      success: false,
      error: 'Invalid referral code',
    };
  }

  // Check if referral already exists for this user
  const { data: existingReferral } = await forsured('referrals')
    .select('id')
    .eq('referral_code', normalizedCode)
    .eq('referred_user_id', referredUserId)
    .single();

  if (existingReferral) {
    console.log('[Referrals] Referral already exists for this user');
    return {
      success: true,
      referralId: existingReferral.id,
    };
  }

  // Get the referred user's email
  // Note: In production, you would fetch this from auth or user tables
  // For now, we'll create the referral record
  
  const { data: referral, error: referralError } = await forsured('referrals')
    .insert({
      referrer_user_id: userCode.user_id,
      referrer_org_id: userCode.org_id,
      referred_user_id: referredUserId,
      referred_org_id: referredOrgId,
      referred_email: '', // Will be updated with actual email
      referral_code: normalizedCode,
      referral_source: 'direct_referral',
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (referralError || !referral) {
    console.error('[Referrals] Error creating referral:', referralError);
    return {
      success: false,
      error: 'Failed to create referral',
    };
  }

  // Update user referral code stats
  await forsured('user_referral_codes')
    .update({
      total_referrals: userCode.total_referrals + 1,
      completed_referrals: userCode.completed_referrals + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userCode.id);

  console.log('[Referrals] Referral connection successful');

  return {
    success: true,
    referralId: referral.id,
  };
}

/**
 * Connect using email matching (silent, happens during signup/login)
 * 
 * @param email - The email to match
 * @param referredUserId - The referred user's ID
 * @param referredOrgId - The referred user's organization ID
 * @returns Array of connected referral IDs
 */
export async function connectReferralsByEmail(
  email: string,
  referredUserId: string,
  referredOrgId: string
): Promise<string[]> {
  const normalizedEmail = email.toLowerCase().trim();

  console.log('[Referrals] Checking for referral email matches:', normalizedEmail);

  // Find pending referrals for this email
  const { data: referrals, error } = await forsured('referrals')
    .select('*')
    .eq('referred_email', normalizedEmail)
    .eq('status', 'pending');

  if (error || !referrals || referrals.length === 0) {
    console.log('[Referrals] No matching referrals found');
    return [];
  }

  console.log(`[Referrals] Found ${referrals.length} matching referral(s)`);

  // Update all matching referrals
  const referralIds: string[] = [];

  for (const referral of referrals) {
    const { error: updateError } = await forsured('referrals')
      .update({
        referred_user_id: referredUserId,
        referred_org_id: referredOrgId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    if (!updateError) {
      referralIds.push(referral.id);

      // Update user referral code stats
      await forsured('user_referral_codes')
        .update({
          completed_referrals: forsured.sql`completed_referrals + 1`,
          updated_at: new Date().toISOString(),
        })
        .eq('referral_code', referral.referral_code);
    }
  }

  return referralIds;
}

/**
 * Get referral statistics for a user
 * 
 * @param userId - The user ID
 * @returns Referral statistics
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  // Get user's referral code
  const userCode = await getUserReferralCode(userId);

  if (!userCode) {
    return null;
  }

  // Get detailed referral stats
  const { data: referrals, error } = await forsured('referrals')
    .select('status, credit_amount, credit_status')
    .eq('referrer_user_id', userId);

  if (error) {
    console.error('[Referrals] Error fetching referral stats:', error);
    return null;
  }

  const stats: ReferralStats = {
    totalReferrals: userCode.total_referrals,
    completedReferrals: userCode.completed_referrals,
    pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
    totalCredit: userCode.total_credit,
    approvedCredit: referrals?.filter(r => r.credit_status === 'approved')
      .reduce((sum, r) => sum + (r.credit_amount || 0), 0) || 0,
    paidCredit: referrals?.filter(r => r.credit_status === 'paid')
      .reduce((sum, r) => sum + (r.credit_amount || 0), 0) || 0,
    referralCode: userCode.referral_code,
  };

  return stats;
}

/**
 * Get all referrals for a user
 * 
 * @param userId - The user ID
 * @param status - Optional status filter
 * @returns List of referrals
 */
export async function getUserReferrals(
  userId: string,
  status?: ReferralStatus
): Promise<Referral[]> {
  let query = forsured('referrals')
    .select('*')
    .eq('referrer_user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Referrals] Error fetching referrals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Grant referral credit
 * 
 * @param referralId - The referral ID
 * @param creditAmount - The credit amount to grant
 * @returns Success boolean
 */
export async function grantReferralCredit(
  referralId: string,
  creditAmount: number
): Promise<boolean> {
  const { data: referral, error: fetchError } = await forsured('referrals')
    .select('*')
    .eq('id', referralId)
    .single();

  if (fetchError || !referral) {
    console.error('[Referrals] Referral not found');
    return false;
  }

  // Update referral with credit
  const { error: updateError } = await forsured('referrals')
    .update({
      status: 'credited',
      credit_amount: creditAmount,
      credit_status: 'approved',
      credit_granted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralId);

  if (updateError) {
    console.error('[Referrals] Error granting credit:', updateError);
    return false;
  }

  // Update user referral code total credit
  const { data: userCode } = await forsured('user_referral_codes')
    .select('*')
    .eq('referral_code', referral.referral_code)
    .single();

  if (userCode) {
    await forsured('user_referral_codes')
      .update({
        total_credit: userCode.total_credit + creditAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userCode.id);
  }

  console.log('[Referrals] Credit granted successfully');
  return true;
}

