import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import type {
  CurrentUser,
  GeneralInfo,
  UpdateGeneralInfoParams,
  ProfileBySlug,
  SlugAvailability,
  UpdateSlugResponse,
  SlugHistory,
  UploadAvatarParams,
  UploadAvatarResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Get current authenticated user info (id, email)
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<CurrentUser, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'current'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profiles.getCurrentUser()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Get general profile information
 */
export function useGeneralInfo(
  options?: Omit<UseQueryOptions<GeneralInfo, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'general'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profiles.getGeneralInfo()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Update general profile information
 */
export function useUpdateGeneralInfoMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, UpdateGeneralInfoParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateGeneralInfoParams) => {
      if (!client) throw new Error('Missing client')
      return client.profiles.updateGeneralInfo(params)
    },
    ...options,
  })
}

/**
 * Get profile by slug (public, no auth required)
 */
export function useProfileBySlug(
  slug: string | undefined,
  options?: Omit<UseQueryOptions<ProfileBySlug, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'slug', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.profiles.getProfileBySlug(slug)
    },
    enabled: !!client && !!slug && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Check if a slug is available
 */
export function useCheckSlugAvailability(
  slug: string | undefined,
  options?: Omit<UseQueryOptions<SlugAvailability, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'slug', 'check', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.profiles.checkSlugAvailability(slug)
    },
    enabled: !!client && !!slug && slug.length >= 3 && (options?.enabled !== false),
    staleTime: 0, // Always fresh for real-time availability checking
    ...options,
  })
}

/**
 * Update user's slug (30-day cooldown enforced server-side)
 */
export function useUpdateSlugMutation(
  options?: UseMutationOptions<UpdateSlugResponse, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (slug: string) => {
      if (!client) throw new Error('Missing client')
      return client.profiles.updateSlug(slug)
    },
    ...options,
  })
}

/**
 * Get slug change history
 */
export function useSlugHistory(
  options?: Omit<UseQueryOptions<SlugHistory, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'slug', 'history'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profiles.getSlugHistory()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Upload avatar image
 */
export function useUploadAvatarMutation(
  options?: UseMutationOptions<UploadAvatarResponse, Error, UploadAvatarParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UploadAvatarParams) => {
      if (!client) throw new Error('Missing client')
      return client.profiles.uploadAvatar(params)
    },
    ...options,
  })
}
