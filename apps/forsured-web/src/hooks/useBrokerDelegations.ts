/**
 * Broker Delegations Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `broker_delegations` table in forsured schema
 */

import { useState, useEffect } from 'react';
import { BrokerClientDelegation, BrokerClientAssignment } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import MockDatabase from '../utils/mockDataStore';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

export function useBrokerDelegations(brokerOrgId?: string, userId?: string) {
  const [delegations, setDelegations] = useState<BrokerClientDelegation[]>([]);
  const [assignments, setAssignments] = useState<BrokerClientAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { useMockData, supabase } = useDatabase();

  const fetchDelegations = async () => {
    if (!brokerOrgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (useMockData) {
        const delegationData = await MockDatabase.query<BrokerClientDelegation>(
          'broker_delegations',
          { broker_org_id: brokerOrgId },
          { column: 'granted_at', ascending: false }
        );
        setDelegations(delegationData);

        if (userId) {
          const assignmentData = await MockDatabase.query<BrokerClientAssignment>(
            'broker_delegations',
            { broker_org_id: brokerOrgId, broker_user_id: userId },
            { column: 'assigned_at', ascending: false }
          );
          setAssignments(assignmentData);
        }
      } else {
        // Use real Supabase
        const { data: delegationData, error: delegationError } = await supabase
          .schema('forsured')
          .from('broker_delegations')
          .select('*')
          .eq('broker_org_id', brokerOrgId)
          .order('granted_at', { ascending: false });

        if (delegationError) {
          throw formatSupabaseError(delegationError, 'fetching broker delegations');
        }

        setDelegations(delegationData || []);

        if (userId) {
          const { data: assignmentData, error: assignmentError } = await supabase
            .schema('forsured')
            .from('broker_delegations')
            .select('*')
            .eq('broker_org_id', brokerOrgId)
            .eq('broker_user_id', userId)
            .order('assigned_at', { ascending: false });

          if (assignmentError) {
            throw formatSupabaseError(assignmentError, 'fetching broker assignments');
          }

          setAssignments(assignmentData || []);
        }
      }
    } catch (err) {
      console.error('Error fetching broker delegations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch delegations'
      );
    } finally {
      setLoading(false);
    }
  };

  const createDelegation = async (
    delegationData: Partial<BrokerClientDelegation>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<BrokerClientDelegation>(
          'broker_delegations',
          delegationData
        );
        setDelegations((prev) => [data, ...prev]);
        return data;
      } else {
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('broker_delegations')
          .insert(delegationData)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'creating broker delegation');
        }

        setDelegations((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error creating delegation:', err);
      throw err;
    }
  };

  const createAssignment = async (
    assignmentData: Partial<BrokerClientAssignment>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<BrokerClientAssignment>(
          'broker_delegations',
          assignmentData
        );
        setAssignments((prev) => [data, ...prev]);
        return data;
      } else {
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('broker_delegations')
          .insert(assignmentData)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'creating broker assignment');
        }

        setAssignments((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      throw err;
    }
  };

  const updateDelegation = async (
    id: string,
    updates: Partial<BrokerClientDelegation>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.update<BrokerClientDelegation>(
          'broker_delegations',
          id,
          updates
        );
        setDelegations((prev) =>
          prev.map((delegation) =>
            delegation.id === id ? { ...delegation, ...data } : delegation
          )
        );
        return data;
      } else {
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('broker_delegations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'updating broker delegation');
        }

        setDelegations((prev) =>
          prev.map((delegation) =>
            delegation.id === id ? { ...delegation, ...data } : delegation
          )
        );
        return data;
      }
    } catch (err) {
      console.error('Error updating delegation:', err);
      throw err;
    }
  };

  const updateAssignment = async (
    id: string,
    updates: Partial<BrokerClientAssignment>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.update<BrokerClientAssignment>(
          'broker_delegations',
          id,
          updates
        );
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === id ? { ...assignment, ...data } : assignment
          )
        );
        return data;
      } else {
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('broker_delegations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'updating broker assignment');
        }

        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === id ? { ...assignment, ...data } : assignment
          )
        );
        return data;
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDelegations();
  }, [brokerOrgId, userId]);

  return {
    delegations,
    assignments,
    loading,
    error,
    fetchDelegations,
    createDelegation,
    createAssignment,
    updateDelegation,
    updateAssignment,
  };
}
