/**
 * Broker Acknowledgements Hook
 * Code Updates for Shared Database Architecture
 *
 * Uses `broker_acknowledgements` table in forsured schema:
 * - id (uuid, primary key)
 * - subcontractor_org_id (uuid) - foreign key to scaffald.organizations
 * - broker_org_id (uuid) - foreign key to scaffald.organizations
 * - project_id (uuid, nullable) - foreign key to forsured.projects
 * - manager_org_id (uuid) - foreign key to scaffald.organizations
 * - subcontractor_company_name (text)
 * - broker_agency_name (text)
 * - broker_contact_name (text)
 * - broker_email (text)
 * - broker_phone (text, nullable)
 * - gc_project_name (text)
 * - date_issued (date)
 * - date_due (date)
 * - date_submitted (date, nullable)
 * - date_reviewed (date, nullable)
 * - status (text) - draft, pending, under_review, approved, rejected, revision_requested
 * - compliance_status (text, nullable) - compliant, warning, critical, non_compliant, partial
 * - compliance_score (integer, nullable)
 * - missing_endorsements (text[], nullable)
 * - manager_notes (text, nullable)
 * - requires_pollution_liability (boolean)
 * - requires_professional_liability (boolean)
 * - involves_hazardous_materials (boolean)
 * - involves_trenching (boolean)
 * - involves_residential_work (boolean)
 * - created_by_user_id (uuid) - foreign key to scaffald.users
 * - submitted_by_user_id (uuid, nullable) - foreign key to scaffald.users
 * - reviewed_by_user_id (uuid, nullable) - foreign key to scaffald.users
 * - coverage_items (jsonb, nullable)
 * - signatures (jsonb, nullable)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 */

import { useState, useEffect } from 'react';
import {
  BrokerAcknowledgementForm,
  AcknowledgementCoverageItem,
  AcknowledgementSignature,
} from '../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatSupabaseError } from '../lib/database/formatSupabaseError';

interface UseBrokerAcknowledgementsOptions {
  formId?: string;
  subcontractorOrgId?: string;
  projectId?: string;
  status?: string;
}

export function useBrokerAcknowledgements(
  options: UseBrokerAcknowledgementsOptions = {}
) {
  const [forms, setForms] = useState<BrokerAcknowledgementForm[]>([]);
  const [currentForm, setCurrentForm] =
    useState<BrokerAcknowledgementForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useDatabase();

  useEffect(() => {
    if (options.formId) {
      fetchFormById(options.formId);
    } else {
      fetchForms();
    }
  }, [
    options.formId,
    options.subcontractorOrgId,
    options.projectId,
    options.status,
  ]);

  const fetchForms = async () => {
    try {
      setLoading(true);

      let query = supabase
        .schema('forsured')
        .from('broker_acknowledgements')
        .select('*');

      if (options.subcontractorOrgId) {
        query = query.eq('subcontractor_org_id', options.subcontractorOrgId);
      }

      if (options.projectId) {
        query = query.eq('project_id', options.projectId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw formatSupabaseError(
          supabaseError,
          'fetching broker acknowledgements'
        );
      }

      setForms(data || []);
    } catch (err) {
      console.error('[useBrokerAcknowledgements] Error fetching forms:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormById = async (formId: string) => {
    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('broker_acknowledgements')
        .select('*')
        .eq('id', formId)
        .single();

      if (supabaseError) {
        throw formatSupabaseError(
          supabaseError,
          'fetching broker acknowledgement by ID'
        );
      }

      setCurrentForm(data);
    } catch (err) {
      console.error('[useBrokerAcknowledgements] Error fetching form:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createForm = async (formData: Partial<BrokerAcknowledgementForm>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('broker_acknowledgements')
        .insert(formData)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(
          supabaseError,
          'creating broker acknowledgement'
        );
      }

      await fetchForms();
      return data;
    } catch (err) {
      console.error('[useBrokerAcknowledgements] Error creating form:', err);
      throw err;
    }
  };

  const updateForm = async (
    formId: string,
    updates: Partial<BrokerAcknowledgementForm>
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('broker_acknowledgements')
        .update(updates)
        .eq('id', formId)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(
          supabaseError,
          'updating broker acknowledgement'
        );
      }

      if (options.formId === formId) {
        await fetchFormById(formId);
      } else {
        await fetchForms();
      }
      return data;
    } catch (err) {
      console.error('[useBrokerAcknowledgements] Error updating form:', err);
      throw err;
    }
  };

  const saveCoverageItem = async (
    item: Partial<AcknowledgementCoverageItem>
  ) => {
    return Promise.resolve(item as AcknowledgementCoverageItem);
  };

  const saveCoverageItems = async (
    items: Partial<AcknowledgementCoverageItem>[]
  ) => {
    return Promise.resolve();
  };

  const saveSignature = async (
    signature: Partial<AcknowledgementSignature>
  ) => {
    return Promise.resolve(signature as AcknowledgementSignature);
  };

  const submitForm = async (formId: string) => {
    try {
      const updates = {
        status: 'submitted' as const,
        date_submitted: new Date().toISOString().split('T')[0], // Format as date
      };

      const { data, error: supabaseError } = await supabase
        .schema('forsured')
        .from('broker_acknowledgements')
        .update(updates)
        .eq('id', formId)
        .select()
        .single();

      if (supabaseError) {
        throw formatSupabaseError(
          supabaseError,
          'submitting broker acknowledgement'
        );
      }

      await fetchFormById(formId);
      return data;
    } catch (err) {
      console.error('[useBrokerAcknowledgements] Error submitting form:', err);
      throw err;
    }
  };

  const calculateComplianceScore = (
    coverageItems: AcknowledgementCoverageItem[]
  ) => {
    if (!coverageItems || coverageItems.length === 0) return 0;
    const includedCount = coverageItems.filter(
      (item) => item.verification_status === 'included'
    ).length;
    const applicableCount = coverageItems.filter(
      (item) => item.verification_status !== 'not_applicable'
    ).length;
    if (applicableCount === 0) return 0;
    return Math.round((includedCount / applicableCount) * 100);
  };

  const getMissingEndorsements = (
    coverageItems: AcknowledgementCoverageItem[]
  ) => {
    return coverageItems
      .filter((item) => item.verification_status === 'excluded')
      .map((item) => `${item.coverage_category}: ${item.requirement_name}`);
  };

  return {
    forms,
    currentForm,
    loading,
    error,
    fetchForms,
    fetchFormById,
    createForm,
    updateForm,
    saveCoverageItem,
    saveCoverageItems,
    saveSignature,
    submitForm,
    calculateComplianceScore,
    getMissingEndorsements,
  };
}
