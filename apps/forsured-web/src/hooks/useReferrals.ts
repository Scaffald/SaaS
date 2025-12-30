/**
 * Referrals Hook
 * 
 * React hook for managing referrals and referral codes in the UI
 * Handles fetching stats, creating referrals, and managing user referral codes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getReferralStats,
  getUserReferrals,
  getUserReferralCode,
  createUserReferralCode,
  createReferral,
  type Referral,
  type UserReferralCode,
  type ReferralStats,
  type ReferralStatus,
} from '../lib/referrals';

export function useReferrals(userId?: string, orgId?: string) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<UserReferralCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch referral stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const userStats = await getReferralStats(userId);
      setStats(userStats);
    } catch (err) {
      console.error('[useReferrals] Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch referral stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user's referrals
  const fetchReferrals = useCallback(
    async (status?: ReferralStatus) => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const userReferrals = await getUserReferrals(userId, status);
        setReferrals(userReferrals);
      } catch (err) {
        console.error('[useReferrals] Error fetching referrals:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch referrals');
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Fetch or create user's referral code
  const fetchOrCreateReferralCode = useCallback(async () => {
    if (!userId || !orgId) return;

    try {
      setLoading(true);
      setError(null);

      // Try to get existing code
      let code = await getUserReferralCode(userId);

      // Create if doesn't exist
      if (!code) {
        code = await createUserReferralCode(userId, orgId);
      }

      setReferralCode(code);
    } catch (err) {
      console.error('[useReferrals] Error fetching/creating referral code:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to get referral code'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, orgId]);

  // Create a new referral
  const createNewReferral = useCallback(
    async (referredEmail: string, referralSource?: string) => {
      if (!userId || !orgId) {
        throw new Error('User ID and Organization ID are required');
      }

      try {
        setLoading(true);
        setError(null);

        const referral = await createReferral(
          userId,
          orgId,
          referredEmail,
          referralSource
        );

        // Refresh stats and referrals
        await fetchStats();
        await fetchReferrals();

        return referral;
      } catch (err) {
        console.error('[useReferrals] Error creating referral:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create referral';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userId, orgId, fetchStats, fetchReferrals]
  );

  // Copy referral code to clipboard
  const copyReferralCode = useCallback(() => {
    if (!referralCode) return false;

    try {
      navigator.clipboard.writeText(referralCode.referral_code);
      return true;
    } catch (err) {
      console.error('[useReferrals] Error copying to clipboard:', err);
      return false;
    }
  }, [referralCode]);

  // Generate referral link
  const getReferralLink = useCallback(() => {
    if (!referralCode) return null;

    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?referral=${referralCode.referral_code}`;
  }, [referralCode]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(() => {
    const link = getReferralLink();
    if (!link) return false;

    try {
      navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error('[useReferrals] Error copying link to clipboard:', err);
      return false;
    }
  }, [getReferralLink]);

  // Initialize - fetch stats and code on mount
  useEffect(() => {
    if (userId && orgId) {
      fetchStats();
      fetchOrCreateReferralCode();
      fetchReferrals();
    }
  }, [userId, orgId, fetchStats, fetchOrCreateReferralCode, fetchReferrals]);

  return {
    // Data
    stats,
    referrals,
    referralCode,
    referralLink: getReferralLink(),

    // Loading states
    loading,
    error,

    // Actions
    createNewReferral,
    fetchStats,
    fetchReferrals,
    fetchOrCreateReferralCode,
    copyReferralCode,
    copyReferralLink,
  };
}

// Hook for checking if a user has pending referrals (for notifications)
export function usePendingReferrals(userId?: string) {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function fetchPendingCount() {
      try {
        setLoading(true);
        const referrals = await getUserReferrals(userId, 'pending');
        setPendingCount(referrals.length);
      } catch (err) {
        console.error('[usePendingReferrals] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPendingCount();
  }, [userId]);

  return { pendingCount, loading };
}

