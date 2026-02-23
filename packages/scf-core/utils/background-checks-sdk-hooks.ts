/**
 * Background checks admin SDK hooks.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 * Office or platform role required.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  AdminCheckType,
  AdminPackage,
  AdminUpsertCheckTypeParams,
  AdminUpsertPackageParams,
} from '@scaffald/sdk'

const ADMIN_CATALOG_KEY = ['backgroundChecks', 'admin'] as const

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
