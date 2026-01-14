/**
 * Project Subcontractors Hook
 *
 * Manages subcontractors linked to a specific project.
 */

import { useState, useEffect, useCallback } from 'react';
import { forsured } from '../lib/supabase';

export interface ProjectSubcontractor {
  id: string;
  project_id: string;
  subcontractor_id: string;
  invited_by?: string;
  invited_at?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined subcontractor data
  subcontractor?: {
    id: string;
    name: string;
    company: string;
    trade_type?: string;
    contact_info?: {
      email?: string;
      phone?: string;
    };
  };
}

interface UseProjectSubcontractorsOptions {
  projectId?: string;
}

export function useProjectSubcontractors({ projectId }: UseProjectSubcontractorsOptions) {
  const [projectSubcontractors, setProjectSubcontractors] = useState<ProjectSubcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectSubcontractors = useCallback(async () => {
    if (!projectId) {
      setProjectSubcontractors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await forsured('project_subcontractors')
        .select(`
          *,
          subcontractor:subcontractors (
            id,
            name,
            company,
            trade_type,
            contact_info
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProjectSubcontractors(data || []);
    } catch (err) {
      console.error('[useProjectSubcontractors] Error fetching project subcontractors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch project subcontractors');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectSubcontractors();
  }, [fetchProjectSubcontractors]);

  const addSubcontractorToProject = useCallback(
    async (data: {
      subcontractor_id: string;
      invited_by?: string;
      status?: string;
      notes?: string;
    }) => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { data: newEntry, error: insertError } = await forsured('project_subcontractors')
        .insert({
          project_id: projectId,
          subcontractor_id: data.subcontractor_id,
          invited_by: data.invited_by,
          invited_at: new Date().toISOString(),
          status: data.status || 'invited',
          notes: data.notes,
        })
        .select(`
          *,
          subcontractor:subcontractors (
            id,
            name,
            company,
            trade_type,
            contact_info
          )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      setProjectSubcontractors((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    [projectId]
  );

  const removeSubcontractorFromProject = useCallback(
    async (id: string) => {
      const { error: deleteError } = await forsured('project_subcontractors')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setProjectSubcontractors((prev) => prev.filter((ps) => ps.id !== id));
    },
    []
  );

  const updateSubcontractorStatus = useCallback(
    async (id: string, status: string) => {
      const { data: updated, error: updateError } = await forsured('project_subcontractors')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          subcontractor:subcontractors (
            id,
            name,
            company,
            trade_type,
            contact_info
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      setProjectSubcontractors((prev) =>
        prev.map((ps) => (ps.id === id ? updated : ps))
      );
      return updated;
    },
    []
  );

  return {
    projectSubcontractors,
    loading,
    error,
    fetchProjectSubcontractors,
    addSubcontractorToProject,
    removeSubcontractorFromProject,
    updateSubcontractorStatus,
  };
}
