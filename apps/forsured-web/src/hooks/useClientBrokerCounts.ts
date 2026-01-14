/**
 * Hook to fetch broker counts for clients
 * 
 * This hook counts how many brokers each client organization has connected to,
 * allowing brokers to see if their clients work with multiple insurance brokers.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';

export interface ClientBrokerCount {
  organizationId: string;
  brokerCount: number;
  hasMultipleBrokers: boolean;
}

interface UseClientBrokerCountsOptions {
  /** Array of organization IDs to fetch broker counts for */
  organizationIds: string[];
}

export function useClientBrokerCounts({ organizationIds }: UseClientBrokerCountsOptions) {
  const { forsured } = useDatabase();
  const [brokerCounts, setBrokerCounts] = useState<Map<string, ClientBrokerCount>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBrokerCounts = useCallback(async () => {
    if (organizationIds.length === 0) {
      setBrokerCounts(new Map());
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const countsMap = new Map<string, ClientBrokerCount>();

      // For each organization, count their connected brokers
      for (const orgId of organizationIds) {
        // Count as inviter (client invited broker)
        const { count: asInviterCount } = await forsured('relationship_invitations')
          .select('*', { count: 'exact', head: true })
          .eq('inviter_org_id', orgId)
          .in('inviter_type', ['manager', 'subcontractor'])
          .eq('invitee_type', 'broker')
          .eq('status', 'connected');

        // Count as invitee (broker invited client)
        const { count: asInviteeCount } = await forsured('relationship_invitations')
          .select('*', { count: 'exact', head: true })
          .eq('invitee_org_id', orgId)
          .in('invitee_type', ['manager', 'subcontractor'])
          .eq('inviter_type', 'broker')
          .eq('status', 'connected');

        const totalBrokers = (asInviterCount || 0) + (asInviteeCount || 0);

        countsMap.set(orgId, {
          organizationId: orgId,
          brokerCount: totalBrokers,
          hasMultipleBrokers: totalBrokers > 1,
        });
      }

      setBrokerCounts(countsMap);
    } catch (err) {
      console.error('[useClientBrokerCounts] Error fetching broker counts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [organizationIds, forsured]);

  useEffect(() => {
    fetchBrokerCounts();
  }, [fetchBrokerCounts]);

  const getBrokerCount = useCallback(
    (organizationId: string): ClientBrokerCount | undefined => {
      return brokerCounts.get(organizationId);
    },
    [brokerCounts]
  );

  return {
    brokerCounts,
    loading,
    error,
    fetchBrokerCounts,
    getBrokerCount,
  };
}
