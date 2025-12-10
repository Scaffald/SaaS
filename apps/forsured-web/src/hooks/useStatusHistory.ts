/**
 * Status History Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `status_history` table in forsured schema
 */

import { useState, useEffect } from 'react';
import { StatusHistory, EntityType } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import MockDatabase from '../utils/mockDataStore';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseStatusHistoryOptions {
  entityType?: EntityType;
  entityId?: string;
  changedBy?: string;
}

export function useStatusHistory(options: UseStatusHistoryOptions = {}) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { useMockData, supabase } = useDatabase();

  useEffect(() => {
    if (options.entityType && options.entityId) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [options.entityType, options.entityId, options.changedBy]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        const filters: Record<string, unknown> = {};

        if (options.entityType && options.entityId) {
          filters.entity_type = options.entityType;
          filters.entity_id = options.entityId;
        }

        if (options.changedBy) {
          filters.changed_by = options.changedBy;
        }

        const data = await MockDatabase.query<StatusHistory>(
          'status_history',
          filters,
          { column: 'created_at', ascending: true }
        );
        setHistory(data);
      } else {
        // Use real Supabase
        let query = supabase
          .schema('forsured')
          .from('status_history')
          .select('*');

        if (options.entityType && options.entityId) {
          query = query
            .eq('entity_type', options.entityType)
            .eq('entity_id', options.entityId);
        }

        if (options.changedBy) {
          query = query.eq('changed_by', options.changedBy);
        }

        query = query.order('created_at', { ascending: true });

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw formatSupabaseError(supabaseError, 'fetching status history');
        }

        setHistory(data || []);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createHistoryEntry = async (
    entry: Omit<StatusHistory, 'id' | 'created_at'>
  ) => {
    if (useMockData) {
      const data = await MockDatabase.insert<StatusHistory>(
        'status_history',
        entry
      );
      await fetchHistory();
      return data;
    } else {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('status_history')
        .insert(entry)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating status history entry');
      }

      await fetchHistory();
      return data;
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    if (useMockData) {
      await MockDatabase.delete('status_history', id);
      await fetchHistory();
    } else {
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('status_history')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting status history entry');
      }

      await fetchHistory();
    }
  };

  return {
    history,
    loading,
    error,
    fetchHistory,
    createHistoryEntry,
    deleteHistoryEntry,
  };
}
