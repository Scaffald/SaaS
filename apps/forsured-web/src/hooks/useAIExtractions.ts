/**
 * AI Extractions Hook
 * Code Updates for Shared Database Architecture
 *
 * Uses `ai_extractions` table in forsured schema:
 * - id (uuid, primary key)
 * - document_id (uuid) - foreign key to documents
 * - policy_number (text)
 * - carrier (text)
 * - coverage_amounts (jsonb) - array of {type, amount}
 * - effective_date (timestamptz)
 * - expiry_date (timestamptz)
 * - named_insureds (jsonb) - array of strings
 * - confidence (integer) - 0-100
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import { AIExtractedFields } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseAIExtractionsOptions {
  documentId?: string;
}

export function useAIExtractions(options: UseAIExtractionsOptions = {}) {
  const [extractions, setExtractions] = useState<AIExtractedFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    if (options.documentId) {
      fetchExtractions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.documentId]);

  const fetchExtractions = async () => {
    try {
      setLoading(true);

      let query = supabase.schema('forsured').from('ai_extractions').select('*');

      if (options.documentId) {
        query = query.eq('document_id', options.documentId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching AI extractions');
      }

      setExtractions(data || []);
    } catch (err) {
      console.error('[useAIExtractions] Error fetching extractions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createExtraction = async (
    extraction: Omit<AIExtractedFields, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('ai_extractions')
        .insert(extraction)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating AI extraction');
      }

      await fetchExtractions();
      return data;
    } catch (err) {
      console.error('[useAIExtractions] Error creating extraction:', err);
      throw err;
    }
  };

  const updateExtraction = async (
    id: string,
    updates: Partial<AIExtractedFields>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('ai_extractions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'updating AI extraction');
      }

      await fetchExtractions();
      return data;
    } catch (err) {
      console.error('[useAIExtractions] Error updating extraction:', err);
      throw err;
    }
  };

  const deleteExtraction = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('ai_extractions')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting AI extraction');
      }

      await fetchExtractions();
    } catch (err) {
      console.error('[useAIExtractions] Error deleting extraction:', err);
      throw err;
    }
  };

  // Mock AI extraction function
  const mockExtractFields = async (
    documentId: string
  ): Promise<AIExtractedFields> => {
    // Simulate AI processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 1000)
    );

    const extraction: Omit<
      AIExtractedFields,
      'id' | 'created_at' | 'updated_at'
    > = {
      document_id: documentId,
      policy_number: `POL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      carrier: ['State Farm', 'Allstate', 'Liberty Mutual', 'Travelers'][
        Math.floor(Math.random() * 4)
      ],
      coverage_amounts: [
        { type: 'GL', amount: 1000000 + Math.floor(Math.random() * 1000000) },
        { type: 'WC', amount: 1000000 },
      ],
      effective_date: new Date().toISOString(),
      expiry_date: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      named_insureds: ['ABC Construction Inc.'],
      confidence: 85 + Math.floor(Math.random() * 15), // 85-100%
    };

    return await createExtraction(extraction);
  };

  return {
    extractions,
    loading,
    error,
    fetchExtractions,
    createExtraction,
    updateExtraction,
    deleteExtraction,
    mockExtractFields,
  };
}
