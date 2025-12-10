/**
 * Compliance Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages compliance score data from forsured.compliance_scores table.
 */

import { useState, useEffect } from 'react';
import { ComplianceRecord } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase';
import MockDatabase from '../utils/mockDataStore';

export function useCompliance(clientId?: string) {
  const [compliance, setCompliance] = useState<ComplianceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { useMockData } = useDatabase();

  useEffect(() => {
    if (clientId) {
      fetchCompliance();
    }
  }, [clientId]);

  const fetchCompliance = async () => {
    if (!clientId) return;

    try {
      setLoading(true);

      if (useMockData) {
        // Use mock database
        const data = await MockDatabase.query<ComplianceRecord>(
          'compliance_records',
          { client_id: clientId }
        );
        setCompliance(data[0] || null);
      } else {
        // Use real Supabase with forsured schema
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: queryError } = await forsuredQuery('compliance_scores', client)
          .select('*')
          .eq('organization_id', clientId)
          .limit(1)
          .single();

        if (queryError && queryError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - not an error for this use case
          throw queryError;
        }

        setCompliance(data || null);
      }
    } catch (err) {
      console.error('[useCompliance] Error fetching compliance:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompliance = async (updates: Partial<ComplianceRecord>) => {
    if (!clientId || !compliance) return;

    try {
      if (useMockData) {
        const data = await MockDatabase.update<ComplianceRecord>(
          'compliance_records',
          compliance.id,
          updates
        );
        setCompliance(data);
        return data;
      } else {
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: updateError } = await forsuredQuery('compliance_scores', client)
          .update(updates)
          .eq('id', compliance.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setCompliance(data);
        return data;
      }
    } catch (err) {
      console.error('[useCompliance] Error updating compliance:', err);
      throw err;
    }
  };

  const createCompliance = async (
    record: Omit<ComplianceRecord, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<ComplianceRecord>(
          'compliance_records',
          record
        );
        setCompliance(data);
        return data;
      } else {
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: insertError } = await forsuredQuery('compliance_scores', client)
          .insert(record)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setCompliance(data);
        return data;
      }
    } catch (err) {
      console.error('[useCompliance] Error creating compliance:', err);
      throw err;
    }
  };

  return {
    compliance,
    loading,
    error,
    fetchCompliance,
    updateCompliance,
    createCompliance,
  };
}
