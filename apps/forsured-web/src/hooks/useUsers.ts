/**
 * Users Hook
 *
 * Manages user data from forsured.users table.
 *
 * TODO: Role filtering requires join with forsured.role_assignments table.
 * For now, role parameter is ignored when using real Supabase.
 */

import { useState, useEffect } from 'react'
import type { User } from '../types'
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase'

export function useUsers(role?: 'broker' | 'manager' | 'subcontractor') {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [role])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Use real Supabase with forsured schema
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      // TODO: Add role filtering via join with forsured.role_assignments
      // For now, fetch all users ordered by display_name or username
      // Note: forsured.users doesn't have a 'name' column - use display_name or username
      const { data, error: queryError } = await forsuredQuery('users', client)
        .select('*')
        .order('display_name', { ascending: true, nullsFirst: false })

      if (queryError) {
        throw queryError
      }

      setUsers(data || [])
    } catch (err) {
      console.error('[useUsers] Error fetching users:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
  }
}
