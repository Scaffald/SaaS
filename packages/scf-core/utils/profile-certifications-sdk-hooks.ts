import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import type {
  GetTopLevelCertificationsParams,
  GetTopLevelCertificationsResponse,
  GetCertificationChildrenParams,
  GetCertificationChildrenResponse,
  UserCertificationTree,
  AddCertificationParams,
  AddCertificationResponse,
  AddCategoryCertificationParams,
  AddCategoryCertificationResponse,
  ToggleSpecificCertificationParams,
  ToggleSpecificCertificationResponse,
  RemoveTopLevelCertificationParams,
  RemoveTopLevelCertificationResponse,
  UpdateCertificationProofParams,
  UpdateCertificationProofResponse,
  LegacyCertification,
  SaveCertificationsParams,
  SaveCertificationsResponse,
  UploadCertificationFileParams,
  UploadCertificationFileResponse,
  DeleteCertificationFileParams,
  DeleteCertificationFileResponse,
  DeleteCertificationParams,
  DeleteCertificationResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Get top-level certifications with search
 */
export function useTopLevelCertifications(
  params?: GetTopLevelCertificationsParams,
  options?: Omit<UseQueryOptions<GetTopLevelCertificationsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'certifications', 'top-level', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.certifications.getTopLevelCertifications(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Get certification children by parent ID
 */
export function useCertificationChildren(
  params: GetCertificationChildrenParams,
  options?: Omit<UseQueryOptions<GetCertificationChildrenResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'certifications', 'children', params.parent_id],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.certifications.getCertificationChildren(params)
    },
    enabled: !!client && !!params.parent_id && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Get user's certification tree
 */
export function useUserCertificationTree(
  options?: Omit<UseQueryOptions<UserCertificationTree, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'certifications', 'tree'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.certifications.getUserCertificationTree()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Add certification at any depth level
 */
export function useAddCertificationMutation(
  options?: UseMutationOptions<AddCertificationResponse, Error, AddCertificationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddCertificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.addCertification(params)
    },
    ...options,
  })
}

/**
 * Add category certification (depth 1)
 */
export function useAddCategoryCertificationMutation(
  options?: UseMutationOptions<AddCategoryCertificationResponse, Error, AddCategoryCertificationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddCategoryCertificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.addCategoryCertification(params)
    },
    ...options,
  })
}

/**
 * Toggle specific certification (depth 2)
 */
export function useToggleSpecificCertificationMutation(
  options?: UseMutationOptions<ToggleSpecificCertificationResponse, Error, ToggleSpecificCertificationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ToggleSpecificCertificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.toggleSpecificCertification(params)
    },
    ...options,
  })
}

/**
 * Remove top-level certification
 */
export function useRemoveTopLevelCertificationMutation(
  options?: UseMutationOptions<RemoveTopLevelCertificationResponse, Error, RemoveTopLevelCertificationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: RemoveTopLevelCertificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.removeTopLevelCertification(params)
    },
    ...options,
  })
}

/**
 * Update certification proof (file or URL)
 */
export function useUpdateCertificationProofMutation(
  options?: UseMutationOptions<UpdateCertificationProofResponse, Error, UpdateCertificationProofParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateCertificationProofParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.updateCertificationProof(params)
    },
    ...options,
  })
}

// ============================================================================
// LEGACY HOOKS (for backwards compatibility)
// ============================================================================

/**
 * Get user's certifications (legacy)
 */
export function useCertifications(
  options?: Omit<UseQueryOptions<LegacyCertification[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'certifications'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.certifications.getCertifications()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Save certifications (legacy)
 */
export function useSaveCertificationsMutation(
  options?: UseMutationOptions<SaveCertificationsResponse, Error, SaveCertificationsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SaveCertificationsParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.saveCertifications(params)
    },
    ...options,
  })
}

/**
 * Upload certification file (legacy)
 */
export function useUploadCertificationFileMutation(
  options?: UseMutationOptions<UploadCertificationFileResponse, Error, UploadCertificationFileParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UploadCertificationFileParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.uploadCertificationFile(params)
    },
    ...options,
  })
}

/**
 * Delete certification file (legacy)
 */
export function useDeleteCertificationFileMutation(
  options?: UseMutationOptions<DeleteCertificationFileResponse, Error, DeleteCertificationFileParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DeleteCertificationFileParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.deleteCertificationFile(params)
    },
    ...options,
  })
}

/**
 * Delete certification (legacy)
 */
export function useDeleteCertificationMutation(
  options?: UseMutationOptions<DeleteCertificationResponse, Error, DeleteCertificationParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DeleteCertificationParams) => {
      if (!client) throw new Error('Missing client')
      return client.certifications.deleteCertification(params)
    },
    ...options,
  })
}
