/**
 * Team role information
 */
export interface TeamRole {
  id: string
  key: string
  name: string
  description?: string | null
  isDefault?: boolean
  isSystem?: boolean
}

/**
 * User information for team members
 */
export interface TeamUserProfile {
  id: string
  displayName: string | null
  username: string | null
  avatarPath: string | null
}

/**
 * Core team object
 */
export interface Team {
  id: string
  organizationId: string
  name: string
  slug: string | null
  purpose: string | null
  visibility: 'public' | 'organization' | 'private'
  invitationPolicy: 'open' | 'invite_only' | 'closed'
  description: string | null
  imageUrl: string | null
  metadata: Record<string, unknown>
  settings: Record<string, unknown>
  allowSelfJoin: boolean
  autoAssignJobs: boolean
  invitationExpirationDays: number
  workloadStrategy: 'manual' | 'auto_round_robin' | 'auto_balanced'
  workloadSettings: Record<string, unknown>
  analyticsMetadata: Record<string, unknown>
  analyticsLastRefreshedAt: string | null
  analyticsRefreshIntervalMinutes: number
  defaultRoleKey: string
  defaultRoleId: string | null
  defaultRole: TeamRole | null
  isArchived: boolean
  archivedAt: string | null
  archivedBy: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

/**
 * Team member object
 */
export interface TeamMember {
  id: string
  teamId: string
  userId: string
  roleId: string | null
  status: 'active' | 'inactive' | 'pending' | 'removed'
  joinedAt: string | null
  invitedBy: string | null
  removedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  role: TeamRole | null
  user: TeamUserProfile | null
}

/**
 * Team invitation object
 */
export interface TeamInvitation {
  id: string
  teamId: string
  email: string | null
  invitedUserId: string | null
  roleId: string | null
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'
  expiresAt: string | null
  acceptedAt: string | null
  declinedAt: string | null
  revokedAt: string | null
  sentAt: string | null
  notificationId: string | null
  lastDeliveryStatus: string | null
  lastDeliveryError: string | null
  lastDeliveryChannels: string[] | null
  createdAt: string
  createdBy: string | null
  metadata: Record<string, unknown>
  role: TeamRole | null
  team: {
    id: string
    name: string | null
    organizationId: string | null
    organizationName: string | null
  } | null
}

/**
 * Team job assignment object
 */
export interface TeamJobAssignment {
  id: string
  teamId: string
  jobId: string
  isPrimary: boolean
  assignedAt: string
  assignedBy: string | null
  job: {
    id: string
    title: string
    status: string
    organizationId: string
  } | null
}

// ===== Request Parameters =====

/**
 * Parameters for listing teams
 */
export interface ListTeamsParams {
  organizationId?: string
  includeArchived?: boolean
}

/**
 * Parameters for creating a team
 */
export interface CreateTeamParams {
  organizationId: string
  name: string
  slug?: string
  purpose?: string
  visibility?: 'public' | 'organization' | 'private'
  invitationPolicy?: 'open' | 'invite_only' | 'closed'
  description?: string
  imageUrl?: string
  metadata?: Record<string, unknown>
  settings?: Record<string, unknown>
  allowSelfJoin?: boolean
  autoAssignJobs?: boolean
  invitationExpirationDays?: number
  workloadStrategy?: 'manual' | 'auto_round_robin' | 'auto_balanced'
  workloadSettings?: Record<string, unknown>
  analyticsMetadata?: Record<string, unknown>
  analyticsRefreshIntervalMinutes?: number
  defaultRoleKey?: string
  defaultRoleId?: string
}

/**
 * Parameters for updating a team
 */
export interface UpdateTeamParams {
  name?: string
  slug?: string
  purpose?: string
  visibility?: 'public' | 'organization' | 'private'
  invitationPolicy?: 'open' | 'invite_only' | 'closed'
  description?: string
  imageUrl?: string
  metadata?: Record<string, unknown>
  settings?: Record<string, unknown>
  allowSelfJoin?: boolean
  autoAssignJobs?: boolean
  invitationExpirationDays?: number
  workloadStrategy?: 'manual' | 'auto_round_robin' | 'auto_balanced'
  workloadSettings?: Record<string, unknown>
  analyticsMetadata?: Record<string, unknown>
  analyticsRefreshIntervalMinutes?: number
  defaultRoleKey?: string
  defaultRoleId?: string
}

/**
 * Parameters for archiving a team
 */
export interface ArchiveTeamParams {
  reason?: string
}

/**
 * Parameters for adding a team member
 */
export interface AddTeamMemberParams {
  userId: string
  roleId?: string
  roleKey?: string
  metadata?: Record<string, unknown>
}

/**
 * Parameters for updating a team member
 */
export interface UpdateTeamMemberParams {
  roleId?: string
  roleKey?: string
  status?: 'active' | 'inactive'
  metadata?: Record<string, unknown>
}

/**
 * Parameters for removing a team member
 */
export interface RemoveTeamMemberParams {
  reason?: string
}

/**
 * Parameters for inviting a team member
 */
export interface InviteTeamMemberParams {
  email: string
  roleId?: string
  roleKey?: string
  message?: string
  personalNote?: string
  metadata?: Record<string, unknown>
}

/**
 * Parameters for creating a job assignment
 */
export interface CreateJobAssignmentParams {
  jobId: string
  isPrimary?: boolean
}

/**
 * Parameters for listing user's invitations
 */
export interface ListMyInvitationsParams {
  status?: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'
}

/**
 * Parameters for responding to an invitation
 */
export interface RespondToInvitationParams {
  action: 'accept' | 'decline'
}

/**
 * Parameters for responding to an invitation with a token (public endpoint)
 */
export interface RespondToInvitationWithTokenParams {
  token: string
  action: 'accept' | 'decline'
  responderId?: string
  responseMetadata?: Record<string, unknown>
}

// ===== Response Types =====

/**
 * Response from listing teams
 */
export interface TeamsListResponse {
  teams: Team[]
}

/**
 * Response from team operations
 */
export interface TeamResponse {
  team: Team
}

/**
 * Response from listing team members
 */
export interface TeamMembersListResponse {
  members: TeamMember[]
}

/**
 * Response from team member operations
 */
export interface TeamMemberResponse {
  member: TeamMember
}

/**
 * Response from listing team invitations
 */
export interface TeamInvitationsListResponse {
  invitations: TeamInvitation[]
}

/**
 * Response from team invitation operations
 */
export interface TeamInvitationResponse {
  invitation: TeamInvitation
}

/**
 * Response from token-based invitation response
 */
export interface RespondToInvitationWithTokenResponse {
  status: 'accepted' | 'declined'
  teamId: string
}

/**
 * Response from listing job assignments
 */
export interface TeamJobAssignmentsListResponse {
  assignments: TeamJobAssignment[]
}

/**
 * Response from job assignment operations
 */
export interface TeamJobAssignmentResponse {
  assignment: TeamJobAssignment
}

/**
 * Response from delete operations
 */
export interface DeleteResponse {
  success: boolean
}

/**
 * Response from list roles operation
 */
export interface RolesListResponse {
  roles: TeamRole[]
}

/**
 * A daily analytics metric record for a team
 */
export interface TeamDailyMetric {
  id: string
  teamId: string
  organizationId: string
  date: string
  members: { total: number; active: number; pending: number }
  jobs: { active: number }
  applications: { active: number; reviewed: number; escalated: number }
  invitations: { pending: number }
  timeToFirstReview: { averageSeconds: number | null; medianSeconds: number | null }
  workloadPressureScore: number | null
  metadata: Record<string, unknown>
  capturedAt: string
  createdAt: string
}

/**
 * Params for getting team analytics overview
 */
export interface GetTeamAnalyticsOverviewParams {
  startDate?: string
  endDate?: string
  limit?: number
}

/**
 * Response from team analytics overview
 */
export interface TeamAnalyticsOverviewResponse {
  metrics: TeamDailyMetric[]
}

/**
 * A workload snapshot for a single team member
 */
export interface TeamWorkloadSnapshot {
  id: string
  teamId: string
  organizationId: string
  teamMemberId: string
  userId: string
  capturedAt: string
  pendingAssignments: number
  activeAssignments: number
  overdueAssignments: number
  completedReviews: number
  weeklyCapacity: number | null
  availabilityScore: number | null
  metadata: Record<string, unknown>
}

/**
 * Params for getting team member workloads
 */
export interface GetTeamWorkloadParams {
  includeHistorical?: boolean
  asOf?: string
}

/**
 * Response from team workload query
 */
export interface TeamWorkloadResponse {
  snapshots: TeamWorkloadSnapshot[]
}

/**
 * A team activity event
 */
export interface TeamActivityEvent {
  id: string
  teamId: string
  organizationId: string
  eventType: string
  actorUserId: string | null
  subjectUserId: string | null
  relatedMemberId: string | null
  relatedJobId: string | null
  relatedApplicationId: string | null
  payload: Record<string, unknown>
  occurredAt: string
  createdAt: string
}

/**
 * Params for getting team activity feed
 */
export interface GetTeamActivityFeedParams {
  pageSize?: number
  cursor?: string
  startDate?: string
  endDate?: string
}

/**
 * Response from team activity feed query
 */
export interface TeamActivityFeedResponse {
  events: TeamActivityEvent[]
  nextCursor: string | null
}

/**
 * A team comment (discussion.comment activity event)
 */
export interface TeamComment {
  id: string
  teamId: string
  organizationId: string
  eventType: string
  actorUserId: string | null
  actorDisplayName: string | null
  relatedApplicationId: string | null
  body: string
  mentions: string[]
  occurredAt: string
  createdAt: string
}

/**
 * Params for getting team comments
 */
export interface GetTeamCommentsParams {
  applicationId?: string
  limit?: number
  cursor?: string
}

/**
 * Response from team comments query
 */
export interface TeamCommentsResponse {
  comments: TeamComment[]
  nextCursor: string | null
}

/**
 * Params for posting a team comment
 */
export interface PostTeamCommentParams {
  body: string
  mentions?: string[]
  applicationId?: string
}

/**
 * Params for transferring team ownership
 */
export interface TransferTeamOwnershipParams {
  memberId: string
  roleKey?: string
  notify?: boolean
}

/**
 * Params for self-removing from a team
 */
export interface SelfRemoveFromTeamParams {
  reason?: string
}
