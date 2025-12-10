/**
 * Clients Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages client/organization data from core.organizations table.
 *
 * TODO: brokerOrgId filtering requires a relationship table to connect
 * brokers to their client organizations. For now, this parameter is ignored
 * when using real Supabase.
 */

import { useState, useEffect } from 'react';
import { BrokerClient } from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { supabaseServiceRole, core as coreQuery } from '../lib/supabase';
import MockDatabase from '../utils/mockDataStore';

export function useClients(brokerOrgId?: string) {
  const [clients, setClients] = useState<BrokerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { useMockData } = useDatabase();

  useEffect(() => {
    fetchClients();
  }, [brokerOrgId]);

  const fetchClients = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        // Use mock database
        const filters = brokerOrgId ? { broker_org_id: brokerOrgId } : {};
        const data = await MockDatabase.query<BrokerClient>('clients', filters, {
          column: 'created_at',
          ascending: false,
        });
        setClients(data);
      } else {
        // Use real Supabase with core schema
        const client = supabaseServiceRole || null;

        if (!client) {
          throw new Error('Supabase service role client not configured');
        }

        // TODO: Add brokerOrgId filtering via relationship table
        // For now, fetch all organizations
        const { data, error: queryError } = await coreQuery('organizations', client)
          .select('*')
          .order('created_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        setClients(data || []);
      }
    } catch (err) {
      console.error('[useClients] Error fetching clients:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (
    client: Omit<BrokerClient, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.insert<BrokerClient>('clients', client);
        await fetchClients();
        return data;
      } else {
        const supaClient = supabaseServiceRole || null;

        if (!supaClient) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: insertError } = await coreQuery('organizations', supaClient)
          .insert({ name: client.name })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        await fetchClients();
        return data;
      }
    } catch (err) {
      console.error('[useClients] Error adding client:', err);
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<BrokerClient>) => {
    try {
      if (useMockData) {
        const data = await MockDatabase.update<BrokerClient>(
          'clients',
          id,
          updates
        );
        await fetchClients();
        return data;
      } else {
        const supaClient = supabaseServiceRole || null;

        if (!supaClient) {
          throw new Error('Supabase service role client not configured');
        }

        const { data, error: updateError } = await coreQuery('organizations', supaClient)
          .update({ name: updates.name })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        await fetchClients();
        return data;
      }
    } catch (err) {
      console.error('[useClients] Error updating client:', err);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    fetchClients,
    addClient,
    updateClient,
  };
}
