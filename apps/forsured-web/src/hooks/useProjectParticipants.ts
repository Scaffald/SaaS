/**
 * Project Participants Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `project_participants` table in forsured schema:
 * - id (uuid, primary key)
 * - project_id (uuid, foreign key to forsured.projects)
 * - user_id (uuid, foreign key to scaffald.users)
 * - organization_id (uuid, foreign key to scaffald.organizations)
 * - role (text) - participant role in project
 * - invited_at (timestamptz)
 * - invited_by (uuid, foreign key to scaffald.users)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import { ProjectParticipant } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import MockDatabase from '../utils/mockDataStore';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

export function useProjectParticipants(projectId?: string) {
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { useMockData, supabase } = useDatabase();

  const fetchParticipants = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (useMockData) {
        const data = await MockDatabase.query<ProjectParticipant>(
          'project_participants',
          { project_id: projectId },
          { column: 'invited_at', ascending: false }
        );
        setParticipants(data);
      } else {
        // Use real Supabase
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('project_participants')
          .select('*')
          .eq('project_id', projectId)
          .order('invited_at', { ascending: false });

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'fetching project participants');
        }

        setParticipants(data || []);
      }
    } catch (err) {
      console.error('[useProjectParticipants] Error fetching participants:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch participants'
      );
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (
    participantData: Partial<ProjectParticipant>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<ProjectParticipant>(
          'project_participants',
          participantData
        );
        setParticipants((prev) => [data, ...prev]);
        return data;
      } else {
        // Use real Supabase
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('project_participants')
          .insert(participantData)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'adding participant');
        }

        setParticipants((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('[useProjectParticipants] Error adding participant:', err);
      throw err;
    }
  };

  const updateParticipant = async (
    id: string,
    updates: Partial<ProjectParticipant>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.update<ProjectParticipant>(
          'project_participants',
          id,
          updates
        );
        setParticipants((prev) =>
          prev.map((participant) =>
            participant.id === id ? { ...participant, ...data } : participant
          )
        );
        return data;
      } else {
        // Use real Supabase
        const { data, error: supabaseError } = await supabase
          .schema('forsured')
          .from('project_participants')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'updating participant');
        }

        setParticipants((prev) =>
          prev.map((participant) =>
            participant.id === id ? { ...participant, ...data } : participant
          )
        );
        return data;
      }
    } catch (err) {
      console.error('[useProjectParticipants] Error updating participant:', err);
      throw err;
    }
  };

  const removeParticipant = async (id: string) => {
    try {
      if (useMockData) {
        await MockDatabase.delete('project_participants', id);
        setParticipants((prev) =>
          prev.filter((participant) => participant.id !== id)
        );
      } else {
        // Use real Supabase
        const { error: supabaseError } = await supabase
          .schema('forsured')
          .from('project_participants')
          .delete()
          .eq('id', id);

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'removing participant');
        }

        setParticipants((prev) =>
          prev.filter((participant) => participant.id !== id)
        );
      }
    } catch (err) {
      console.error('[useProjectParticipants] Error removing participant:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [projectId]);

  return {
    participants,
    loading,
    error,
    fetchParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
  };
}
