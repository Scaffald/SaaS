/**
 * Bids Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `bids` table in forsured schema:
 * - id (uuid, primary key)
 * - project_id (uuid) - foreign key to forsured.projects
 * - subcontractor_id (uuid) - foreign key to scaffald.organizations
 * - bid_amount (decimal)
 * - scope_of_work (text)
 * - proposed_timeline (jsonb)
 * - documents (jsonb)
 * - submitted_at (timestamptz)
 * - status (text) - draft, submitted, under_review, awarded, rejected
 * - compliance_score (integer)
 * - coverage_gaps (jsonb)
 * - risk_assessment (text)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import { BidProposal } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseBidsOptions {
  projectId?: string;
  subcontractorId?: string;
  status?: BidProposal['status'];
}

export function useBids(options: UseBidsOptions = {}) {
  const [bids, setBids] = useState<BidProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchBids();
  }, [options.projectId, options.subcontractorId, options.status]);

  const fetchBids = async () => {
    try {
      setLoading(true);

      let query = supabase.schema('forsured').from('bids').select('*');

      if (options.projectId) {
        query = query.eq('project_id', options.projectId);
      }

      if (options.subcontractorId) {
        query = query.eq('subcontractor_id', options.subcontractorId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('submitted_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching bids');
      }

      setBids(data || []);
    } catch (err) {
      console.error('[useBids] Error fetching bids:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createBid = async (
    bid: Omit<BidProposal, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('bids')
        .insert(bid)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating bid');
      }

      await fetchBids();
      return data;
    } catch (err) {
      console.error('[useBids] Error creating bid:', err);
      throw err;
    }
  };

  const updateBid = async (id: string, updates: Partial<BidProposal>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('bids')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'updating bid');
      }

      await fetchBids();
      return data;
    } catch (err) {
      console.error('[useBids] Error updating bid:', err);
      throw err;
    }
  };

  const deleteBid = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('bids')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting bid');
      }

      await fetchBids();
    } catch (err) {
      console.error('[useBids] Error deleting bid:', err);
      throw err;
    }
  };

  return {
    bids,
    loading,
    error,
    fetchBids,
    createBid,
    updateBid,
    deleteBid,
  };
}
