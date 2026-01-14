/**
 * Compliance Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages compliance score data from forsured.compliance_scores table.
 */

import { useState, useEffect, useCallback } from 'react'
import type { ComplianceRecord } from '../types'
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase'

export function useCompliance(clientId?: string) {
  const [compliance, setCompliance] = useState<ComplianceRecord | null>(null)
  // Only start loading if we have a clientId to fetch
  const [loading, setLoading] = useState(!!clientId)
  const [error, setError] = useState<Error | null>(null)

  const fetchCompliance = useCallback(async () => {
    if (!clientId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Use real Supabase with forsured schema
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: queryError } = await forsuredQuery('compliance_scores', client)
        .select('*')
        .eq('organization_id', clientId)
        .limit(1)
        .single()

      if (queryError && queryError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - not an error for this use case
        throw queryError
      }

      setCompliance(data || null)
    } catch (err) {
      console.error('[useCompliance] Error fetching compliance:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      fetchCompliance()
    }
  }, [clientId, fetchCompliance])

  const updateCompliance = async (updates: Partial<ComplianceRecord>) => {
    if (!clientId || !compliance) return

    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: updateError } = await forsuredQuery('compliance_scores', client)
        .update(updates)
        .eq('id', compliance.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setCompliance(data)
      return data
    } catch (err) {
      console.error('[useCompliance] Error updating compliance:', err)
      throw err
    }
  }

  const createCompliance = async (
    record: Omit<ComplianceRecord, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: insertError } = await forsuredQuery('compliance_scores', client)
        .insert(record)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      setCompliance(data)
      return data
    } catch (err) {
      console.error('[useCompliance] Error creating compliance:', err)
      throw err
    }
  }

  return {
    compliance,
    loading,
    error,
    fetchCompliance,
    updateCompliance,
    createCompliance,
  }
}
