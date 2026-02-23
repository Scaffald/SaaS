/**
 * React hooks for Teams SDK
 * Provides query and mutation hooks for team management
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  ListTeamsParams,
  CreateTeamParams,
  UpdateTeamParams,
  ArchiveTeamParams,
  AddTeamMemberParams,
  UpdateTeamMemberParams,
  InviteTeamMemberParams,
  RespondToInvitationParams,
  CreateJobAssignmentParams,
  TeamResponse,
  TeamMemberResponse,
  TeamInvitationResponse,
  TeamJobAssignmentResponse,
  DeleteResponse,
  GetTeamAnalyticsOverviewParams,
  TeamAnalyticsOverviewResponse,
} from '@scaffald/sdk'

export function useAssignApplicationMutation(
  options?: UseMutationOptions<
    { success: boolean },
    Error,
    { teamId: string; applicationId: string; assigneeUserId: string }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      teamId,
      applicationId,
      assigneeUserId,
    }: {
      teamId: string
      applicationId: string
      assigneeUserId: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.assignApplication(teamId, applicationId, { assigneeUserId })
    },
    ...options,
  })
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List teams
 */
export function useTeams(params?: ListTeamsParams, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.teams.list(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Get team by ID
 */
export function useTeam(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', 'detail', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.teams.retrieve(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * List team members
 */
export function useTeamMembers(teamId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: async () => {
      if (!client || !teamId) throw new Error('Missing client or teamId')
      return client.teams.listMembers(teamId)
    },
    enabled: !!client && !!teamId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * List team invitations
 */
export function useTeamInvitations(teamId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', teamId, 'invitations'],
    queryFn: async () => {
      if (!client || !teamId) throw new Error('Missing client or teamId')
      return client.teams.listInvitations(teamId)
    },
    enabled: !!client && !!teamId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * List my team invitations
 */
export function useMyTeamInvitations(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', 'my-invitations'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.teams.listMyInvitations()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * List team roles
 */
export function useTeamRoles(organizationId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', 'roles', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.teams.listRoles(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes (roles change infrequently)
  })
}

/**
 * List team job assignments
 */
export function useTeamJobAssignments(teamId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', teamId, 'job-assignments'],
    queryFn: async () => {
      if (!client || !teamId) throw new Error('Missing client or teamId')
      return client.teams.listJobAssignments(teamId)
    },
    enabled: !!client && !!teamId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a team
 */
export function useCreateTeamMutation(
  options?: UseMutationOptions<TeamResponse, Error, CreateTeamParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateTeamParams) => {
      if (!client) throw new Error('Missing client')
      return client.teams.create(params)
    },
    onSuccess: (_data, _variables) => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: ['teams', 'list'] })
    },
    ...options,
  })
}

/**
 * Update a team
 */
export function useUpdateTeamMutation(
  options?: UseMutationOptions<TeamResponse, Error, { id: string; params: UpdateTeamParams }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateTeamParams }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.update(id, params)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team detail and list
      queryClient.invalidateQueries({ queryKey: ['teams', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['teams', 'list'] })
    },
    ...options,
  })
}

/**
 * Archive a team
 */
export function useArchiveTeamMutation(
  options?: UseMutationOptions<TeamResponse, Error, { id: string; params?: ArchiveTeamParams }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params?: ArchiveTeamParams }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.archive(id, params)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team detail and list
      queryClient.invalidateQueries({ queryKey: ['teams', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['teams', 'list'] })
    },
    ...options,
  })
}

/**
 * Add a team member
 */
export function useAddTeamMemberMutation(
  options?: UseMutationOptions<
    TeamMemberResponse,
    Error,
    { id: string; params: AddTeamMemberParams }
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: AddTeamMemberParams }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.addMember(id, params)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team members list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'members'] })
    },
    ...options,
  })
}

/**
 * Update a team member
 */
export function useUpdateTeamMemberMutation(
  options?: UseMutationOptions<
    TeamMemberResponse,
    Error,
    { id: string; userId: string; params: UpdateTeamMemberParams }
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      params,
    }: {
      id: string
      userId: string
      params: UpdateTeamMemberParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.updateMember(id, userId, params)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team members list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'members'] })
    },
    ...options,
  })
}

/**
 * Remove a team member
 */
export function useRemoveTeamMemberMutation(
  options?: UseMutationOptions<DeleteResponse, Error, { id: string; userId: string }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.removeMember(id, userId)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team members list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'members'] })
    },
    ...options,
  })
}

/**
 * Invite a team member
 */
export function useInviteTeamMemberMutation(
  options?: UseMutationOptions<
    TeamInvitationResponse,
    Error,
    { id: string; params: InviteTeamMemberParams }
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: InviteTeamMemberParams }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.inviteMember(id, params)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team invitations list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'invitations'] })
    },
    ...options,
  })
}

/**
 * Cancel a team invitation
 */
export function useCancelTeamInvitationMutation(
  options?: UseMutationOptions<DeleteResponse, Error, { id: string; invitationId: string }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, invitationId }: { id: string; invitationId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.cancelInvitation(id, invitationId)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate team invitations list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'invitations'] })
    },
    ...options,
  })
}

/**
 * Resend a team invitation
 */
export function useResendTeamInvitationMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string; invitationId: string }>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async ({ id, invitationId }: { id: string; invitationId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.resendInvitation(id, invitationId)
    },
    ...options,
  })
}

/**
 * Respond to a team invitation
 */
export function useRespondToTeamInvitationMutation(
  options?: UseMutationOptions<
    TeamMemberResponse,
    Error,
    { invitationId: string; params: RespondToInvitationParams }
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      invitationId,
      params,
    }: {
      invitationId: string
      params: RespondToInvitationParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.respondToInvitation(invitationId, params)
    },
    onSuccess: () => {
      // Invalidate my invitations and teams list
      queryClient.invalidateQueries({ queryKey: ['teams', 'my-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['teams', 'list'] })
    },
    ...options,
  })
}

/**
 * Create a job assignment
 */
export function useCreateTeamJobAssignmentMutation(
  options?: UseMutationOptions<
    TeamJobAssignmentResponse,
    Error,
    { id: string; params: CreateJobAssignmentParams }
  >
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: CreateJobAssignmentParams }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.createJobAssignment(id, params)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate job assignments list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'job-assignments'] })
    },
    ...options,
  })
}

/**
 * Delete a job assignment
 */
export function useDeleteTeamJobAssignmentMutation(
  options?: UseMutationOptions<DeleteResponse, Error, { id: string; assignmentId: string }>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, assignmentId }: { id: string; assignmentId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.teams.deleteJobAssignment(id, assignmentId)
    },
    onSuccess: (_data, { id }) => {
      // Invalidate job assignments list
      queryClient.invalidateQueries({ queryKey: ['teams', id, 'job-assignments'] })
    },
    ...options,
  })
}

/**
 * Get analytics overview for a team
 */
export function useTeamAnalyticsOverview(
  teamId: string | undefined,
  params?: GetTeamAnalyticsOverviewParams,
  options?: { enabled?: boolean; placeholderData?: (prev: TeamAnalyticsOverviewResponse | undefined) => TeamAnalyticsOverviewResponse | undefined }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', teamId, 'analytics', 'overview', params],
    queryFn: async () => {
      if (!client || !teamId) throw new Error('Missing client or teamId')
      return client.teams.getAnalyticsOverview(teamId, params)
    },
    enabled: !!client && !!teamId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    placeholderData: options?.placeholderData,
  })
}
