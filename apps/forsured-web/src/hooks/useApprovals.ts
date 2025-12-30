/**
 * Approvals Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `approvals` table in forsured schema:
 * - id (uuid, primary key)
 * - organization_id (uuid) - foreign key to scaffald.organizations
 * - type (text) - endorsement_review, waiver_request, policy_renewal, etc.
 * - title (text)
 * - description (text)
 * - requested_by (uuid) - foreign key to scaffald.users
 * - requested_at (timestamptz)
 * - due_date (timestamptz, nullable)
 * - priority (text) - urgent, high, normal, low
 * - status (text) - pending, approved, rejected, expired
 * - related_items (jsonb) - { project_id?, client_id?, document_id?, user_id? }
 * - metadata (jsonb)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import { ApprovalItem, ApprovalItemStatus, ApprovalItemType } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseApprovalsOptions {
  status?: ApprovalItemStatus;
  type?: ApprovalItemType;
  requestedBy?: string;
  projectId?: string;
}

export function useApprovals(options: UseApprovalsOptions = {}) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchApprovals();
  }, [options.status, options.type, options.requestedBy, options.projectId]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      let query = supabase.schema('forsured').from('approvals').select('*');

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.requestedBy) {
        query = query.eq('requested_by', options.requestedBy);
      }

      // Filter by projectId in related_items JSONB column
      if (options.projectId) {
        query = query.eq('related_items->project_id', options.projectId);
      }

      query = query.order('requested_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        // Handle missing table errors (should be caught by global test setup, but handle just in case)
        if (supabaseError.code === '42P01' || supabaseError.code === 'PGRST116') {
          console.error('[useApprovals] Approvals table does not exist - this should be caught by test setup');
          setError(formatSupabaseError(supabaseError, 'fetching approvals'));
          return;
        }

        // Handle RLS/permission errors gracefully (user may not have role assignments yet)
        // These are expected in some scenarios (e.g., user not fully onboarded)
        if (
          supabaseError.code === '42501' || // Insufficient privilege
          supabaseError.message?.includes('permission denied') ||
          supabaseError.message?.includes('row-level security') ||
          supabaseError.message?.includes('policy violation')
        ) {
          console.warn('[useApprovals] Permission denied - user may not have role assignments:', supabaseError.message);
          setApprovals([]); // Return empty array for permission errors
          setError(null); // Don't set error state for permission issues
          return;
        }

        // For other errors, set error state but don't crash the UI
        console.error('[useApprovals] Error fetching approvals:', supabaseError);
        setError(formatSupabaseError(supabaseError, 'fetching approvals'));
        setApprovals([]); // Return empty array to prevent UI breakage
        return;
      }

      setApprovals(data || []);
      setError(null);
    } catch (err) {
      console.error('[useApprovals] Unexpected error fetching approvals:', err);
      setError(err as Error);
      setApprovals([]); // Return empty array to prevent UI breakage
    } finally {
      setLoading(false);
    }
  };

  const createApproval = async (
    approval: Omit<ApprovalItem, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('approvals')
        .insert(approval)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating approval');
      }

      await fetchApprovals();
      return data;
    } catch (err) {
      console.error('[useApprovals] Error creating approval:', err);
      throw err;
    }
  };

  const updateApproval = async (id: string, updates: Partial<ApprovalItem>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('approvals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'updating approval');
      }

      await fetchApprovals();
      return data;
    } catch (err) {
      console.error('[useApprovals] Error updating approval:', err);
      throw err;
    }
  };

  const deleteApproval = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('approvals')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting approval');
      }

      await fetchApprovals();
    } catch (err) {
      console.error('[useApprovals] Error deleting approval:', err);
      throw err;
    }
  };

  return {
    approvals,
    loading,
    error,
    fetchApprovals,
    createApproval,
    updateApproval,
    deleteApproval,
  };
}
