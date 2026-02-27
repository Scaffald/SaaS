/**
 * ONET SDK Hooks
 * React Query hooks for O*NET occupational data and career assessments
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  SearchOccupationsParams,
  SearchOccupationsResponse,
  GetOccupationParams,
  OccupationData,
  SaveCareerAssessmentParams,
  SaveCareerAssessmentResponse,
  CareerAssessmentStatus,
  RIASECStatus,
  OccupationStatus,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Search occupations by keyword
 */
export function useSearchOccupations(
  params: SearchOccupationsParams,
  options?: Omit<UseQueryOptions<SearchOccupationsResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'onet', 'occupations', 'search', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.onet.searchOccupations(params)
    },
    enabled: !!client && !!params.query && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get occupation details by O*NET code
 */
export function useOccupation(
  params: GetOccupationParams,
  options?: Omit<UseQueryOptions<OccupationData>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'onet', 'occupation', params.onetCode],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.onet.getOccupation(params)
    },
    enabled: !!client && !!params.onetCode && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get user's career assessment status
 */
export function useCareerAssessmentStatus(
  options?: Omit<UseQueryOptions<CareerAssessmentStatus>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'onet', 'career-assessment', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.onet.getCareerAssessmentStatus()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get RIASEC assessment completion status
 */
export function useRIASECStatus(
  options?: Omit<UseQueryOptions<RIASECStatus>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'onet', 'riasec', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.onet.getRIASECStatus()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get occupation assessment completion status
 */
export function useOccupationStatus(
  options?: Omit<UseQueryOptions<OccupationStatus>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'onet', 'occupation', 'status'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.onet.getOccupationStatus()
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Save user's RIASEC assessment
 * Can save RIASEC scores, occupations, or both independently
 */
export function useSaveCareerAssessmentMutation(
  options?: UseMutationOptions<SaveCareerAssessmentResponse, Error, SaveCareerAssessmentParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SaveCareerAssessmentParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.onet.saveCareerAssessment(params)
    },
    ...options,
  })
}
