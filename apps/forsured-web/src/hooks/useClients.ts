/**
 * Clients Hook
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Manages client/organization data from core.organizations table.
 *
 * NOTE: This hook maps core.organizations to BrokerClient interface.
 * Some BrokerClient fields (risk_level, compliance_score, client_type)
 * are not in core.organizations and use default values until a proper
 * broker_clients relationship table is implemented.
 *
 * TODO: brokerOrgId filtering requires a relationship table to connect
 * brokers to their client organizations. For now, this parameter is ignored
 * when using real Supabase.
 */

import { useState, useEffect, useCallback } from 'react'
import type { BrokerClient } from '../types'
import { supabaseServiceRole, core as coreQuery } from '../lib/supabase'

// Map organization data to BrokerClient interface
interface OrganizationRow {
  id: string;
  name: string;
  address?: unknown;
  description?: unknown;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
}

function mapOrganizationToBrokerClient(org: OrganizationRow): BrokerClient {
  return {
    id: org.id,
    broker_org_id: '', // Not available from organizations table
    client_org_id: org.id,
    company_name: org.name,
    contact_name: '', // Would need to join with users table
    contact_email: '', // Would need to join with users table
    contact_phone: '',
    // Default to 'general_contractor' - proper client_type would come from a broker_clients table
    client_type: 'general_contractor',
    // Default risk level - proper value would come from broker_clients or compliance table
    risk_level: 'low',
    // Default compliance score - proper value would come from compliance_scores table
    compliance_score: 85,
    status: 'active',
    last_activity_at: org.updated_at,
    notes: '',
    created_at: org.created_at,
    updated_at: org.updated_at,
    // Additional fields for backwards compatibility
    primary_contact: '',
  };
}

export function useClients(_brokerOrgId?: string) {
  const [clients, setClients] = useState<BrokerClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)

      // Use real Supabase with core schema
      const client = supabaseServiceRole || null

      if (!client) {
        // In test/dev environments, service role might not be configured
        // Set empty array instead of throwing to prevent console errors
        setClients([])
        setError(null)
        return
      }

      // TODO: Add brokerOrgId filtering via relationship table
      // For now, fetch all organizations
      const { data, error: queryError } = await coreQuery('organizations', client)
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) {
        // Only log if it's not a network/fetch error (which might be expected in tests)
        if (!queryError.message?.includes('Failed to fetch') && !queryError.message?.includes('NetworkError')) {
          console.error('[useClients] Error fetching clients:', queryError)
        }
        throw queryError
      }

      // Map organization data to BrokerClient interface
      const mappedClients = (data || []).map(mapOrganizationToBrokerClient)
      setClients(mappedClients)
      setError(null)
    } catch (err) {
      // Only log if it's not a network/fetch error
      const error = err as Error
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('NetworkError')) {
        console.error('[useClients] Error fetching clients:', err)
      }
      setError(error)
      setClients([]) // Set empty array on error to prevent UI breakage
    } finally {
      setLoading(false)
    }
    // TODO: Add brokerOrgId to dependency array when filtering is implemented
  }, [])

  useEffect(() => {
    fetchClients()
    // Note: brokerOrgId filtering will be added when relationship table is implemented
  }, [fetchClients])

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
