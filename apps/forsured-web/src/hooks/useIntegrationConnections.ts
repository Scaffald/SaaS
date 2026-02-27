/**
 * Integration Connections Hook
 * Code Updates for Shared Database Architecture
 *
 * Uses `integration_connections` table in forsured schema:
 * - id (uuid, primary key)
 * - integration_id (uuid) - foreign key to forsured.integrations
 * - user_id (uuid) - foreign key to forsured.users
 * - status (text) - active, inactive, error
 * - auth_method (text) - oauth2, api_key, basic
 * - credentials (jsonb) - encrypted authentication credentials
 * - sync_settings (jsonb) - data_types, frequency, initial_sync
 * - last_sync (timestamptz)
 * - error_message (text)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import { IntegrationConnection, ConnectionStatus } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseIntegrationConnectionsOptions {
  userId?: string;
  integrationId?: string;
  status?: ConnectionStatus;
}

export function useIntegrationConnections(
  options: UseIntegrationConnectionsOptions = {}
) {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.userId, options.integrationId, options.status]);

  const fetchConnections = async () => {
    try {
      setLoading(true);

      let query = supabase.schema('forsured').from('integration_connections').select('*');

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.integrationId) {
        query = query.eq('integration_id', options.integrationId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'fetching integration connections');
      }

      setConnections(data || []);
    } catch (err) {
      console.error('[useIntegrationConnections] Error fetching connections:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createConnection = async (
    connection: Omit<IntegrationConnection, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('integration_connections')
        .insert(connection)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'creating integration connection');
      }

      await fetchConnections();
      return data;
    } catch (err) {
      console.error('[useIntegrationConnections] Error creating connection:', err);
      throw err;
    }
  };

  const updateConnection = async (
    id: string,
    updates: Partial<IntegrationConnection>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('integration_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'updating integration connection');
      }

      await fetchConnections();
      return data;
    } catch (err) {
      console.error('[useIntegrationConnections] Error updating connection:', err);
      throw err;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .schema('forsured')
        .from('integration_connections')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw formatSupabaseError(supabaseError, 'deleting integration connection');
      }

      await fetchConnections();
    } catch (err) {
      console.error('[useIntegrationConnections] Error deleting connection:', err);
      throw err;
    }
  };

  return {
    connections,
    loading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
  };
}
