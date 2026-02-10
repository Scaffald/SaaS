/**
 * Manager Acknowledgements Hook
 * Code Updates for Shared Database Architecture
 *
 * Uses `manager_acknowledgements` table in forsured schema:
 * - id (uuid, primary key)
 * - version (text)
 * - project_id (uuid, nullable) - foreign key to forsured.projects
 * - gc_company_id (uuid) - foreign key to scaffald.organizations
 * - broker_company_id (uuid) - foreign key to scaffald.organizations
 * - effective_at (timestamptz)
 * - expires_at (timestamptz, nullable)
 * - status (text) - DRAFT, SENT, VIEWED, SIGNED, DECLINED, EXPIRED
 * - jurisdiction (text)
 * - attestations (jsonb) - complex attestation data
 * - licensing (jsonb) - states, license_numbers
 * - eo_policy (jsonb) - E&O policy details
 * - responsibilities (text[])
 * - limits_liability (jsonb) - cap_type, cap_amount, exclusions
 * - signers (jsonb) - array of signer objects
 * - links (jsonb) - requirement_template_id, related_policies, related_documents
 * - audit_log (jsonb) - array of audit log entries
 * - pdf_artifacts (jsonb) - array of PDF artifact objects
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import mockManagerAck from '../data/mockManagerAck.json';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

export type PacketStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'SIGNED'
  | 'DECLINED'
  | 'EXPIRED';
export type SignerRole = 'BROKER' | 'GC';
export type SignerStatus =
  | 'PENDING'
  | 'SENT'
  | 'VIEWED'
  | 'SIGNED'
  | 'DECLINED';

export interface LicenseNumber {
  state: string;
  number: string;
  expires: string;
}

export interface Licensing {
  states: string[];
  license_numbers: LicenseNumber[];
}

export interface EOPolicy {
  carrier: string;
  policy_number: string;
  limits_each_claim: number;
  limits_aggregate: number;
  effective: string;
  expires: string;
}

export interface Attestations {
  is_licensed_for_project_state: boolean;
  has_active_eo: boolean;
  documents_are_accurate: boolean;
  will_maintain_required_endorsements: boolean;
  will_notify_material_change_days: number;
  agrees_to_platform_terms: boolean;
  fraud_reporting_enabled: boolean;
  data_use_agreed: boolean;
}

export interface LimitsLiability {
  cap_type: 'EO_LIMITS' | 'CUSTOM' | 'UNCAPPED';
  cap_amount: number | null;
  exclusions: string[];
}

export interface Signer {
  user_id: string;
  company_id: string;
  role: SignerRole;
  email: string;
  status: SignerStatus;
  acted_at: string | null;
}

export interface AuditLogEntry {
  at: string;
  actor: string;
  event: string;
  meta: Record<string, unknown>;
}

export interface PDFArtifact {
  id: string;
  name: string;
  url: string;
  hash: string;
}

export interface Links {
  requirement_template_id: string;
  related_policies: string[];
  related_documents: string[];
}

export interface BrokerAcknowledgementPacket {
  id: string;
  version: string;
  project_id: string;
  gc_company_id: string;
  broker_company_id: string;
  effective_at: string;
  expires_at: string | null;
  status: PacketStatus;
  jurisdiction: string;
  attestations: Attestations;
  licensing: Licensing;
  eo_policy: EOPolicy;
  responsibilities: string[];
  limits_liability: LimitsLiability;
  signers: Signer[];
  links: Links;
  audit_log: AuditLogEntry[];
  pdf_artifacts: PDFArtifact[];
}

interface UseManagerAcknowledgementsOptions {
  packetId?: string;
  projectId?: string;
  status?: PacketStatus;
}

export function useManagerAcknowledgements(
  options: UseManagerAcknowledgementsOptions = {}
) {
  const [packets, setPackets] = useState<BrokerAcknowledgementPacket[]>([]);
  const [currentPacket, setCurrentPacket] =
    useState<BrokerAcknowledgementPacket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    loadPackets();
  }, [options.packetId, options.projectId, options.status]);

  const loadPackets = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .schema('forsured')
        .from('manager_acknowledgements')
        .select('*');

      if (options.packetId) {
        query = query.eq('id', options.packetId);
      }

      if (options.projectId) {
        query = query.eq('project_id', options.projectId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('effective_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(
          supabaseError,
          'fetching manager acknowledgements'
        );
      }

      // If fetching a specific packet, set currentPacket
      if (options.packetId && data && data.length > 0) {
        setCurrentPacket(data[0] as BrokerAcknowledgementPacket);
      }

      setPackets((data || []) as BrokerAcknowledgementPacket[]);
    } catch (err) {
      console.error(
        '[useManagerAcknowledgements] Error fetching packets:',
        err
      );
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId: string): string => {
    const projectNames: Record<string, string> = {
      prj_harbor_tower: 'Harbor Tower',
      prj_maple_heights: 'Maple Heights Residences',
    };
    return projectNames[projectId] || projectId;
  };

  const getBrokerName = (brokerCompanyId: string): string => {
    const brokerNames: Record<string, string> = {
      cmp_cmr: 'CMR Broker Solutions',
      cmp_leavitt: 'Leavitt Group',
    };
    return brokerNames[brokerCompanyId] || brokerCompanyId;
  };

  const getGCName = (gcCompanyId: string): string => {
    const gcNames: Record<string, string> = {
      cmp_massei: 'Massei Construction',
      cmp_wizard: 'Wizard Construction Co.',
    };
    return gcNames[gcCompanyId] || gcCompanyId;
  };

  const getCompletionPercentage = (
    packet: BrokerAcknowledgementPacket
  ): number => {
    const signedCount = packet.signers.filter(
      (s) => s.status === 'SIGNED'
    ).length;
    return Math.round((signedCount / packet.signers.length) * 100);
  };

  const isExpiringSoon = (packet: BrokerAcknowledgementPacket): boolean => {
    if (!packet.expires_at) return false;
    const expiryDate = new Date(packet.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const getAttestationCount = (
    attestations: Attestations
  ): { confirmed: number; total: number } => {
    const booleanAttestations = [
      attestations.is_licensed_for_project_state,
      attestations.has_active_eo,
      attestations.documents_are_accurate,
      attestations.will_maintain_required_endorsements,
      attestations.agrees_to_platform_terms,
      attestations.fraud_reporting_enabled,
      attestations.data_use_agreed,
    ];
    const confirmed = booleanAttestations.filter(Boolean).length;
    return { confirmed, total: booleanAttestations.length };
  };

  return {
    packets,
    currentPacket,
    loading,
    error,
    loadPackets,
    getProjectName,
    getBrokerName,
    getGCName,
    getCompletionPercentage,
    isExpiringSoon,
    getAttestationCount,
  };
}
