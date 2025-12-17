/**
 * Tasks Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages task data from forsured.tasks table with cross-schema
 * references to scaffald.users for assignment tracking.
 */

import { useState, useEffect } from 'react'
import type { Task, TaskStatus } from '../types'
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase'

interface UseTasksOptions {
  userId?: string
  status?: TaskStatus
  role?: 'created' | 'assigned'
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [options.userId, options.status, options.role])

  const fetchTasks = async () => {
    try {
      setLoading(true)

      // Use real Supabase with forsured schema
      // NOTE: Using service role client for testing (bypasses RLS)
      // TODO: Replace with proper authentication once OAuth is set up
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      // NOTE: Cross-schema joins to scaffald.users are not yet supported
      // For now, just fetch task data without joined fields
      let query = forsuredQuery('tasks', client)
        .select('*')
        .order('created_at', { ascending: false })

      // Apply user filters
      if (options.userId && options.role === 'created') {
        query = query.eq('created_by_user_id', options.userId)
      } else if (options.userId && options.role === 'assigned') {
        query = query.eq('assigned_to_user_id', options.userId)
      } else if (options.userId) {
        query = query.or(
          `created_by_user_id.eq.${options.userId},assigned_to_user_id.eq.${options.userId}`
        )
      }

      // Apply status filter
      if (options.status) {
        query = query.eq('status', options.status)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      setTasks(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('[useTasks] Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: insertError } = await forsuredQuery('tasks', client)
        .insert(task)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      await fetchTasks()
      return data
    } catch (err) {
      console.error('[useTasks] Error creating task:', err)
      throw err
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { data, error: updateError } = await forsuredQuery('tasks', client)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      await fetchTasks()
      return data
    } catch (err) {
      console.error('[useTasks] Error updating task:', err)
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      const { error: deleteError } = await forsuredQuery('tasks', client).delete().eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      await fetchTasks()
    } catch (err) {
      console.error('[useTasks] Error deleting task:', err)
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  }
}
