/**
 * Relationships Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `relationships` table in forsured schema
 */

import { useState, useEffect } from 'react';
import { ManagerSubcontractorRelationship } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

export function useRelationships(organizationId?: string) {
  const [relationships, setRelationships] = useState<
    ManagerSubcontractorRelationship[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useDatabase();

  const fetchRelationships = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('relationships')
        .select('*')
        .or(`manager_org_id.eq.${organizationId},subcontractor_org_id.eq.${organizationId}`)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching relationships');
      }

      setRelationships(data || []);
    } catch (err) {
      console.error('Error fetching relationships:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch relationships'
      );
    } finally {
      setLoading(false);
    }
  };

  const createRelationship = async (
    relationshipData: Partial<ManagerSubcontractorRelationship>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('relationships')
        .insert(relationshipData)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating relationship');
      }

      setRelationships((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating relationship:', err);
      throw err;
    }
  };

  const updateRelationship = async (
    id: string,
    updates: Partial<ManagerSubcontractorRelationship>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'updating relationship');
      }

      setRelationships((prev) =>
        prev.map((rel) => (rel.id === id ? { ...rel, ...data } : rel))
      );
      return data;
    } catch (err) {
      console.error('Error updating relationship:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [organizationId]);

  return {
    relationships,
    loading,
    error,
    fetchRelationships,
    createRelationship,
    updateRelationship,
  };
}
