/**
 * User Invitations Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `user_invitations` table in forsured schema
 */

import { useState, useEffect } from 'react';
import { UserInvitation } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseUserInvitationsOptions {
  status?: UserInvitation['status'];
  invitedBy?: string;
}

export function useUserInvitations(options: UseUserInvitationsOptions = {}) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchInvitations();
  }, [options.status, options.invitedBy]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);

      let query = supabase
        .schema('forsured')
        .from('user_invitations')
        .select('*');

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.invitedBy) {
        query = query.eq('invited_by', options.invitedBy);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching invitations');
      }

      setInvitations(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (
    invitation: Omit<UserInvitation, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error: supabaseError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .insert(invitation)
      .select()
      .single();

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'creating invitation');
    }

    await fetchInvitations();
    return data;
  };

  const updateInvitation = async (
    id: string,
    updates: Partial<UserInvitation>
  ) => {
    const { data, error: supabaseError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'updating invitation');
    }

    await fetchInvitations();
    return data;
  };

  const deleteInvitation = async (id: string) => {
    const { error: supabaseError } = await supabase
      .schema('forsured')
      .from('user_invitations')
      .delete()
      .eq('id', id);

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'deleting invitation');
    }

    await fetchInvitations();
  };

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    createInvitation,
    updateInvitation,
    deleteInvitation,
  };
}
