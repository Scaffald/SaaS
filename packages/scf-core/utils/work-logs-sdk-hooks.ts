import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import type {
  AddCollaboratorParams,
  AddCommentParams,
  AddSkillToProfileParams,
  ApproveMoveRequestParams,
  CancelMoveRequestParams,
  CheckTimeOverlapParams,
  CheckTimeOverlapResponse,
  CreateWorkLogParams,
  DenyMoveRequestParams,
  ExportWorkLogParams,
  ExportWorkLogResponse,
  GetOverviewParams,
  GetProjectOptionsParams,
  GetProjectRollupParams,
  GetSuggestedSkillsParams,
  ListWorkLogsParams,
  MoveToProjectParams,
  ProjectOption,
  ProjectRollup,
  PublicProfileFeedParams,
  SubmitWorkLogParams,
  UpdateCollaboratorParams,
  UpdatePhotoMetadataParams,
  UpdatePhotoVisibilityParams,
  UpdateProfileVisibilityParams,
  UpdateWorkLogParams,
  UploadPhotoParams,
  UploadPhotoResponse,
  WorkLog,
  WorkLogCollaborator,
  WorkLogComment,
  WorkLogListItem,
  WorkLogOverview,
  WorkLogPhoto,
  WorkLogsListResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Get available project options for creating work logs
 */
export function useWorkLogProjectOptions(
  params?: GetProjectOptionsParams,
  options?: Omit<UseQueryOptions<ProjectOption[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'projects', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.getProjectOptions(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Get project rollup analytics
 */
export function useWorkLogProjectRollup(
  params: GetProjectRollupParams | undefined,
  options?: Omit<UseQueryOptions<ProjectRollup, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'projects', params?.projectId, 'rollup', params],
    queryFn: async () => {
      if (!client || !params) throw new Error('Missing client or params')
      return client.workLogs.getProjectRollup(params)
    },
    enabled: !!client && !!params && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Get public work logs for a user's profile feed
 */
export function usePublicWorkLogsFeed(
  params: PublicProfileFeedParams | undefined,
  options?: Omit<UseQueryOptions<WorkLogListItem[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'public-feed', params?.userId, params],
    queryFn: async () => {
      if (!client || !params) throw new Error('Missing client or params')
      return client.workLogs.getPublicProfileFeed(params)
    },
    enabled: !!client && !!params && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * List work logs with filtering and pagination
 */
export function useWorkLogs(
  params?: ListWorkLogsParams,
  options?: Omit<UseQueryOptions<WorkLogsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.list(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get overview of work logs with status summary
 */
export function useWorkLogsOverview(
  params?: GetOverviewParams,
  options?: Omit<UseQueryOptions<WorkLogOverview, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'overview', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.getOverview(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Get a work log by ID
 */
export function useWorkLog(
  workLogId: string | undefined,
  options?: Omit<UseQueryOptions<WorkLog, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'detail', workLogId],
    queryFn: async () => {
      if (!client || !workLogId) throw new Error('Missing client or workLogId')
      return client.workLogs.getById(workLogId)
    },
    enabled: !!client && !!workLogId && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get collaborators for a work log
 */
export function useWorkLogCollaborators(
  workLogId: string | undefined,
  options?: Omit<UseQueryOptions<WorkLogCollaborator[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'detail', workLogId, 'collaborators'],
    queryFn: async () => {
      if (!client || !workLogId) throw new Error('Missing client or workLogId')
      return client.workLogs.getCollaborators(workLogId)
    },
    enabled: !!client && !!workLogId && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get conversation (comments) for a work log
 */
export function useWorkLogConversation(
  workLogId: string | undefined,
  options?: Omit<UseQueryOptions<WorkLogComment[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'detail', workLogId, 'conversation'],
    queryFn: async () => {
      if (!client || !workLogId) throw new Error('Missing client or workLogId')
      return client.workLogs.getConversation(workLogId)
    },
    enabled: !!client && !!workLogId && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

/**
 * Get suggested skills based on query
 */
export function useWorkLogSuggestedSkills(
  query: string | undefined,
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['workLogs', 'skills', 'suggestions', query],
    queryFn: async () => {
      if (!client || !query) throw new Error('Missing client or query')
      return client.workLogs.getSuggestedSkills({ query })
    },
    enabled: !!client && !!query && query.length > 0 && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Create a new work log
 */
export function useCreateWorkLogMutation(
  options?: UseMutationOptions<WorkLog, Error, CreateWorkLogParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreateWorkLogParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.create(params)
    },
    ...options,
  })
}

/**
 * Update a work log
 */
export function useUpdateWorkLogMutation(
  options?: UseMutationOptions<WorkLog, Error, UpdateWorkLogParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateWorkLogParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.update(params)
    },
    ...options,
  })
}

/**
 * Submit a work log for verification
 */
export function useSubmitWorkLogMutation(
  options?: UseMutationOptions<WorkLog, Error, SubmitWorkLogParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SubmitWorkLogParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.submit(params)
    },
    ...options,
  })
}

/**
 * Add a collaborator to a work log
 */
export function useAddWorkLogCollaboratorMutation(
  options?: UseMutationOptions<WorkLogCollaborator, Error, AddCollaboratorParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddCollaboratorParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.addCollaborator(params)
    },
    ...options,
  })
}

/**
 * Update a collaborator
 */
export function useUpdateWorkLogCollaboratorMutation(
  options?: UseMutationOptions<WorkLogCollaborator, Error, UpdateCollaboratorParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateCollaboratorParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.updateCollaborator(params)
    },
    ...options,
  })
}

/**
 * Remove a collaborator from a work log
 */
export function useRemoveWorkLogCollaboratorMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (collaboratorId: string) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.removeCollaborator(collaboratorId)
    },
    ...options,
  })
}

/**
 * Add a comment to a work log
 */
export function useAddWorkLogCommentMutation(
  options?: UseMutationOptions<WorkLogComment, Error, AddCommentParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddCommentParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.addComment(params)
    },
    ...options,
  })
}

/**
 * Add a skill to user's profile
 */
export function useAddSkillToProfileMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, AddSkillToProfileParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddSkillToProfileParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.addSkillToProfile(params)
    },
    ...options,
  })
}

/**
 * Upload a photo to a work log
 */
export function useUploadWorkLogPhotoMutation(
  options?: UseMutationOptions<UploadPhotoResponse, Error, UploadPhotoParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UploadPhotoParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.uploadPhoto(params)
    },
    ...options,
  })
}

/**
 * Update photo metadata (caption, order)
 */
export function useUpdateWorkLogPhotoMetadataMutation(
  options?: UseMutationOptions<WorkLogPhoto, Error, UpdatePhotoMetadataParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdatePhotoMetadataParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.updatePhotoMetadata(params)
    },
    ...options,
  })
}

/**
 * Update photo visibility
 */
export function useUpdateWorkLogPhotoVisibilityMutation(
  options?: UseMutationOptions<WorkLogPhoto, Error, UpdatePhotoVisibilityParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdatePhotoVisibilityParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.updatePhotoVisibility(params)
    },
    ...options,
  })
}

/**
 * Delete a photo from a work log
 */
export function useDeleteWorkLogPhotoMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (photoId: string) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.deletePhoto(photoId)
    },
    ...options,
  })
}

/**
 * Update work log profile visibility settings
 */
export function useUpdateWorkLogProfileVisibilityMutation(
  options?: UseMutationOptions<WorkLog, Error, UpdateProfileVisibilityParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateProfileVisibilityParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.updateProfileVisibility(params)
    },
    ...options,
  })
}

/**
 * Request to move work log to different project
 */
export function useMoveWorkLogToProjectMutation(
  options?: UseMutationOptions<WorkLog, Error, MoveToProjectParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: MoveToProjectParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.moveToProject(params)
    },
    ...options,
  })
}

/**
 * Approve a work log move request
 */
export function useApproveWorkLogMoveMutation(
  options?: UseMutationOptions<WorkLog, Error, ApproveMoveRequestParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ApproveMoveRequestParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.approveMoveRequest(params)
    },
    ...options,
  })
}

/**
 * Deny a work log move request
 */
export function useDenyWorkLogMoveMutation(
  options?: UseMutationOptions<WorkLog, Error, DenyMoveRequestParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DenyMoveRequestParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.denyMoveRequest(params)
    },
    ...options,
  })
}

/**
 * Cancel a work log move request
 */
export function useCancelWorkLogMoveMutation(
  options?: UseMutationOptions<WorkLog, Error, CancelMoveRequestParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CancelMoveRequestParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.cancelMoveRequest(params)
    },
    ...options,
  })
}

/**
 * Export work log as PDF or CSV
 */
export function useExportWorkLogMutation(
  options?: UseMutationOptions<ExportWorkLogResponse, Error, ExportWorkLogParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ExportWorkLogParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.exportWorkLog(params)
    },
    ...options,
  })
}

/**
 * Check for time overlap with existing work logs
 */
export function useCheckTimeOverlapMutation(
  options?: UseMutationOptions<CheckTimeOverlapResponse, Error, CheckTimeOverlapParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CheckTimeOverlapParams) => {
      if (!client) throw new Error('Missing client')
      return client.workLogs.checkTimeOverlap(params)
    },
    ...options,
  })
}
