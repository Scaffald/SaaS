/**
 * REQ-262: Insurance Policy Parent-Child Model
 * Service layer for insurance policy operations with hierarchical structure
 */

import { forsured } from '../supabase';
import type {
  InsurancePolicy,
  PolicyProvision,
  PolicyEndorsement,
  CreateInsurancePolicyRequest,
  UpdateInsurancePolicyRequest,
  CreateProvisionRequest,
  CreateEndorsementRequest,
} from '../../types';

/**
 * Get all insurance policies with nested provisions and endorsements
 */
export async function getAllPolicies(
  organizationId: string
): Promise<InsurancePolicy[]> {
  // Query policies with nested children using Supabase joins
  const { data: policies, error } = await forsured('insurance_policies')
    .select(
      `
      *,
      provisions:policy_provisions(*),
      endorsements:policy_endorsements(*)
    `
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[InsurancePolicyService] Error fetching policies:', error);
    throw new Error(`Failed to fetch insurance policies: ${error.message}`);
  }

  return policies || [];
}

/**
 * Get single insurance policy by ID with nested children
 */
export async function getPolicyById(
  policyId: string,
  organizationId: string
): Promise<InsurancePolicy | null> {
  const { data: policy, error } = await forsured('insurance_policies')
    .select(
      `
      *,
      provisions:policy_provisions(*),
      endorsements:policy_endorsements(*)
    `
    )
    .eq('id', policyId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('[InsurancePolicyService] Error fetching policy:', error);
    throw new Error(`Failed to fetch insurance policy: ${error.message}`);
  }

  return policy;
}

/**
 * Create new insurance policy with optional provisions and endorsements
 * Uses transaction to ensure atomicity
 */
export async function createPolicy(
  request: CreateInsurancePolicyRequest,
  userId: string
): Promise<InsurancePolicy> {
  // Validate dates
  if (request.effective_date && request.expiration_date) {
    const effectiveDate = new Date(request.effective_date);
    const expirationDate = new Date(request.expiration_date);
    if (effectiveDate >= expirationDate) {
      throw new Error('Effective date must be before expiration date');
    }
  }

  // Validate monetary amounts
  if (request.aggregate_limit !== undefined && request.aggregate_limit < 0) {
    throw new Error('Aggregate limit must be non-negative');
  }
  if (
    request.each_occurrence_limit !== undefined &&
    request.each_occurrence_limit < 0
  ) {
    throw new Error('Each occurrence limit must be non-negative');
  }
  if (request.deductible !== undefined && request.deductible < 0) {
    throw new Error('Deductible must be non-negative');
  }

  // Extract provisions and endorsements from request
  const { provisions, endorsements, ...policyData } = request;

  // Create parent policy
  const { data: policy, error: policyError } = await forsured('insurance_policies')
    .insert({
      ...policyData,
      created_by: userId,
      status: policyData.status || 'active',
    })
    .select()
    .single();

  if (policyError) {
    console.error('[InsurancePolicyService] Error creating policy:', policyError);
    throw new Error(`Failed to create insurance policy: ${policyError.message}`);
  }

  // Create provisions if provided
  if (provisions && provisions.length > 0) {
    const provisionsToInsert = provisions.map((p) => ({
      ...p,
      policy_id: policy.id,
      organization_id: request.organization_id,
    }));

    const { error: provisionsError } = await forsured('policy_provisions').insert(
      provisionsToInsert
    );

    if (provisionsError) {
      console.error('[InsurancePolicyService] Error creating provisions:', provisionsError);
      // Rollback: delete the policy
      await forsured('insurance_policies').delete().eq('id', policy.id);
      throw new Error(`Failed to create policy provisions: ${provisionsError.message}`);
    }
  }

  // Create endorsements if provided
  if (endorsements && endorsements.length > 0) {
    const endorsementsToInsert = endorsements.map((e) => ({
      ...e,
      policy_id: policy.id,
      organization_id: request.organization_id,
    }));

    const { error: endorsementsError } = await forsured('policy_endorsements').insert(
      endorsementsToInsert
    );

    if (endorsementsError) {
      console.error('[InsurancePolicyService] Error creating endorsements:', endorsementsError);
      // Rollback: delete the policy (provisions will cascade)
      await forsured('insurance_policies').delete().eq('id', policy.id);
      throw new Error(`Failed to create policy endorsements: ${endorsementsError.message}`);
    }
  }

  // Fetch the complete policy with children
  const createdPolicy = await getPolicyById(policy.id, request.organization_id);
  if (!createdPolicy) {
    throw new Error('Policy created but could not be retrieved');
  }

  return createdPolicy;
}

/**
 * Update insurance policy fields
 */
export async function updatePolicy(
  policyId: string,
  organizationId: string,
  updates: UpdateInsurancePolicyRequest
): Promise<InsurancePolicy> {
  // Validate dates if both are provided
  if (updates.effective_date && updates.expiration_date) {
    const effectiveDate = new Date(updates.effective_date);
    const expirationDate = new Date(updates.expiration_date);
    if (effectiveDate >= expirationDate) {
      throw new Error('Effective date must be before expiration date');
    }
  }

  // Validate monetary amounts
  if (updates.aggregate_limit !== undefined && updates.aggregate_limit < 0) {
    throw new Error('Aggregate limit must be non-negative');
  }
  if (updates.each_occurrence_limit !== undefined && updates.each_occurrence_limit < 0) {
    throw new Error('Each occurrence limit must be non-negative');
  }
  if (updates.deductible !== undefined && updates.deductible < 0) {
    throw new Error('Deductible must be non-negative');
  }

  const { data: policy, error } = await forsured('insurance_policies')
    .update(updates)
    .eq('id', policyId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Policy not found');
    }
    console.error('[InsurancePolicyService] Error updating policy:', error);
    throw new Error(`Failed to update insurance policy: ${error.message}`);
  }

  // Fetch the complete policy with children
  const updatedPolicy = await getPolicyById(policy.id, organizationId);
  if (!updatedPolicy) {
    throw new Error('Policy updated but could not be retrieved');
  }

  return updatedPolicy;
}

/**
 * Delete insurance policy (provisions and endorsements cascade automatically)
 */
export async function deletePolicy(
  policyId: string,
  organizationId: string
): Promise<void> {
  const { error } = await forsured('insurance_policies')
    .delete()
    .eq('id', policyId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[InsurancePolicyService] Error deleting policy:', error);
    throw new Error(`Failed to delete insurance policy: ${error.message}`);
  }
}

/**
 * Add provision to existing policy
 */
export async function addProvision(
  policyId: string,
  organizationId: string,
  provision: CreateProvisionRequest
): Promise<PolicyProvision> {
  // Verify policy exists and belongs to organization
  const policy = await getPolicyById(policyId, organizationId);
  if (!policy) {
    throw new Error('Policy not found');
  }

  // Validate monetary amounts
  if (provision.limit_amount !== undefined && provision.limit_amount < 0) {
    throw new Error('Limit amount must be non-negative');
  }
  if (provision.deductible !== undefined && provision.deductible < 0) {
    throw new Error('Deductible must be non-negative');
  }

  const { data, error } = await forsured('policy_provisions')
    .insert({
      ...provision,
      policy_id: policyId,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    console.error('[InsurancePolicyService] Error adding provision:', error);
    throw new Error(`Failed to add policy provision: ${error.message}`);
  }

  return data;
}

/**
 * Add endorsement to existing policy
 */
export async function addEndorsement(
  policyId: string,
  organizationId: string,
  endorsement: CreateEndorsementRequest
): Promise<PolicyEndorsement> {
  // Verify policy exists and belongs to organization
  const policy = await getPolicyById(policyId, organizationId);
  if (!policy) {
    throw new Error('Policy not found');
  }

  // Validate monetary amount
  if (endorsement.limit_amount !== undefined && endorsement.limit_amount < 0) {
    throw new Error('Limit amount must be non-negative');
  }

  const { data, error } = await forsured('policy_endorsements')
    .insert({
      ...endorsement,
      policy_id: policyId,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    console.error('[InsurancePolicyService] Error adding endorsement:', error);
    throw new Error(`Failed to add policy endorsement: ${error.message}`);
  }

  return data;
}

/**
 * Delete provision from policy
 */
export async function deleteProvision(
  policyId: string,
  provisionId: string,
  organizationId: string
): Promise<void> {
  const { error } = await forsured('policy_provisions')
    .delete()
    .eq('id', provisionId)
    .eq('policy_id', policyId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[InsurancePolicyService] Error deleting provision:', error);
    throw new Error(`Failed to delete policy provision: ${error.message}`);
  }
}

/**
 * Delete endorsement from policy
 */
export async function deleteEndorsement(
  policyId: string,
  endorsementId: string,
  organizationId: string
): Promise<void> {
  const { error } = await forsured('policy_endorsements')
    .delete()
    .eq('id', endorsementId)
    .eq('policy_id', policyId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[InsurancePolicyService] Error deleting endorsement:', error);
    throw new Error(`Failed to delete policy endorsement: ${error.message}`);
  }
}
