/**
 * User Profiles SDK hooks for accessing comprehensive user profile data.
 * Use these instead of api.userProfile.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// ============================================================================
// USER PROFILE QUERY HOOKS
// ============================================================================

/**
 * Get lightweight user profile preview
 * Optimized for map views and quick cards
 */
export function useUserProfilePreview(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'preview', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getPreview({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes - previews are relatively static
  })
}

/**
 * Get comprehensive user profile
 * Includes all public profile data for detailed views
 */
export function useUserProfile(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'detail', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getUserProfile({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get user's skills with enrichment data
 * Includes skill details from CSI/ONET taxonomies
 */
export function useUserSkills(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'skills', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getUserSkills({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get user's certifications
 * Includes certification details and expiration tracking
 */
export function useUserCertifications(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'certifications', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getUserCertifications({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get user's work experience
 * Includes current and past positions
 */
export function useUserExperience(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'experience', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getUserExperience({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get user's education history
 * Includes degrees and ongoing education
 */
export function useUserEducation(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'education', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getUserEducation({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get user's reviews summary
 * Aggregated review metrics and recent feedback
 */
export function useReviewsSummary(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'reviews-summary', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.userProfiles.getReviewsSummary({ userId })
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes - reviews change more frequently
  })
}

/**
 * Get user's contact information
 * Access is gated by success fee payment
 *
 * @remarks
 * Contact info is only accessible after paying success fee for hiring
 * Returns accessibility status and reason if not available
 */
export function useContactInfo(
  params: { userId?: string; applicationId?: string },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['user-profiles', 'contact-info', params.userId, params.applicationId],
    queryFn: async () => {
      if (!client || !params.userId) throw new Error('Missing client or userId')
      return client.userProfiles.getContactInfo({
        userId: params.userId,
        applicationId: params.applicationId,
      })
    },
    enabled: !!client && !!params.userId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute - sensitive data, fresher cache
  })
}
