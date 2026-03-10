import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
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
import { useToast } from '@scaffald/ui'
import { invalidateProfileQueries } from '@scf/core/features/profile/utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
} from '@scf/core/features/profile/utils/profile-sync-store'

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
    enabled: !!client && options?.enabled !== false,
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
    enabled: !!client && options?.enabled !== false,
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
    enabled: !!client && !!slug && options?.enabled !== false,
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
    enabled: !!client && !!slug && slug.length >= 3 && options?.enabled !== false,
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
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

interface UpdateGeneralInfoContext {
  previousGeneral?: GeneralInfo | undefined
}

/**
 * Update general info mutation with optimistic updates and profile sync.
 */
export function useUpdateGeneralInfoMutationWithSync(
  overrides?: UseMutationOptions<{ success: boolean }, Error, UpdateGeneralInfoParams>
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useUpdateGeneralInfoMutation({
    async onMutate(input: UpdateGeneralInfoParams): Promise<UpdateGeneralInfoContext> {
      resetProfileSyncError()
      startProfileSync()
      await queryClient.cancelQueries({ queryKey: ['profiles', 'general'] })
      const previousGeneral = queryClient.getQueryData<GeneralInfo>(['profiles', 'general'])
      queryClient.setQueryData(
        ['profiles', 'general'],
        (current: GeneralInfo | undefined): GeneralInfo =>
          ({ ...(current ?? {}), ...input }) as GeneralInfo
      )
      return { previousGeneral }
    },
    onError(error: Error, _variables: UpdateGeneralInfoParams, _context: unknown) {
      const ctx = _context as UpdateGeneralInfoContext | undefined
      if (ctx?.previousGeneral) {
        queryClient.setQueryData(['profiles', 'general'], ctx.previousGeneral)
      }
      failProfileSync()
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save profile. Please try again.',
        variant: 'error',
      })
    },
    onSuccess() {
      toast.show({
        title: 'Profile Updated',
        message: 'Your profile has been saved successfully!',
        variant: 'success',
      })
    },
    async onSettled(_data: { success: boolean } | undefined, error: unknown) {
      if (!error) completeProfileSync()
      await invalidateProfileQueries(queryClient)
    },
    ...overrides,
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
