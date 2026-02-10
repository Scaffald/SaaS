/**
 * Status History Hook
 * Code Updates for Shared Database Architecture
 *
 * Uses `status_history` table in forsured schema
 */

import { useState, useEffect, useCallback } from 'react'
import type { StatusHistory, EntityType } from '../types'
import { useDatabase } from '../contexts/DatabaseContext'
import { formatSupabaseError } from '../lib/database/formatSupabaseError'

interface UseStatusHistoryOptions {
  entityType?: EntityType
  entityId?: string
  changedBy?: string
}

export function useStatusHistory(options: UseStatusHistoryOptions = {}) {
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { supabase } = useDatabase()

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)

      // Use real Supabase
      let query = supabase.schema('forsured').from('status_history').select('*')

      if (options.entityType && options.entityId) {
        query = query.eq('entity_type', options.entityType).eq('entity_id', options.entityId)
      }

      if (options.changedBy) {
        query = query.eq('changed_by', options.changedBy)
      }

      query = query.order('created_at', { ascending: true })

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching status history')
      }

      setHistory(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [options.entityType, options.entityId, options.changedBy, supabase])

  useEffect(() => {
    if (options.entityType && options.entityId) {
      fetchHistory()
    } else {
      setLoading(false)
    }
  }, [options.entityType, options.entityId, fetchHistory])

  const createHistoryEntry = async (entry: Omit<StatusHistory, 'id' | 'created_at'>) => {
    const { data, error: supabaseError } = await supabase
      .schema('forsured')
      .from('status_history')
      .insert(entry)
      .select()
      .single()

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'creating status history entry')
    }

    await fetchHistory()
    return data
  }

  const deleteHistoryEntry = async (id: string) => {
    const { error: supabaseError } = await supabase
      .schema('forsured')
      .from('status_history')
      .delete()
      .eq('id', id)

    if (supabaseError) {
      throw formatSupabaseError(supabaseError, 'deleting status history entry')
    }

    await fetchHistory()
  }

  return {
    history,
    loading,
    error,
    fetchHistory,
    createHistoryEntry,
    deleteHistoryEntry,
  }
}
