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

import { useState, useEffect } from 'react'
import type { BrokerClient } from '../types'
import { supabaseServiceRole, core as coreQuery } from '../lib/supabase'

export function useClients(brokerOrgId?: string) {
  const [clients, setClients] = useState<BrokerClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchClients()
  }, [brokerOrgId])

  const fetchClients = async () => {
    try {
      setLoading(true)

      // Use real Supabase with core schema
      const client = supabaseServiceRole || null

      if (!client) {
        throw new Error('Supabase service role client not configured')
      }

      // TODO: Add brokerOrgId filtering via relationship table
      // For now, fetch all organizations
      const { data, error: queryError } = await coreQuery('organizations', client)
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) {
        throw queryError
      }

      setClients(data || [])
    } catch (err) {
      console.error('[useClients] Error fetching clients:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (client: Omit<BrokerClient, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const supaClient = supabaseServiceRole || null

      if (!supaClient) {
        throw new Error('Supabase service role client not configured')
      }

      // TODO REQ-212: This is a simplified implementation that only creates the organization.
      // A complete implementation needs to:
      // 1. Create the organization in core.organizations
      // 2. Create broker-client relationship in a broker_clients table
      // 3. Store additional metadata (risk_level, compliance_score, client_type, etc.)
      // For now, we only create the basic organization record.
      const { data, error: insertError } = await coreQuery('organizations', supaClient)
        .insert({
          name: client.company_name,
          // Map BrokerClient fields to organization fields where possible
          // Note: Many BrokerClient fields (risk_level, compliance_score, etc.)
          // don't exist in core.organizations and need a separate table
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      await fetchClients()
      return data
    } catch (err) {
      console.error('[useClients] Error adding client:', err)
      throw err
    }
  }

  const updateClient = async (id: string, updates: Partial<BrokerClient>) => {
    try {
      const supaClient = supabaseServiceRole || null

      if (!supaClient) {
        throw new Error('Supabase service role client not configured')
      }

      // TODO REQ-212: Similar to addClient, this is incomplete.
      // We can only update the organization name, not broker-specific fields.
      const updateData: Record<string, unknown> = {};
      if (updates.company_name) {
        updateData.name = updates.company_name;
      }

      const { data, error: updateError } = await coreQuery('organizations', supaClient)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      await fetchClients()
      return data
    } catch (err) {
      console.error('[useClients] Error updating client:', err)
      throw err
    }
  }

  return {
    clients,
    loading,
    error,
    fetchClients,
    addClient,
    updateClient,
  }
}
