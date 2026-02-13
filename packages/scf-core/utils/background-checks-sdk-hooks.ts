/**
 * Background Checks SDK hooks for managing background checks, packages, and disputes.
 * Use these instead of api.backgroundChecks.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  BackgroundCheck,
  RequestCheckParams,
  RequestCheckResponse,
  ConfirmCheckPaymentParams,
  CreateUploadUrlParams,
  CreateUploadUrlResponse,
  AddDocumentMetadataParams,
  BackgroundCheckDocument,
  UpdatePrivacyParams,
  SubmitDisputeParams,
  Dispute,
} from '@scaffald/sdk/resources/background-checks'

// ============================================================================
// PACKAGE HOOKS
// ============================================================================

/** List available background check packages */
export function useBackgroundCheckPackages(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['backgroundChecks', 'packages'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.listPackages()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes - packages don't change often
  })
}

// ============================================================================
// CHECK MANAGEMENT HOOKS
// ============================================================================

/** Request a new background check (initiates payment flow) */
export function useRequestBackgroundCheckMutation(
  options?: UseMutationOptions<RequestCheckResponse, Error, RequestCheckParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: RequestCheckParams) => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.requestCheck(params)
    },
    ...options,
  })
}

/** Confirm payment for a background check */
export function useConfirmCheckPaymentMutation(
  options?: UseMutationOptions<BackgroundCheck, Error, ConfirmCheckPaymentParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: ConfirmCheckPaymentParams) => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.confirmCheckPayment(params)
    },
    ...options,
  })
}

/** List all background checks for the current user */
export function useBackgroundChecks(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['backgroundChecks', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.listChecks()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/** Get a specific background check by ID */
export function useBackgroundCheck(checkId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['backgroundChecks', 'detail', checkId],
    queryFn: async () => {
      if (!client || !checkId) throw new Error('Missing client or checkId')
      return client.backgroundChecks.getCheck(checkId)
    },
    enabled: !!client && !!checkId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================================================
// DOCUMENT MANAGEMENT HOOKS
// ============================================================================

/** Create a pre-signed upload URL for a background check document */
export function useCreateDocumentUploadUrlMutation(
  options?: UseMutationOptions<CreateUploadUrlResponse, Error, CreateUploadUrlParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateUploadUrlParams) => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.createUploadUrl(params)
    },
    ...options,
  })
}

/** Record metadata for an uploaded document */
export function useAddDocumentMetadataMutation(
  options?: UseMutationOptions<BackgroundCheckDocument, Error, AddDocumentMetadataParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: AddDocumentMetadataParams) => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.addDocumentMetadata(params)
    },
    ...options,
  })
}

// ============================================================================
// PRIVACY & SETTINGS HOOKS
// ============================================================================

/** Update privacy settings for a background check */
export function useUpdateBackgroundCheckPrivacyMutation(
  options?: UseMutationOptions<BackgroundCheck, Error, UpdatePrivacyParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdatePrivacyParams) => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.updatePrivacy(params)
    },
    ...options,
  })
}

// ============================================================================
// DISPUTE HOOKS
// ============================================================================

/** Submit a dispute for a background check */
export function useSubmitBackgroundCheckDisputeMutation(
  options?: UseMutationOptions<Dispute, Error, SubmitDisputeParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SubmitDisputeParams) => {
      if (!client) throw new Error('Missing client')
      return client.backgroundChecks.submitDispute(params)
    },
    ...options,
  })
}

/** List disputes for a specific background check */
export function useBackgroundCheckDisputes(
  checkId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['backgroundChecks', 'disputes', checkId],
    queryFn: async () => {
      if (!client || !checkId) throw new Error('Missing client or checkId')
      return client.backgroundChecks.listDisputesForCheck(checkId)
    },
    enabled: !!client && !!checkId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// ORGANIZATION HOOKS
// ============================================================================

/** List background checks for an organization */
export function useOrganizationBackgroundChecks(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['backgroundChecks', 'organization', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.backgroundChecks.organizationListChecks(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get organization's background check details */
export function useOrganizationBackgroundCheck(
  organizationId: string | undefined,
  checkId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['backgroundChecks', 'organization', organizationId, checkId],
    queryFn: async () => {
      if (!client || !organizationId || !checkId) {
        throw new Error('Missing client, organizationId, or checkId')
      }
      return client.backgroundChecks.organizationGet(organizationId, checkId)
    },
    enabled: !!client && !!organizationId && !!checkId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}
