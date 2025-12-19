/**
 * REQ-273: Coverage Request Service Layer
 * API functions for managing coverage request workflow between subs and brokers
 */

import { forsured } from '../supabase';
import type {
  CoverageRequest,
  CreateCoverageRequestRequest,
  UpdateCoverageRequestRequest,
  ProvideQuoteRequest,
  CoverageRequestStatus,
} from '../../types';

/**
 * Get all coverage requests for an organization
 * @param organizationId - Organization UUID
 * @returns Array of coverage requests sorted by created_at (newest first)
 */
export async function getAllCoverageRequests(
  organizationId: string
): Promise<CoverageRequest[]> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { data, error } = await forsured('coverage_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch coverage requests: ${error.message}`);
  }

  return data || [];
}

/**
 * Get coverage requests by status for an organization
 * @param organizationId - Organization UUID
 * @param status - Coverage request status
 * @returns Array of coverage requests with matching status
 */
export async function getCoverageRequestsByStatus(
  organizationId: string,
  status: CoverageRequestStatus
): Promise<CoverageRequest[]> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { data, error } = await forsured('coverage_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch coverage requests: ${error.message}`);
  }

  return data || [];
}

/**
 * Get coverage requests assigned to a specific broker
 * @param brokerId - Broker user UUID
 * @param organizationId - Organization UUID
 * @returns Array of coverage requests assigned to broker
 */
export async function getCoverageRequestsByBroker(
  brokerId: string,
  organizationId: string
): Promise<CoverageRequest[]> {
  if (!brokerId || !organizationId) {
    throw new Error('Broker ID and Organization ID are required');
  }

  const { data, error } = await forsured('coverage_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch coverage requests for broker: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single coverage request by ID
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 * @returns Coverage request or null if not found
 */
export async function getCoverageRequestById(
  id: string,
  organizationId: string
): Promise<CoverageRequest | null> {
  if (!id || !organizationId) {
    throw new Error('Coverage request ID and Organization ID are required');
  }

  const { data, error } = await forsured('coverage_requests')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch coverage request: ${error.message}`);
  }

  return data;
}

/**
 * Create a new coverage request
 * @param request - Coverage request creation data
 * @param userId - Requesting user UUID (requester_id)
 * @returns Created coverage request
 */
export async function createCoverageRequest(
  request: CreateCoverageRequestRequest,
  userId: string
): Promise<CoverageRequest> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!request.organization_id) {
    throw new Error('Organization ID is required');
  }

  if (!request.coverage_type || request.coverage_type.trim() === '') {
    throw new Error('Coverage type is required');
  }

  const { data, error } = await forsured('coverage_requests')
    .insert({
      ...request,
      requester_id: userId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create coverage request: ${error.message}`);
  }

  return data;
}

/**
 * Update a coverage request (general update)
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 * @param updates - Partial coverage request update
 * @returns Updated coverage request
 */
export async function updateCoverageRequest(
  id: string,
  organizationId: string,
  updates: UpdateCoverageRequestRequest
): Promise<CoverageRequest> {
  if (!id || !organizationId) {
    throw new Error('Coverage request ID and Organization ID are required');
  }

  // Validate quote amount if provided
  if (updates.quote_amount !== undefined && updates.quote_amount < 0) {
    throw new Error('Quote amount must be non-negative');
  }

  const { data, error } = await forsured('coverage_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update coverage request: ${error.message}`);
  }

  return data;
}

/**
 * Broker provides a quote for a coverage request
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 * @param quote - Quote data from broker
 * @param brokerId - Broker user UUID
 * @returns Updated coverage request with quote
 */
export async function provideQuote(
  id: string,
  organizationId: string,
  quote: ProvideQuoteRequest,
  brokerId: string
): Promise<CoverageRequest> {
  if (!id || !organizationId || !brokerId) {
    throw new Error('Coverage request ID, Organization ID, and Broker ID are required');
  }

  if (quote.quote_amount < 0) {
    throw new Error('Quote amount must be non-negative');
  }

  const { data, error } = await forsured('coverage_requests')
    .update({
      broker_id: brokerId,
      quote_amount: quote.quote_amount,
      quote_details: quote.quote_details || null,
      status: 'quoted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to provide quote: ${error.message}`);
  }

  return data;
}

/**
 * Approve a coverage request (sub accepts broker's quote)
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 * @returns Updated coverage request with approved status
 */
export async function approveCoverageRequest(
  id: string,
  organizationId: string
): Promise<CoverageRequest> {
  if (!id || !organizationId) {
    throw new Error('Coverage request ID and Organization ID are required');
  }

  // Verify request has a quote before approving
  const existing = await getCoverageRequestById(id, organizationId);
  if (!existing) {
    throw new Error('Coverage request not found');
  }

  if (existing.status !== 'quoted') {
    throw new Error('Can only approve coverage requests with status "quoted"');
  }

  if (!existing.quote_amount) {
    throw new Error('Cannot approve coverage request without a quote amount');
  }

  const { data, error } = await forsured('coverage_requests')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve coverage request: ${error.message}`);
  }

  return data;
}

/**
 * Reject a coverage request (sub rejects broker's quote)
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 * @returns Updated coverage request with rejected status
 */
export async function rejectCoverageRequest(
  id: string,
  organizationId: string
): Promise<CoverageRequest> {
  if (!id || !organizationId) {
    throw new Error('Coverage request ID and Organization ID are required');
  }

  const { data, error } = await forsured('coverage_requests')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reject coverage request: ${error.message}`);
  }

  return data;
}

/**
 * Cancel a coverage request
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 * @returns Updated coverage request with cancelled status
 */
export async function cancelCoverageRequest(
  id: string,
  organizationId: string
): Promise<CoverageRequest> {
  if (!id || !organizationId) {
    throw new Error('Coverage request ID and Organization ID are required');
  }

  const { data, error } = await forsured('coverage_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel coverage request: ${error.message}`);
  }

  return data;
}

/**
 * Delete a coverage request (hard delete)
 * @param id - Coverage request UUID
 * @param organizationId - Organization UUID
 */
export async function deleteCoverageRequest(
  id: string,
  organizationId: string
): Promise<void> {
  if (!id || !organizationId) {
    throw new Error('Coverage request ID and Organization ID are required');
  }

  const { error } = await forsured('coverage_requests')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to delete coverage request: ${error.message}`);
  }
}
