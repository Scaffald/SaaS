/**
 * Compliance Issues Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `compliance_issues` table in forsured schema:
 * - id (uuid, primary key)
 * - subcontractor_id (uuid) - foreign key to forsured.subcontractors
 * - project_id (uuid) - foreign key to forsured.projects
 * - issue_type (text)
 * - description (text)
 * - severity (text) - low, medium, high, critical
 * - status (text) - open, in_progress, resolved, closed
 * - detected_date (date)
 * - resolved_date (date, nullable)
 * - created_by (uuid) - foreign key to scaffald.users
 * - organization_id (uuid) - foreign key to scaffald.organizations
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect, useCallback } from 'react'
import type { ComplianceIssue, SeverityLevel } from '../types'
import { useDatabase } from '../contexts/DatabaseContext'
import { formatSupabaseError } from '../lib/database/formatSupabaseError'

interface UseComplianceIssuesOptions {
  subcontractorId?: string
  projectId?: string
  status?: ComplianceIssue['status']
  severity?: SeverityLevel
}

export function useComplianceIssues(options: UseComplianceIssuesOptions = {}) {
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { supabase } = useDatabase()

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true)

      // Use real Supabase
      let query = supabase.schema('forsured').from('compliance_issues').select('*')

      if (options.subcontractorId) {
        query = query.eq('subcontractor_id', options.subcontractorId)
      }

      if (options.projectId) {
        query = query.eq('project_id', options.projectId)
      }

      if (options.status) {
        query = query.eq('status', options.status)
      }

      if (options.severity) {
        query = query.eq('severity', options.severity)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching compliance issues')
      }

      setIssues(data || [])
    } catch (err) {
      console.error('[useComplianceIssues] Error fetching issues:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [options.subcontractorId, options.projectId, options.status, options.severity, supabase])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const createIssue = async (issue: Omit<ComplianceIssue, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Use real Supabase
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('compliance_issues')
        .insert(issue)
        .select()
        .single()

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating compliance issue')
      }

      await fetchIssues()
      return data
    } catch (err) {
      console.error('[useComplianceIssues] Error creating issue:', err)
      throw err
    }
  }

  const updateIssue = async (id: string, updates: Partial<ComplianceIssue>) => {
    try {
      // Use real Supabase
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('compliance_issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'updating compliance issue')
      }

      await fetchIssues()
      return data
    } catch (err) {
      console.error('[useComplianceIssues] Error updating issue:', err)
      throw err
    }
  }

  const deleteIssue = async (id: string) => {
    try {
      // Use real Supabase
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('compliance_issues')
        .delete()
        .eq('id', id)

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting compliance issue')
      }

      await fetchIssues()
    } catch (err) {
      console.error('[useComplianceIssues] Error deleting issue:', err)
      throw err
    }
  }

  return {
    issues,
    loading,
    error,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
  }
}
