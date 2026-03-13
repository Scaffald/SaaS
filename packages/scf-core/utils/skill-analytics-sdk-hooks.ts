/**
 * React Query hooks for Scaffald SDK Skill Analytics endpoints
 * Provides hooks for skill snapshots, timeline, and evidence
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  SkillSnapshot,
  ListSnapshotsParams,
  ListSnapshotsResponse,
  CreateSnapshotParams,
  CreateSnapshotResponse,
  GetTimelineParams,
  GetTimelineResponse,
  CompareSnapshotsParams,
  CompareSnapshotsResponse,
  ListEvidenceParams,
  ListEvidenceResponse,
  CreateEvidenceParams,
  CreateEvidenceResponse,
  UpdateEvidenceParams,
  UpdateEvidenceResponse,
  DeleteEvidenceParams,
  VerifyEvidenceParams,
  SkillEvidence,
} from '@scaffald/sdk'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const skillAnalyticsKeys = {
  all: ['scaffald', 'skill-analytics'] as const,
  snapshots: (params?: ListSnapshotsParams) =>
    [...skillAnalyticsKeys.all, 'snapshots', params] as const,
  snapshot: (id: string) =>
    [...skillAnalyticsKeys.all, 'snapshots', id] as const,
  latestSnapshot: (userId?: string) =>
    [...skillAnalyticsKeys.all, 'snapshots', 'latest', userId] as const,
  timeline: (params?: GetTimelineParams) =>
    [...skillAnalyticsKeys.all, 'timeline', params] as const,
  evidence: (params?: ListEvidenceParams) =>
    [...skillAnalyticsKeys.all, 'evidence', params] as const,
}

// ============================================================================
// SNAPSHOT QUERY HOOKS
// ============================================================================

export function useSkillSnapshots(
  params?: ListSnapshotsParams,
  options?: Omit<UseQueryOptions<ListSnapshotsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: skillAnalyticsKeys.snapshots(params),
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.listSnapshots(params)
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useLatestSnapshot(
  userId?: string,
  options?: Omit<UseQueryOptions<SkillSnapshot | null, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: skillAnalyticsKeys.latestSnapshot(userId),
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.getLatestSnapshot(userId)
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useSnapshotTimeline(
  params?: GetTimelineParams,
  options?: Omit<UseQueryOptions<GetTimelineResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: skillAnalyticsKeys.timeline(params),
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.getTimeline(params)
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

export function useSnapshotComparison(
  params: CompareSnapshotsParams,
  options?: Omit<UseQueryOptions<CompareSnapshotsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...skillAnalyticsKeys.all, 'compare', params.snapshotAId, params.snapshotBId],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.compareSnapshots(params)
    },
    enabled: !!client && !!params.snapshotAId && !!params.snapshotBId && options?.enabled !== false,
    ...options,
  })
}

// ============================================================================
// SNAPSHOT MUTATION HOOKS
// ============================================================================

export function useCreateSnapshotMutation(
  options?: UseMutationOptions<CreateSnapshotResponse, Error, CreateSnapshotParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateSnapshotParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.createSnapshot(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillAnalyticsKeys.all })
    },
    ...options,
  })
}

// ============================================================================
// EVIDENCE QUERY HOOKS
// ============================================================================

export function useSkillEvidence(
  params?: ListEvidenceParams,
  options?: Omit<UseQueryOptions<ListEvidenceResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: skillAnalyticsKeys.evidence(params),
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.listEvidence(params)
    },
    enabled: !!client && options?.enabled !== false,
    ...options,
  })
}

// ============================================================================
// EVIDENCE MUTATION HOOKS
// ============================================================================

export function useCreateEvidenceMutation(
  options?: UseMutationOptions<CreateEvidenceResponse, Error, CreateEvidenceParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateEvidenceParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.createEvidence(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillAnalyticsKeys.evidence() })
    },
    ...options,
  })
}

export function useUpdateEvidenceMutation(
  options?: UseMutationOptions<UpdateEvidenceResponse, Error, UpdateEvidenceParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: UpdateEvidenceParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.updateEvidence(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillAnalyticsKeys.evidence() })
    },
    ...options,
  })
}

export function useDeleteEvidenceMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, DeleteEvidenceParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: DeleteEvidenceParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.deleteEvidence(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillAnalyticsKeys.evidence() })
    },
    ...options,
  })
}

export function useVerifyEvidenceMutation(
  options?: UseMutationOptions<SkillEvidence, Error, VerifyEvidenceParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: VerifyEvidenceParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.skillAnalytics.verifyEvidence(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillAnalyticsKeys.evidence() })
    },
    ...options,
  })
}
