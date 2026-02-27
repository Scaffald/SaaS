/**
 * Clients Hook
 *
 * Fetches broker's clients from relationship_invitations table.
 * Clients can be:
 * - Managers (General Contractors / GCs)
 * - Contractors (Subcontractors)
 *
 * The hook queries connected relationships where the broker is either
 * the inviter or invitee, and the other party is a manager or subcontractor.
 */

import { useState, useEffect, useCallback } from 'react'
import type { BrokerClient, ClientType } from '../types'
import { supabaseServiceRole, forsured as forsuredQuery } from '../lib/supabase'

// Relationship invitation row from the database
interface RelationshipInvitationRow {
  id: string;
  inviter_org_id: string;
  inviter_type: "broker" | "manager" | "subcontractor";
  invitee_org_id: string | null;
  invitee_type: "broker" | "manager" | "subcontractor";
  invitee_email: string;
  invitee_name: string | null;
  invitee_company: string | null;
  status: string;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

// Organization row from forsured schema
interface OrganizationRow {
  id: string;
  name: string;
  address?: unknown;
  description?: unknown;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
}

// User set type row from forsured schema
interface UserSetTypeRow {
  id: string;
  name: string;
  slug: string;
  manager_label_singular: string;
  manager_label_plural: string;
  contractor_label_singular: string;
  contractor_label_plural: string;
}

// User profile row from forsured schema
interface UserProfileRow {
  scaffald_user_id: string;
  user_set_type_id: string | null;
  user_set_types?: UserSetTypeRow;
}

/**
 * Map connection type to client type
 * - 'manager' -> 'general_contractor'
 * - 'subcontractor' -> 'subcontractor'
 */
function getClientType(
  connectionType: "manager" | "subcontractor",
): ClientType {
  return connectionType === "manager" ? "general_contractor" : "subcontractor";
}

/**
 * Create a BrokerClient from relationship and organization data
 */
function createBrokerClient(
  org: OrganizationRow,
  brokerOrgId: string,
  clientType: ClientType,
  invitation: RelationshipInvitationRow,
  userSetType?: UserSetTypeRow | null,
): BrokerClient {
  return {
    id: org.id,
    broker_org_id: brokerOrgId,
    client_org_id: org.id,
    company_name: org.name,
    contact_name: invitation.invitee_name || "",
    contact_email: invitation.invitee_email || "",
    contact_phone: "",
    client_type: clientType,
    // Default risk level - would come from compliance analysis
    risk_level: "low",
    // Default compliance score - would come from compliance_scores table
    compliance_score: 85,
    status: "active",
    last_activity_at: org.updated_at,
    notes: "",
    created_at: org.created_at,
    updated_at: org.updated_at,
    primary_contact: invitation.invitee_name || "",
    // Lexicon information from user set type
    user_set_type_id: userSetType?.id || null,
    manager_label_singular: userSetType?.manager_label_singular ||
      "General Contractor",
    manager_label_plural: userSetType?.manager_label_plural ||
      "General Contractors",
    contractor_label_singular: userSetType?.contractor_label_singular ||
      "Subcontractor",
    contractor_label_plural: userSetType?.contractor_label_plural ||
      "Subcontractors",
  };
}

export function useClients(brokerOrgId?: string) {
  const [clients, setClients] = useState<BrokerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const client = supabaseServiceRole || null;

      if (!client) {
        setClients([]);
        setError(null);
        return;
      }

      // If no brokerOrgId provided, we can't filter by broker
      // Fall back to fetching all organizations (for backwards compatibility)
      if (!brokerOrgId) {
        const { data: orgs, error: orgError } = await forsuredQuery('organizations', client)
          .select('*')
          .order('created_at', { ascending: false });

        if (orgError) throw orgError;

        // Map all orgs as GCs (default) when no broker context
        const mappedClients = (orgs || []).map((
          org: OrganizationRow,
        ): BrokerClient => ({
          id: org.id,
          broker_org_id: "",
          client_org_id: org.id,
          company_name: org.name,
          contact_name: "",
          contact_email: "",
          contact_phone: "",
          client_type: "general_contractor",
          risk_level: "low",
          compliance_score: 85,
          status: "active",
          last_activity_at: org.updated_at,
          notes: "",
          created_at: org.created_at,
          updated_at: org.updated_at,
          primary_contact: "",
        }));
        setClients(mappedClients);
        setError(null);
        return;
      }

      // Fetch relationships where broker is the inviter (broker invited client)
      const { data: asInviter, error: inviterError } = await forsuredQuery(
        "relationship_invitations",
        client,
      )
        .select("*")
        .eq("inviter_org_id", brokerOrgId)
        .eq("inviter_type", "broker")
        .in("invitee_type", ["manager", "subcontractor"])
        .eq("status", "connected");

      if (inviterError && !inviterError.message?.includes("Failed to fetch")) {
        console.error("[useClients] Error fetching as inviter:", inviterError);
      }

      // Fetch relationships where broker is the invitee (client invited broker)
      const { data: asInvitee, error: inviteeError } = await forsuredQuery(
        "relationship_invitations",
        client,
      )
        .select("*")
        .eq("invitee_org_id", brokerOrgId)
        .eq("invitee_type", "broker")
        .in("inviter_type", ["manager", "subcontractor"])
        .eq("status", "connected");

      if (inviteeError && !inviteeError.message?.includes("Failed to fetch")) {
        console.error("[useClients] Error fetching as invitee:", inviteeError);
      }

      // Combine and dedupe relationships
      const allRelationships: RelationshipInvitationRow[] = [
        ...(asInviter || []),
        ...(asInvitee || []),
      ];

      // Get unique client org IDs and their types
      const clientOrgMap = new Map<
        string,
        {
          type: "manager" | "subcontractor";
          invitation: RelationshipInvitationRow;
        }
      >();

      for (const rel of allRelationships) {
        // Determine client org ID and type based on broker's position
        let clientOrgId: string | null = null;
        let clientConnectionType: "manager" | "subcontractor";

        if (rel.inviter_type === "broker") {
          // Broker invited the client
          clientOrgId = rel.invitee_org_id;
          clientConnectionType = rel.invitee_type as
            | "manager"
            | "subcontractor";
        } else {
          // Client invited the broker
          clientOrgId = rel.inviter_org_id;
          clientConnectionType = rel.inviter_type as
            | "manager"
            | "subcontractor";
        }

        if (clientOrgId && !clientOrgMap.has(clientOrgId)) {
          clientOrgMap.set(clientOrgId, {
            type: clientConnectionType,
            invitation: rel,
          });
        }
      }

      // Fetch organization details for all client orgs
      const clientOrgIds = Array.from(clientOrgMap.keys());

      if (clientOrgIds.length === 0) {
        setClients([]);
        setError(null);
        return;
      }

      const { data: orgs, error: orgsError } = await forsuredQuery('organizations', client)
        .select('*')
        .in('id', clientOrgIds);

      if (orgsError) throw orgsError;

      // Fetch user set type information for each organization's owner
      // This allows us to display clients using their preferred terminology
      const ownerUserIds = (orgs || [])
        .map((org: OrganizationRow) => org.owner_user_id)
        .filter((id): id is string => !!id);

      let userSetTypeMap = new Map<string, UserSetTypeRow>();

      if (ownerUserIds.length > 0) {
        const { data: profiles } = await forsuredQuery("user_profiles", client)
          .select(`
            scaffald_user_id,
            user_set_type_id,
            user_set_types:user_set_type_id (
              id,
              name,
              slug,
              manager_label_singular,
              manager_label_plural,
              contractor_label_singular,
              contractor_label_plural
            )
          `)
          .in("scaffald_user_id", ownerUserIds);

        // Build a map of owner_user_id -> user_set_type
        if (profiles) {
          for (const profile of profiles as UserProfileRow[]) {
            if (profile.user_set_types) {
              userSetTypeMap.set(
                profile.scaffald_user_id,
                profile.user_set_types,
              );
            }
          }
        }
      }

      // Map to BrokerClient with correct client_type and lexicon info
      const mappedClients: BrokerClient[] = (orgs || []).map(
        (org: OrganizationRow) => {
          const clientInfo = clientOrgMap.get(org.id);
          const clientType = clientInfo
            ? getClientType(clientInfo.type)
            : "general_contractor";
          const invitation = clientInfo?.invitation;
          const userSetType = org.owner_user_id
            ? userSetTypeMap.get(org.owner_user_id)
            : undefined;

          return createBrokerClient(
            org,
            brokerOrgId,
            clientType,
            invitation || {} as RelationshipInvitationRow,
            userSetType,
          );
        },
      );

      setClients(mappedClients);
      setError(null);
    } catch (err) {
      const error = err as Error;
      if (
        !error.message?.includes("Failed to fetch") &&
        !error.message?.includes("NetworkError")
      ) {
        console.error("[useClients] Error fetching clients:", err);
      }
      setError(error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [brokerOrgId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (
    client: Omit<BrokerClient, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const supaClient = supabaseServiceRole || null;

      if (!supaClient) {
        throw new Error("Supabase service role client not configured");
      }

      // TODO: This is a simplified implementation that only creates the organization.
      // A complete implementation needs to:
      // 1. Create the organization in forsured.organizations
      // 2. Create broker-client relationship in a broker_clients table
      // 3. Store additional metadata (risk_level, compliance_score, client_type, etc.)
      // For now, we only create the basic organization record.
      const { data, error: insertError } = await forsuredQuery('organizations', supaClient)
        .insert({
          name: client.company_name,
          // Map BrokerClient fields to organization fields where possible
          // Note: Many BrokerClient fields (risk_level, compliance_score, etc.)
          // don't exist in forsured.organizations and need a separate table
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await fetchClients();
      return data;
    } catch (err) {
      console.error("[useClients] Error adding client:", err);
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<BrokerClient>) => {
    try {
      const supaClient = supabaseServiceRole || null;

      if (!supaClient) {
        throw new Error("Supabase service role client not configured");
      }

      // TODO: Similar to addClient, this is incomplete.
      // We can only update the organization name, not broker-specific fields.
      const updateData: Record<string, unknown> = {};
      if (updates.company_name) {
        updateData.name = updates.company_name;
      }

      const { data, error: updateError } = await forsuredQuery('organizations', supaClient)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      await fetchClients();
      return data;
    } catch (err) {
      console.error("[useClients] Error updating client:", err);
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
