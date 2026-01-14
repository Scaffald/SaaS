/**
 * Organization Subcontractors Hook
 *
 * Fetches subcontractors linked to a specific organization.
 */

import { useState, useEffect, useCallback } from 'react';
import { forsured } from '../lib/supabase';

export interface OrganizationSubcontractor {
  id: string;
  organization_id: string;
  name: string; // Contact person name
  company: string; // Company name
  contact_info: {
    email?: string;
    phone?: string;
  } | null;
  trade_type?: string;
  status?: string;
  compliance_score?: number;
  created_at: string;
}

interface UseOrganizationSubcontractorsOptions {
  organizationId?: string;
}

export function useOrganizationSubcontractors({
  organizationId,
}: UseOrganizationSubcontractorsOptions) {
  const [subcontractors, setSubcontractors] = useState<OrganizationSubcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubcontractors = useCallback(async () => {
    if (!organizationId) {
      setSubcontractors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await forsured('subcontractors')
        .select('*')
        .eq('organization_id', organizationId)
        .order('company', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setSubcontractors(data || []);
    } catch (err) {
      console.error('[useOrganizationSubcontractors] Error fetching subcontractors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subcontractors');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  const createSubcontractor = useCallback(
    async (data: {
      company: string;
      name: string;
      email?: string;
      phone?: string;
      trade_type?: string;
    }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const { data: newSub, error: insertError } = await forsured('subcontractors')
        .insert({
          company: data.company.trim(),
          name: data.name.trim(),
          organization_id: organizationId,
          contact_info: {
            email: data.email?.trim() || null,
            phone: data.phone?.trim() || null,
          },
          trade_type: data.trade_type?.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSubcontractors((prev) => [...prev, newSub].sort((a, b) => a.company.localeCompare(b.company)));
      return newSub;
    },
    [organizationId]
  );

  return {
    subcontractors,
    loading,
    error,
    fetchSubcontractors,
    createSubcontractor,
  };
}
