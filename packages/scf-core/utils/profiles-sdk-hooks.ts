/**
 * Profiles SDK hooks. Use these instead of api.profiles.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  UserProfile,
  OrganizationProfile,
  EmployerProfile,
  CurrentUser,
  GeneralInfo,
  UpdateGeneralInfoParams,
  ProfileBySlug,
  SlugAvailability,
  UpdateSlugResponse,
  SlugHistory,
  UploadAvatarParams,
  UploadAvatarResponse,
} from '@scaffald/sdk/resources/profiles'

// ============================================================================
// QUERY HOOKS - Public Profiles
// ============================================================================

/** Get a user profile by username */
export function useUserProfile(username: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'user', username],
    queryFn: async () => {
      if (!client || !username) throw new Error('Missing client or username')
      return client.profiles.getUser(username)
    },
    enabled: !!client && !!username && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Get an organization profile by slug */
export function useOrganizationProfile(slug: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'organization', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.profiles.getOrganization(slug)
    },
    enabled: !!client && !!slug && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Get an employer profile by slug */
export function useEmployerProfile(slug: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'employer', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.profiles.getEmployer(slug)
    },
    enabled: !!client && !!slug && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// QUERY HOOKS - Profile Management
// ============================================================================

/** Get current authenticated user info */
export function useCurrentUser(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'current'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profiles.getCurrentUser()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes - current user rarely changes
  })
}

/** Get general profile information */
export function useGeneralInfo(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'general'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profiles.getGeneralInfo()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Get profile by slug (public, no auth required) */
export function useProfileBySlug(slug: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'slug', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.profiles.getProfileBySlug(slug)
    },
    enabled: !!client && !!slug && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Check if a slug is available */
export function useSlugAvailability(slug: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'slug-availability', slug],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.profiles.checkSlugAvailability(slug)
    },
    enabled: !!client && !!slug && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds - availability can change quickly
  })
}

/** Get slug change history */
export function useSlugHistory(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['profiles', 'slug-history'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profiles.getSlugHistory()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes - history doesn't change often
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Update general profile information */
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

/** Update user's slug (30-day cooldown enforced) */
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

/** Upload avatar image */
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
