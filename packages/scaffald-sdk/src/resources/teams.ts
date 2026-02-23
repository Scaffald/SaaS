import { Resource } from './base.js'
import type {
  ListTeamsParams,
  CreateTeamParams,
  UpdateTeamParams,
  ArchiveTeamParams,
  AddTeamMemberParams,
  UpdateTeamMemberParams,
  RemoveTeamMemberParams,
  InviteTeamMemberParams,
  CreateJobAssignmentParams,
  ListMyInvitationsParams,
  RespondToInvitationParams,
  RespondToInvitationWithTokenParams,
  RespondToInvitationWithTokenResponse,
  TeamsListResponse,
  TeamResponse,
  TeamMembersListResponse,
  TeamMemberResponse,
  TeamInvitationsListResponse,
  TeamInvitationResponse,
  TeamJobAssignmentsListResponse,
  TeamJobAssignmentResponse,
  DeleteResponse,
  RolesListResponse,
  GetTeamAnalyticsOverviewParams,
  TeamAnalyticsOverviewResponse,
} from '../types/teams.js'

/**
 * Teams resource for managing teams, members, invitations, and job assignments
 *
 * @remarks
 * All methods require authentication (API key or OAuth token)
 * Teams enable collaborative hiring workflows within organizations
 */
export class Teams extends Resource {
  // ===== Core Operations =====

  /**
   * List teams
   *
   * @param params - Optional filtering parameters
   * @returns List of teams
   *
   * @example
   * ```typescript
   * // List all teams for an organization
   * const { teams } = await client.teams.list({
   *   organizationId: 'org_123'
   * })
   *
   * // Include archived teams
   * const { teams: allTeams } = await client.teams.list({
   *   organizationId: 'org_123',
   *   includeArchived: true
   * })
   * ```
   */
  async list(params?: ListTeamsParams): Promise<TeamsListResponse> {
    return this.get<TeamsListResponse>('/v1/teams', params)
  }

  /**
   * Get team by ID
   *
   * @param id - The team ID
   * @returns The team object
   *
   * @example
   * ```typescript
   * const { team } = await client.teams.retrieve('team_123')
   * console.log(`${team.name} - ${team.purpose}`)
   * ```
   */
  async retrieve(id: string): Promise<TeamResponse> {
    return this.get<TeamResponse>(`/v1/teams/${id}`)
  }

  /**
   * Create a new team
   *
   * @param params - Team creation parameters
   * @returns The created team
   *
   * @example
   * ```typescript
   * const { team } = await client.teams.create({
   *   organizationId: 'org_123',
   *   name: 'Engineering Hiring Team',
   *   purpose: 'Hire software engineers',
   *   visibility: 'organization',
   *   invitationPolicy: 'invite_only'
   * })
   * ```
   */
  async create(params: CreateTeamParams): Promise<TeamResponse> {
    return this.post<TeamResponse>('/v1/teams', params)
  }

  /**
   * Update a team
   *
   * @param id - The team ID
   * @param params - Team update parameters
   * @returns The updated team
   *
   * @example
   * ```typescript
   * const { team } = await client.teams.update('team_123', {
   *   name: 'Senior Engineering Hiring',
   *   description: 'Focus on senior-level positions',
   *   allowSelfJoin: true
   * })
   * ```
   */
  async update(id: string, params: UpdateTeamParams): Promise<TeamResponse> {
    return this.patch<TeamResponse>(`/v1/teams/${id}`, params)
  }

  /**
   * Archive a team
   *
   * @param id - The team ID
   * @param params - Optional archive parameters
   * @returns The archived team
   *
   * @example
   * ```typescript
   * const { team } = await client.teams.archive('team_123', {
   *   reason: 'Hiring season ended'
   * })
   * ```
   */
  async archive(id: string, params?: ArchiveTeamParams): Promise<TeamResponse> {
    return this.post<TeamResponse>(`/v1/teams/${id}/archive`, params || {})
  }

  // ===== Member Management =====

  /**
   * List team members
   *
   * @param id - The team ID
   * @returns List of team members
   *
   * @example
   * ```typescript
   * const { members } = await client.teams.listMembers('team_123')
   * for (const member of members) {
   *   console.log(`${member.user?.displayName} - ${member.role?.name}`)
   * }
   * ```
   */
  async listMembers(id: string): Promise<TeamMembersListResponse> {
    return this.get<TeamMembersListResponse>(`/v1/teams/${id}/members`)
  }

  /**
   * Add a member to the team
   *
   * @param id - The team ID
   * @param params - Member addition parameters
   * @returns The added team member
   *
   * @example
   * ```typescript
   * const { member } = await client.teams.addMember('team_123', {
   *   userId: 'user_456',
   *   roleKey: 'recruiter'
   * })
   * ```
   */
  async addMember(id: string, params: AddTeamMemberParams): Promise<TeamMemberResponse> {
    return this.post<TeamMemberResponse>(`/v1/teams/${id}/members`, params)
  }

  /**
   * Update a team member
   *
   * @param id - The team ID
   * @param userId - The user ID
   * @param params - Member update parameters
   * @returns The updated team member
   *
   * @example
   * ```typescript
   * const { member } = await client.teams.updateMember('team_123', 'user_456', {
   *   roleKey: 'lead',
   *   status: 'active'
   * })
   * ```
   */
  async updateMember(
    id: string,
    userId: string,
    params: UpdateTeamMemberParams
  ): Promise<TeamMemberResponse> {
    return this.patch<TeamMemberResponse>(`/v1/teams/${id}/members/${userId}`, params)
  }

  /**
   * Remove a member from the team
   *
   * @param id - The team ID
   * @param userId - The user ID
   * @param params - Optional removal parameters
   * @returns Confirmation of removal
   *
   * @example
   * ```typescript
   * await client.teams.removeMember('team_123', 'user_456', {
   *   reason: 'Role ended'
   * })
   * ```
   */
  async removeMember(
    id: string,
    userId: string,
    _params?: RemoveTeamMemberParams
  ): Promise<DeleteResponse> {
    return this.del<DeleteResponse>(`/v1/teams/${id}/members/${userId}`)
  }

  // ===== Invitation Management =====

  /**
   * List team invitations
   *
   * @param id - The team ID
   * @returns List of team invitations
   *
   * @example
   * ```typescript
   * const { invitations } = await client.teams.listInvitations('team_123')
   * const pending = invitations.filter(inv => inv.status === 'pending')
   * console.log(`${pending.length} pending invitations`)
   * ```
   */
  async listInvitations(id: string): Promise<TeamInvitationsListResponse> {
    return this.get<TeamInvitationsListResponse>(`/v1/teams/${id}/invitations`)
  }

  /**
   * Invite a member to the team
   *
   * @param id - The team ID
   * @param params - Invitation parameters
   * @returns The created invitation
   *
   * @example
   * ```typescript
   * const { invitation } = await client.teams.inviteMember('team_123', {
   *   email: 'recruiter@example.com',
   *   roleKey: 'recruiter',
   *   message: 'Join our hiring team!'
   * })
   * ```
   */
  async inviteMember(id: string, params: InviteTeamMemberParams): Promise<TeamInvitationResponse> {
    return this.post<TeamInvitationResponse>(`/v1/teams/${id}/invitations`, params)
  }

  /**
   * Cancel a team invitation
   *
   * @param id - The team ID
   * @param invitationId - The invitation ID
   * @returns Confirmation of cancellation
   *
   * @example
   * ```typescript
   * await client.teams.cancelInvitation('team_123', 'inv_456')
   * ```
   */
  async cancelInvitation(id: string, invitationId: string): Promise<DeleteResponse> {
    return this.del<DeleteResponse>(`/v1/teams/${id}/invitations/${invitationId}`)
  }

  /**
   * Resend a team invitation
   *
   * @param id - The team ID
   * @param invitationId - The invitation ID
   * @returns Confirmation of resend
   *
   * @example
   * ```typescript
   * await client.teams.resendInvitation('team_123', 'inv_456')
   * ```
   */
  async resendInvitation(id: string, invitationId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/v1/teams/${id}/invitations/${invitationId}/resend`, {})
  }

  // ===== Roles Management =====

  /**
   * List team roles for an organization
   *
   * @param organizationId - The organization ID
   * @returns List of team roles
   *
   * @example
   * ```typescript
   * const { roles } = await client.teams.listRoles('org_123')
   * console.log(`Found ${roles.length} team roles`)
   * ```
   */
  async listRoles(organizationId: string): Promise<RolesListResponse> {
    return this.get<RolesListResponse>(`/v1/teams/roles?organizationId=${organizationId}`)
  }

  // ===== User-Facing Invitation Operations =====

  /**
   * List invitations sent to the current user
   *
   * @param params - Optional filtering parameters
   * @returns List of invitations sent to the current user
   *
   * @example
   * ```typescript
   * // List all pending invitations
   * const { invitations } = await client.teams.listMyInvitations({ status: 'pending' })
   * console.log(`You have ${invitations.length} pending team invitations`)
   *
   * // List all invitations
   * const { invitations: allInvitations } = await client.teams.listMyInvitations()
   * ```
   */
  async listMyInvitations(params?: ListMyInvitationsParams): Promise<TeamInvitationsListResponse> {
    const query = params?.status ? `?status=${params.status}` : ''
    return this.get<TeamInvitationsListResponse>(`/v1/teams/invitations/mine${query}`)
  }

  /**
   * Respond to a team invitation (accept or decline)
   *
   * @param invitationId - The invitation ID
   * @param params - Response parameters (action: accept or decline)
   * @returns The updated invitation
   *
   * @example
   * ```typescript
   * // Accept an invitation
   * const { invitation } = await client.teams.respondToInvitation('inv_123', {
   *   action: 'accept'
   * })
   * console.log(`You are now a member of team ${invitation.team?.name}`)
   *
   * // Decline an invitation
   * await client.teams.respondToInvitation('inv_456', {
   *   action: 'decline'
   * })
   * ```
   */
  async respondToInvitation(
    invitationId: string,
    params: RespondToInvitationParams
  ): Promise<TeamInvitationResponse> {
    return this.post<TeamInvitationResponse>(`/v1/teams/invitations/${invitationId}/respond`, params)
  }

  /**
   * Respond to an invitation using a token (public endpoint)
   *
   * @param params - Response parameters including token and action
   * @returns Response status and team ID
   *
   * @remarks
   * This endpoint does not require authentication - it's used for email invitation links.
   * The token is validated server-side to identify the invitation.
   *
   * @example
   * ```typescript
   * // Accept an invitation from an email link
   * const { status, teamId } = await client.teams.respondToInvitationWithToken({
   *   token: 'invitation_token_from_email',
   *   action: 'accept',
   *   responderId: 'user_123'
   * })
   * console.log(`Invitation ${status}, team ID: ${teamId}`)
   *
   * // Decline an invitation
   * await client.teams.respondToInvitationWithToken({
   *   token: 'invitation_token_from_email',
   *   action: 'decline'
   * })
   * ```
   */
  async respondToInvitationWithToken(
    params: RespondToInvitationWithTokenParams
  ): Promise<RespondToInvitationWithTokenResponse> {
    return this.post<RespondToInvitationWithTokenResponse>('/v1/teams/invitations/respond', params)
  }

  // ===== Job Assignment Management =====

  /**
   * List job assignments for a team
   *
   * @param id - The team ID
   * @returns List of job assignments
   *
   * @example
   * ```typescript
   * const { assignments } = await client.teams.listJobAssignments('team_123')
   * const primary = assignments.filter(a => a.isPrimary)
   * console.log(`${primary.length} primary job assignments`)
   * ```
   */
  async listJobAssignments(id: string): Promise<TeamJobAssignmentsListResponse> {
    return this.get<TeamJobAssignmentsListResponse>(`/v1/teams/${id}/jobs`)
  }

  /**
   * Assign a job to the team
   *
   * @param id - The team ID
   * @param params - Job assignment parameters
   * @returns The created job assignment
   *
   * @example
   * ```typescript
   * const { assignment } = await client.teams.createJobAssignment('team_123', {
   *   jobId: 'job_789',
   *   isPrimary: true
   * })
   * ```
   */
  async createJobAssignment(
    id: string,
    params: CreateJobAssignmentParams
  ): Promise<TeamJobAssignmentResponse> {
    return this.post<TeamJobAssignmentResponse>(`/v1/teams/${id}/jobs`, params)
  }

  /**
   * Remove a job assignment from the team
   *
   * @param id - The team ID
   * @param assignmentId - The assignment ID (or job ID)
   * @returns Confirmation of removal
   *
   * @example
   * ```typescript
   * await client.teams.deleteJobAssignment('team_123', 'assignment_999')
   * ```
   */
  async deleteJobAssignment(id: string, assignmentId: string): Promise<DeleteResponse> {
    return this.del<DeleteResponse>(`/v1/teams/${id}/jobs/${assignmentId}`)
  }

  /**
   * Assign an application to a team member
   */
  async assignApplication(
    teamId: string,
    applicationId: string,
    params: { assigneeUserId: string }
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `/v1/teams/${teamId}/applications/${applicationId}/assign`,
      params
    )
  }

  /**
   * Get analytics overview for a team
   */
  async getAnalyticsOverview(
    id: string,
    params?: GetTeamAnalyticsOverviewParams
  ): Promise<TeamAnalyticsOverviewResponse> {
    const query = new URLSearchParams()
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    if (params?.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    return this.get<TeamAnalyticsOverviewResponse>(
      `/v1/teams/${id}/analytics/overview${qs ? `?${qs}` : ''}`
    )
  }
}
