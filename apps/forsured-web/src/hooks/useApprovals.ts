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
import MockDatabase from '../utils/mockDataStore';
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
  const { useMockData, supabase } = useDatabase();

  useEffect(() => {
    fetchApprovals();
  }, [options.status, options.type, options.requestedBy, options.projectId]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        // Use mock database
        const filters: Record<string, unknown> = {};

        if (options.status) {
          filters.status = options.status;
        }

        if (options.type) {
          filters.type = options.type;
        }

        if (options.requestedBy) {
          filters.requested_by = options.requestedBy;
        }

        let data = await MockDatabase.query<ApprovalItem>(
          'approval_items',
          filters,
          { column: 'requested_at', ascending: false }
        );

        // Filter by projectId if provided (in related_items)
        if (options.projectId) {
          data = data.filter(
            (approval) => approval.related_items?.project_id === options.projectId
          );
        }

        setApprovals(data);
      } else {
        // Use real Supabase
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
          throw formatSupabaseError(supabaseError, 'fetching approvals');
        }

        setApprovals(data || []);
      }
    } catch (err) {
      console.error('[useApprovals] Error fetching approvals:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createApproval = async (
    approval: Omit<ApprovalItem, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<ApprovalItem>(
          'approval_items',
          approval
        );
        await fetchApprovals();
        return data;
      } else {
        // Use real Supabase
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
      }
    } catch (err) {
      console.error('[useApprovals] Error creating approval:', err);
      throw err;
    }
  };

  const updateApproval = async (id: string, updates: Partial<ApprovalItem>) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.update<ApprovalItem>(
          'approval_items',
          id,
          updates
        );
        await fetchApprovals();
        return data;
      } else {
        // Use real Supabase
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
      }
    } catch (err) {
      console.error('[useApprovals] Error updating approval:', err);
      throw err;
    }
  };

  const deleteApproval = async (id: string) => {
    try {
      if (useMockData) {
        await MockDatabase.delete('approval_items', id);
        await fetchApprovals();
      } else {
        // Use real Supabase
        const { error: supabaseError } = await supabase
          .schema('forsured')
          .from('approvals')
          .delete()
          .eq('id', id);

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'deleting approval');
        }

        await fetchApprovals();
      }
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
