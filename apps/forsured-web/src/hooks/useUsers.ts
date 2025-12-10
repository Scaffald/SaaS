/**
 * Users Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages user data from core.users table.
 *
 * TODO: Role filtering requires join with core.role_assignments table.
 * For now, role parameter is ignored when using real Supabase.
 */

import { useState, useEffect } from 'react';
import { User } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { supabaseServiceRole, core as coreQuery } from '../lib/supabase';
import MockDatabase from '../utils/mockDataStore';

export function useUsers(role?: 'broker' | 'manager' | 'subcontractor') {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { useMockData } = useDatabase();

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        // Use mock database
        const filters = role ? { role } : {};
        const data = await MockDatabase.query<User>('users', filters, {
          column: 'name',
          ascending: true,
        });
        setUsers(data);
      } else {
        // Use real Supabase with core schema
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        // TODO: Add role filtering via join with core.role_assignments
        // For now, fetch all users ordered by name
        const { data, error: queryError } = await coreQuery('users', client)
          .select('*')
          .order('name', { ascending: true, nullsFirst: false });

        if (queryError) {
          throw queryError;
        }

        setUsers(data || []);
      }
    } catch (err) {
      console.error('[useUsers] Error fetching users:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
}
