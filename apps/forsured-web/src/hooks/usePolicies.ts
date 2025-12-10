/**
 * Policies Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages policy data from forsured.policies table.
 */

import { useState, useEffect } from 'react';
import { PolicyData } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase';
import MockDatabase from '../utils/mockDataStore';

export function usePolicies(clientId?: string) {
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { useMockData } = useDatabase();

  useEffect(() => {
    fetchPolicies();
  }, [clientId]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        // Use mock database
        const filters = clientId ? { client_id: clientId } : {};
        const data = await MockDatabase.query<PolicyData>('policies', filters, {
          column: 'end_date',
          ascending: true,
        });
        setPolicies(data);
      } else {
        // Use real Supabase with forsured schema
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        let query = forsuredQuery('policies', client)
          .select('*')
          .order('end_date', { ascending: true });

        // Apply client filter if provided
        if (clientId) {
          query = query.eq('organization_id', clientId);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        setPolicies(data || []);
      }
    } catch (err) {
      console.error('[usePolicies] Error fetching policies:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addPolicy = async (
    policy: Omit<PolicyData, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<PolicyData>('policies', policy);
        await fetchPolicies();
        return data;
      } else {
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: insertError } = await forsuredQuery('policies', client)
          .insert(policy)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        await fetchPolicies();
        return data;
      }
    } catch (err) {
      console.error('[usePolicies] Error adding policy:', err);
      throw err;
    }
  };

  const updatePolicy = async (id: string, updates: Partial<PolicyData>) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.update<PolicyData>('policies', id, updates);
        await fetchPolicies();
        return data;
      } else {
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: updateError } = await forsuredQuery('policies', client)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        await fetchPolicies();
        return data;
      }
    } catch (err) {
      console.error('[usePolicies] Error updating policy:', err);
      throw err;
    }
  };

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    addPolicy,
    updatePolicy,
  };
}
