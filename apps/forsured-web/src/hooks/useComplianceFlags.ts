/**
 * Compliance Flags Hook
 * Policy & Endorsement Level Flags
 *
 * Manages compliance flags for policies, provisions, and endorsements
 * using a polymorphic entity reference pattern.
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  ComplianceFlag,
  CreateComplianceFlagRequest,
  UpdateComplianceFlagRequest,
  FlaggableEntityType,
  FlagStatus,
} from '../types'
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase'

export interface ComplianceFlagsFilter {
  entity_type?: FlaggableEntityType
  entity_id?: string
  status?: FlagStatus
  project_id?: string
  subcontractor_id?: string
  severity?: 'info' | 'warning' | 'critical'
}

export function useComplianceFlags(initialFilters?: ComplianceFlagsFilter) {
  const [flags, setFlags] = useState<ComplianceFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFlags = useCallback(async (filters?: ComplianceFlagsFilter) => {
    try {
      setLoading(true)
      setError(null)

      // Use real Supabase with forsured schema
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      let query = forsuredQuery('compliance_flags', client)
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }
      if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters?.subcontractor_id) {
        query = query.eq('subcontractor_id', filters.subcontractor_id)
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      setFlags((data as ComplianceFlag[]) || [])
    } catch (err) {
      console.error('[useComplianceFlags] Error fetching flags:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlags(initialFilters)
  }, [fetchFlags, initialFilters])

  /**
   * Get flags for a specific entity (policy, provision, or endorsement)
   */
  const getFlagsByEntity = useCallback(
    async (entityType: FlaggableEntityType, entityId: string): Promise<ComplianceFlag[]> => {
      try {
        const client = supabaseServiceRole || null

        if (!client) {
          throw new Error('Supabase service role client not configured')
        }

        const { data, error: queryError } = await forsuredQuery('compliance_flags', client)
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .order('created_at', { ascending: false })

        if (queryError) {
          throw queryError
        }

        return (data as ComplianceFlag[]) || []
      } catch (err) {
        console.error('[useComplianceFlags] Error fetching flags by entity:', err)
        throw err
      }
    },
    []
  )

  /**
   * Get a single flag by ID
   */
  const getFlagById = useCallback(async (flagId: string): Promise<ComplianceFlag | null> => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: queryError } = await forsuredQuery('compliance_flags', client)
        .select('*')
        .eq('id', flagId)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          return null // Not found
        }
        throw queryError
      }

      return data as ComplianceFlag
    } catch (err) {
      console.error('[useComplianceFlags] Error fetching flag by ID:', err)
      throw err
    }
  }, [])

  /**
   * Create a new compliance flag
   */
  const createFlag = useCallback(
    async (request: CreateComplianceFlagRequest): Promise<ComplianceFlag> => {
      // Validate entity_type
      const validEntityTypes: FlaggableEntityType[] = ['policy', 'provision', 'endorsement']
      if (!validEntityTypes.includes(request.entity_type)) {
        throw new Error(`Invalid entity_type. Must be one of: ${validEntityTypes.join(', ')}`)
      }

      // Validate required fields
      if (!request.entity_id) {
        throw new Error('entity_id is required')
      }
      if (!request.flag_type) {
        throw new Error('flag_type is required')
      }
      if (!request.title) {
        throw new Error('title is required')
      }

      try {
        const flagData = {
          ...request,
          severity: request.severity || 'warning',
          status: 'active' as FlagStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const client = supabaseServiceRole || null

        if (!client) {
          throw new Error('Supabase service role client not configured')
        }

        const { data, error: insertError } = await forsuredQuery('compliance_flags', client)
          .insert(flagData)
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        await fetchFlags(initialFilters)
        return data as ComplianceFlag
      } catch (err) {
        console.error('[useComplianceFlags] Error creating flag:', err)
        throw err
      }
    },
    [fetchFlags, initialFilters]
  )

  /**
   * Update an existing compliance flag
   */
  const updateFlag = useCallback(
    async (flagId: string, updates: UpdateComplianceFlagRequest): Promise<ComplianceFlag> => {
      try {
        const updateData = {
          ...updates,
          updated_at: new Date().toISOString(),
          // If status is being changed to resolved, set resolved_at
          ...(updates.status === 'resolved' && {
            resolved_at: new Date().toISOString(),
          }),
        }

        const client = supabaseServiceRole || null

        if (!client) {
          throw new Error('Supabase service role client not configured')
        }

        const { data, error: updateError } = await forsuredQuery('compliance_flags', client)
          .update(updateData)
          .eq('id', flagId)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        await fetchFlags(initialFilters)
        return data as ComplianceFlag
      } catch (err) {
        console.error('[useComplianceFlags] Error updating flag:', err)
        throw err
      }
    },
    [fetchFlags, initialFilters]
  )

  /**
   * Resolve a flag (convenience method)
   */
  const resolveFlag = useCallback(
    async (flagId: string, resolutionNotes?: string): Promise<ComplianceFlag> => {
      return updateFlag(flagId, {
        status: 'resolved',
        resolution_notes: resolutionNotes,
      })
    },
    [updateFlag]
  )

  /**
   * Dismiss a flag (convenience method)
   */
  const dismissFlag = useCallback(
    async (flagId: string, reason?: string): Promise<ComplianceFlag> => {
      return updateFlag(flagId, {
        status: 'dismissed',
        resolution_notes: reason,
      })
    },
    [updateFlag]
  )

  /**
   * Delete a compliance flag
   */
  const deleteFlag = useCallback(
    async (flagId: string): Promise<void> => {
      try {
        const client = supabaseServiceRole || null

        if (!client) {
          throw new Error('Supabase service role client not configured')
        }

        const { error: deleteError } = await forsuredQuery('compliance_flags', client)
          .delete()
          .eq('id', flagId)

        if (deleteError) {
          throw deleteError
        }

        await fetchFlags(initialFilters)
      } catch (err) {
        console.error('[useComplianceFlags] Error deleting flag:', err)
        throw err
      }
    },
    [fetchFlags, initialFilters]
  )

  /**
   * Get active flags count for an entity
   */
  const getActiveFlagsCount = useCallback(
    async (entityType: FlaggableEntityType, entityId: string): Promise<number> => {
      try {
        const entityFlags = await getFlagsByEntity(entityType, entityId)
        return entityFlags.filter((f) => f.status === 'active').length
      } catch (err) {
        console.error('[useComplianceFlags] Error getting active flags count:', err)
        return 0
      }
    },
    [getFlagsByEntity]
  )

  return {
    flags,
    loading,
    error,
    fetchFlags,
    getFlagsByEntity,
    getFlagById,
    createFlag,
    updateFlag,
    resolveFlag,
    dismissFlag,
    deleteFlag,
    getActiveFlagsCount,
  }
}
