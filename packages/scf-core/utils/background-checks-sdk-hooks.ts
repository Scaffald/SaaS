/**
 * Background checks admin SDK hooks.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 * Office or platform role required.
 *
 * Organization/user-facing hooks (useOrganizationBackgroundChecks, useBackgroundCheck,
 * useBackgroundChecks) use tRPC until REST parity; admin hooks use SDK.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { api } from './api'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  AdminCheckType,
  AdminPackage,
  AdminUpsertCheckTypeParams,
  AdminUpsertPackageParams,
  AdminUpdateStatusParams,
  AdminUpdatePrivacyParams,
  AdminResolveDisputeParams,
} from '@scaffald/sdk'

const ADMIN_CATALOG_KEY = ['backgroundChecks', 'admin'] as const
const ADMIN_KEY = ['backgroundChecks', 'adminData'] as const

// ===== Organization/User hooks (tRPC until REST parity) =====

/** List background checks for an organization (office role). Uses tRPC. */
export function useOrganizationBackgroundChecks(
  organizationId: string | undefined,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return api.backgroundChecks.organizationListChecks.useQuery(
    { organization_id: organizationId ?? '' },
    {
      enabled: !!organizationId && options?.enabled !== false,
      staleTime: options?.staleTime ?? 30_000,
    }
  )
}

/** Get a single background check with documents (user's own check). Uses tRPC. */
export function useBackgroundCheck(
  checkId: string | undefined,
  options?: { enabled?: boolean }
) {
  return api.backgroundChecks.getCheck.useQuery(
    { background_check_id: checkId ?? '' },
    {
      enabled: !!checkId && options?.enabled !== false,
    }
  )
}

/** List background checks for the current user. Uses tRPC. */
export function useBackgroundChecks(options?: { enabled?: boolean; staleTime?: number }) {
  return api.backgroundChecks.listChecks.useQuery(undefined, {
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 30_000,
  })
}

/** Update background check privacy (user's own check). Uses tRPC. */
export function useUpdateBackgroundCheckPrivacyMutation() {
  return api.backgroundChecks.updatePrivacy.useMutation()
}

/** List background check packages (user-facing). Uses tRPC. */
export function useBackgroundCheckPackages(options?: { enabled?: boolean; staleTime?: number }) {
  return api.backgroundChecks.listPackages.useQuery(undefined, {
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 60_000,
  })
}

/** Request a background check (creates payment session). Uses tRPC. */
export function useRequestBackgroundCheckMutation() {
  return api.backgroundChecks.requestCheck.useMutation()
}

/** Confirm background check payment. Uses tRPC. */
export function useConfirmCheckPaymentMutation() {
  return api.backgroundChecks.confirmCheckPayment.useMutation()
}

/** Create document upload URL. Uses tRPC. */
export function useCreateDocumentUploadUrlMutation() {
  return api.backgroundChecks.createUploadUrl.useMutation()
}

/** Add document metadata after upload. Uses tRPC. */
export function useAddDocumentMetadataMutation() {
  return api.backgroundChecks.addDocumentMetadata.useMutation()
}

/** List disputes for a specific background check. Uses tRPC. */
export function useBackgroundCheckDisputes(
  checkId: string | undefined,
  options?: { enabled?: boolean }
) {
  return api.backgroundChecks.listDisputesForCheck.useQuery(
    { background_check_id: checkId ?? '' },
    { enabled: !!checkId && options?.enabled !== false }
  )
}

/** Submit background check dispute. Uses tRPC. */
export function useSubmitBackgroundCheckDisputeMutation() {
  return api.backgroundChecks.submitDispute.useMutation()
}

// ===== Admin SDK hooks =====

/** List admin packages (office/platform) */
export function useAdminPackages(options?: { staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_CATALOG_KEY, 'packages'],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminListPackages()
    },
    enabled: !!client,
    staleTime: options?.staleTime ?? 60_000,
  })
}

/** List admin check types (office/platform) */
export function useAdminCheckTypes(options?: { staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_CATALOG_KEY, 'checkTypes'],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminListCheckTypes()
    },
    enabled: !!client,
    staleTime: options?.staleTime ?? 60_000,
  })
}

/** Invalidate admin catalog queries */
export function useInvalidateAdminCatalog() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_CATALOG_KEY })
}

/** Upsert package mutation (office/platform) */
export function useAdminUpsertPackageMutation(
  options?: UseMutationOptions<AdminPackage, Error, AdminUpsertPackageParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: AdminUpsertPackageParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminUpsertPackage(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATALOG_KEY })
    },
    ...options,
  })
}

/** Upsert check type mutation (office/platform) */
export function useAdminUpsertCheckTypeMutation(
  options?: UseMutationOptions<AdminCheckType, Error, AdminUpsertCheckTypeParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: AdminUpsertCheckTypeParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminUpsertCheckType(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATALOG_KEY })
    },
    ...options,
  })
}

/** Set package active mutation (office/platform) */
export function useAdminSetPackageActiveMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string; is_active: boolean }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminSetPackageActive(id, is_active)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATALOG_KEY })
    },
    ...options,
  })
}

/** Set check type active mutation (office/platform) */
export function useAdminSetCheckTypeActiveMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string; is_active: boolean }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminSetCheckTypeActive(id, is_active)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATALOG_KEY })
    },
    ...options,
  })
}

// Admin checks, disputes, metrics, access log hooks

export function useAdminChecks(params?: { status?: string; limit?: number; offset?: number }, options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_KEY, 'checks', params?.status, params?.limit, params?.offset],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminListChecks(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 30_000,
  })
}

export function useAdminCheck(checkId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_KEY, 'check', checkId],
    queryFn: async () => {
      if (!client || !checkId) throw new Error('Missing client or checkId')
      return client.backgroundChecks.adminGetCheck(checkId)
    },
    enabled: !!client && !!checkId && options?.enabled !== false,
  })
}

export function useAdminDisputes(params?: { status?: string }, options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_KEY, 'disputes', params?.status],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminListDisputes(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 30_000,
  })
}

export function useAdminMetrics(options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_KEY, 'metrics'],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminGetMetrics()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 60_000,
  })
}

export function useAdminAccessLog(params?: { limit?: number }, options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...ADMIN_KEY, 'accessLog', params?.limit],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminGetAccessLog(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 30_000,
  })
}

export function useAdminUpdateStatusMutation(
  options?: UseMutationOptions<
    Record<string, unknown>,
    Error,
    { checkId: string } & AdminUpdateStatusParams
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ checkId, ...params }) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminUpdateStatus(checkId, params)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEY, 'check', variables.checkId] })
    },
    ...options,
  })
}

export function useAdminUpdatePrivacyMutation(
  options?: UseMutationOptions<
    { privacy: AdminUpdatePrivacyParams },
    Error,
    { checkId: string } & AdminUpdatePrivacyParams
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ checkId, ...params }) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminUpdatePrivacy(checkId, params)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEY, 'check', variables.checkId] })
    },
    ...options,
  })
}

export function useAdminGetDocumentDownloadUrlMutation(
  options?: UseMutationOptions<
    { url: string; expires_at: string },
    Error,
    string
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminGetDocumentDownloadUrl(documentId)
    },
    ...options,
  })
}

export function useAdminResolveDisputeMutation(
  options?: UseMutationOptions<
    Record<string, unknown>,
    Error,
    { disputeId: string } & AdminResolveDisputeParams
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ disputeId, ...params }) => {
      if (!client) throw new Error('Missing SDK client')
      return client.backgroundChecks.adminResolveDispute(disputeId, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEY })
    },
    ...options,
  })
}
