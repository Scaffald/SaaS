/**
 * Projects Hook
 * Code Updates for Shared Database Architecture
 *
 * Manages project data from forsured.projects table.
 */

import { useState, useEffect } from 'react'
import type { Project } from '../types'
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase'

export function useProjects(clientId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [clientId])

  const fetchProjects = async () => {
    try {
      setLoading(true)

      // Use real Supabase with forsured schema
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      let query = forsuredQuery('projects', client)
        .select('*')
        .order('created_at', { ascending: false })

      // Apply client filter if provided
      if (clientId) {
        query = query.eq('organization_id', clientId)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      setProjects(data || [])
    } catch (err) {
      console.error('[useProjects] Error fetching projects:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: insertError } = await forsuredQuery('projects', client)
        .insert(project)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      await fetchProjects()
      return data
    } catch (err) {
      console.error('[useProjects] Error creating project:', err)
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: updateError } = await forsuredQuery('projects', client)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      await fetchProjects()
      return data
    } catch (err) {
      console.error('[useProjects] Error updating project:', err)
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { error: deleteError } = await forsuredQuery('projects', client).delete().eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      await fetchProjects()
    } catch (err) {
      console.error('[useProjects] Error deleting project:', err)
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  }
}
