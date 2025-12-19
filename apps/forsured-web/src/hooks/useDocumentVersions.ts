/**
 * Document Versions Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Uses `document_versions` table in forsured schema:
 * - id (uuid, primary key)
 * - document_id (uuid) - foreign key to document
 * - organization_id (uuid) - foreign key to scaffald.organizations
 * - version_number (integer) - version number (unique per document)
 * - file_name (text)
 * - file_size (bigint)
 * - file_url (text, nullable) - mock URL
 * - uploaded_by (uuid) - foreign key to scaffald.users
 * - uploaded_at (timestamptz)
 * - created_at (timestamptz)
 */

import { useState, useEffect, useCallback } from 'react'
import type { DocumentVersion } from '../types'
import { useDatabase } from '../contexts/DatabaseContext'
import { formatSupabaseError } from '../lib/database/formatSupabaseError'

interface UseDocumentVersionsOptions {
  documentId?: string
  uploadedBy?: string
}

export function useDocumentVersions(options: UseDocumentVersionsOptions = {}) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { supabase } = useDatabase()

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true)

      // Use real Supabase
      let query = supabase.schema('forsured').from('document_versions').select('*')

      if (options.documentId) {
        query = query.eq('document_id', options.documentId)
      }

      if (options.uploadedBy) {
        query = query.eq('uploaded_by', options.uploadedBy)
      }

      query = query.order('version_number', { ascending: false })

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching document versions')
      }

      setVersions(data || [])
    } catch (err) {
      console.error('[useDocumentVersions] Error fetching versions:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [options.documentId, options.uploadedBy, supabase])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const createVersion = async (version: Omit<DocumentVersion, 'id' | 'created_at'>) => {
    try {
      // Use real Supabase
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('document_versions')
        .insert(version)
        .select()
        .single()

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating document version')
      }

      await fetchVersions()
      return data
    } catch (err) {
      console.error('[useDocumentVersions] Error creating version:', err)
      throw err
    }
  }

  const deleteVersion = async (id: string) => {
    try {
      // Use real Supabase
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('document_versions')
        .delete()
        .eq('id', id)

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting document version')
      }

      await fetchVersions()
    } catch (err) {
      console.error('[useDocumentVersions] Error deleting version:', err)
      throw err
    }
  }

  return {
    versions,
    loading,
    error,
    fetchVersions,
    createVersion,
    deleteVersion,
  }
}
