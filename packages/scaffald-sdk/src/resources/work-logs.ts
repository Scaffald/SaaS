import { Resource } from './base.js'

// ===========================
// Types
// ===========================

export type WorkLogStatus = 'draft' | 'pending_verification' | 'verified' | 'disputed'
export type WorkLogEntryType = 'single_day' | 'date_range'
export type WorkLogVisibility = 'private' | 'organization' | 'public'
export type DeviceType = 'ios' | 'android' | 'web' | 'unknown'
export type LocationPermissionStatus = 'granted' | 'denied' | 'not_requested' | 'unknown'

export interface TimeEntry {
  start_time: string
  end_time: string
  break_minutes?: number
}

export interface WorkLog {
  id: string
  user_id: string
  status: WorkLogStatus
  project_id: string | null
  time_entries: TimeEntry[] | null
  tasks_completed: string[] | null
  skills_used: string[] | null
  visibility: WorkLogVisibility
  show_on_profile: boolean
  show_date_range_on_profile: boolean | null
  entry_type: WorkLogEntryType
  log_date: string
  work_description: string | null
  total_hours: number
  submitted_at: string | null
  verified_at: string | null
  disputed_at: string | null
  dispute_reason: string | null
  gps_location: unknown | null
  gps_accuracy_meters: number | null
  gps_captured_at: string | null
  device_type: DeviceType | null
  location_permission_status: LocationPermissionStatus | null
  created_at: string
  updated_at: string
  verified_by_user_id: string | null
  pending_move_to_project_id: string | null
  pending_move_reason: string | null
  pending_move_requested_at: string | null
  pending_move_requested_by: string | null
}

export interface WorkLogCollaborator {
  id: string
  work_log_id: string
  collaborator_user_id: string
  role: string | null
  hours_contributed: number | null
  created_at: string
  updated_at: string
}

export interface WorkLogPhoto {
  id: string
  work_log_id: string
  user_id: string
  storage_path: string
  file_name: string
  file_size_bytes: number | null
  mime_type: string | null
  caption: string | null
  visibility: WorkLogVisibility
  display_order: number
  uploaded_at: string
  created_at: string
}

export interface WorkLogComment {
  id: string
  work_log_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface ProjectOption {
  id: string
  name: string
  status: string | null
  isArchived: boolean
  organizationId: string | null
  projectNumber: string | null
}

export interface WorkLogListItem extends WorkLog {
  photoCount?: number
  collaboratorCount?: number
  commentCount?: number
}

export interface StatusSummary {
  count: number
  hours: number
}

export interface WorkLogOverview {
  statusSummary: Record<WorkLogStatus, StatusSummary>
  totalHours: number
  totalEntries: number
  recentActivity: WorkLogListItem[]
}

export interface ProjectRollup {
  projectId: string
  totalHours: number
  entryCount: number
  statusBreakdown: Record<WorkLogStatus, StatusSummary>
  collaborators: string[]
  dateRange: {
    earliest: string | null
    latest: string | null
  }
}

// ===========================
// Request Types
// ===========================

export interface GetProjectOptionsParams {
  organizationId?: string
  search?: string
  includeArchived?: boolean
}

export interface ListWorkLogsParams {
  page?: number
  pageSize?: number
  statuses?: WorkLogStatus[]
  projectId?: string
  organizationId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  sortField?: 'log_date' | 'created_at' | 'updated_at' | 'total_hours'
  sortDirection?: 'asc' | 'desc'
}

export interface GetOverviewParams {
  dateFrom?: string
  dateTo?: string
}

export interface GetProjectRollupParams {
  projectId: string
  dateFrom?: string
  dateTo?: string
}

export interface PublicProfileFeedParams {
  userId: string
  limit?: number
}

export interface CreateWorkLogParams {
  projectId?: string
  entryType: WorkLogEntryType
  logDate: string
  endDate?: string
  timeEntries?: TimeEntry[]
  tasksCompleted?: string[]
  skillsUsed?: string[]
  workDescription?: string
  visibility?: WorkLogVisibility
  showOnProfile?: boolean
  showDateRangeOnProfile?: boolean
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAccuracyMeters?: number
  gpsCapturedAt?: string
  deviceType?: DeviceType
  locationPermissionStatus?: LocationPermissionStatus
}

export interface UpdateWorkLogParams {
  workLogId: string
  projectId?: string
  entryType?: WorkLogEntryType
  logDate?: string
  endDate?: string
  timeEntries?: TimeEntry[]
  tasksCompleted?: string[]
  skillsUsed?: string[]
  workDescription?: string
  visibility?: WorkLogVisibility
  showOnProfile?: boolean
  showDateRangeOnProfile?: boolean
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAccuracyMeters?: number
  gpsCapturedAt?: string
  deviceType?: DeviceType
  locationPermissionStatus?: LocationPermissionStatus
}

export interface SubmitWorkLogParams {
  workLogId: string
}

export interface AddCollaboratorParams {
  workLogId: string
  collaboratorUserId: string
  role?: string
  hoursContributed?: number
}

export interface UpdateCollaboratorParams {
  collaboratorId: string
  role?: string
  hoursContributed?: number
}

export interface AddCommentParams {
  workLogId: string
  content: string
  parentCommentId?: string
}

export interface GetSuggestedSkillsParams {
  query: string
}

export interface AddSkillToProfileParams {
  skill: string
}

export interface UploadPhotoParams {
  workLogId: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
}

export interface UpdatePhotoMetadataParams {
  photoId: string
  caption?: string
  displayOrder?: number
}

export interface UpdatePhotoVisibilityParams {
  photoId: string
  visibility: WorkLogVisibility
}

export interface UpdateProfileVisibilityParams {
  workLogId: string
  showOnProfile: boolean
  showDateRangeOnProfile?: boolean
}

export interface MoveToProjectParams {
  workLogId: string
  targetProjectId: string
  reason?: string
}

export interface ApproveMoveRequestParams {
  workLogId: string
}

export interface DenyMoveRequestParams {
  workLogId: string
  reason?: string
}

export interface CancelMoveRequestParams {
  workLogId: string
}

export interface ExportWorkLogParams {
  workLogId: string
  format: 'pdf' | 'csv'
}

export interface CheckTimeOverlapParams {
  projectId?: string
  logDate: string
  endDate?: string
  timeEntries: TimeEntry[]
  excludeWorkLogId?: string
}

// ===========================
// Response Types
// ===========================

export interface WorkLogsListResponse {
  workLogs: WorkLogListItem[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface UploadPhotoResponse {
  photoId: string
  uploadUrl: string
  expiresAt: string
}

export interface ExportWorkLogResponse {
  downloadUrl: string
  expiresAt: string
}

export interface CheckTimeOverlapResponse {
  hasOverlap: boolean
  overlappingLogs: Array<{
    id: string
    logDate: string
    totalHours: number
  }>
}

/**
 * Work Logs resource - time tracking and work log management
 * Handles work logs, time entries, collaborators, photos, and approval workflows
 */
export class WorkLogs extends Resource {
  /**
   * Get available project options for creating work logs
   */
  async getProjectOptions(params?: GetProjectOptionsParams): Promise<ProjectOption[]> {
    return this.get<ProjectOption[]>('/v1/work-logs/projects',params)
  }

  /**
   * Get project rollup analytics
   */
  async getProjectRollup(params: GetProjectRollupParams): Promise<ProjectRollup> {
    return this.get<ProjectRollup>(`/v1/work-logs/projects/${params.projectId}/rollup`, {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })
  }

  /**
   * Get public work logs for a user's profile feed
   */
  async getPublicProfileFeed(params: PublicProfileFeedParams): Promise<WorkLogListItem[]> {
    return this.get<WorkLogListItem[]>('/v1/work-logs/public-feed', params)
  }

  /**
   * List work logs with filtering and pagination
   */
  async list(params?: ListWorkLogsParams): Promise<WorkLogsListResponse> {
    return this.get<WorkLogsListResponse>('/v1/work-logs', params)
  }

  /**
   * Get overview of work logs with status summary
   */
  async getOverview(params?: GetOverviewParams): Promise<WorkLogOverview> {
    return this.get<WorkLogOverview>('/v1/work-logs/overview',params)
  }

  /**
   * Create a new work log
   */
  async create(params: CreateWorkLogParams): Promise<WorkLog> {
    return this.post<WorkLog>('/v1/work-logs', params)
  }

  /**
   * Update a work log
   */
  async update(params: UpdateWorkLogParams): Promise<WorkLog> {
    return this.patch<WorkLog>(`/v1/work-logs/${params.workLogId}`, params)
  }

  /**
   * Submit a work log for verification
   */
  async submit(params: SubmitWorkLogParams): Promise<WorkLog> {
    return this.post<WorkLog>(`/v1/work-logs/${params.workLogId}/submit`)
  }

  /**
   * Add a collaborator to a work log
   */
  async addCollaborator(params: AddCollaboratorParams): Promise<WorkLogCollaborator> {
    return this.post<WorkLogCollaborator>(`/v1/work-logs/${params.workLogId}/collaborators`, params)
  }

  /**
   * Update a collaborator
   */
  async updateCollaborator(params: UpdateCollaboratorParams): Promise<WorkLogCollaborator> {
    return this.patch<WorkLogCollaborator>(`/v1/work-logs/collaborators/${params.collaboratorId}`, params)
  }

  /**
   * Remove a collaborator from a work log
   */
  async removeCollaborator(collaboratorId: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/v1/work-logs/collaborators/${collaboratorId}`)
  }

  /**
   * Add a comment to a work log
   */
  async addComment(params: AddCommentParams): Promise<WorkLogComment> {
    return this.post<WorkLogComment>(`/v1/work-logs/${params.workLogId}/comments`, params)
  }

  /**
   * Get suggested skills based on query
   */
  async getSuggestedSkills(params: GetSuggestedSkillsParams): Promise<string[]> {
    return this.get<string[]>('/v1/work-logs/skills/suggestions', params)
  }

  /**
   * Add a skill to user's profile
   */
  async addSkillToProfile(params: AddSkillToProfileParams): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/v1/work-logs/skills', params)
  }

  /**
   * Upload a photo to a work log
   */
  async uploadPhoto(params: UploadPhotoParams): Promise<UploadPhotoResponse> {
    return this.post<UploadPhotoResponse>(`/v1/work-logs/${params.workLogId}/photos`, params)
  }

  /**
   * Update photo metadata (caption, order)
   */
  async updatePhotoMetadata(params: UpdatePhotoMetadataParams): Promise<WorkLogPhoto> {
    return this.patch<WorkLogPhoto>(`/v1/work-logs/photos/${params.photoId}`, params)
  }

  /**
   * Update photo visibility
   */
  async updatePhotoVisibility(params: UpdatePhotoVisibilityParams): Promise<WorkLogPhoto> {
    return this.patch<WorkLogPhoto>(`/v1/work-logs/photos/${params.photoId}/visibility`, params)
  }

  /**
   * Delete a photo from a work log
   */
  async deletePhoto(photoId: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/v1/work-logs/photos/${photoId}`)
  }

  /**
   * Update work log profile visibility settings
   */
  async updateProfileVisibility(params: UpdateProfileVisibilityParams): Promise<WorkLog> {
    return this.patch<WorkLog>(`/v1/work-logs/${params.workLogId}/profile-visibility`, params)
  }

  /**
   * Request to move work log to different project
   */
  async moveToProject(params: MoveToProjectParams): Promise<WorkLog> {
    return this.post<WorkLog>(`/v1/work-logs/${params.workLogId}/move`, params)
  }

  /**
   * Approve a work log move request
   */
  async approveMoveRequest(params: ApproveMoveRequestParams): Promise<WorkLog> {
    return this.post<WorkLog>(`/v1/work-logs/${params.workLogId}/move/approve`)
  }

  /**
   * Deny a work log move request
   */
  async denyMoveRequest(params: DenyMoveRequestParams): Promise<WorkLog> {
    return this.post<WorkLog>(`/v1/work-logs/${params.workLogId}/move/deny`, params)
  }

  /**
   * Cancel a work log move request
   */
  async cancelMoveRequest(params: CancelMoveRequestParams): Promise<WorkLog> {
    return this.post<WorkLog>(`/v1/work-logs/${params.workLogId}/move/cancel`)
  }

  /**
   * Export work log as PDF or CSV
   */
  async exportWorkLog(params: ExportWorkLogParams): Promise<ExportWorkLogResponse> {
    return this.post<ExportWorkLogResponse>(`/v1/work-logs/${params.workLogId}/export`, params)
  }

  /**
   * Check for time overlap with existing work logs
   */
  async checkTimeOverlap(params: CheckTimeOverlapParams): Promise<CheckTimeOverlapResponse> {
    return this.post<CheckTimeOverlapResponse>('/v1/work-logs/check-overlap', params)
  }

  /**
   * Get collaborators for a work log
   */
  async getCollaborators(workLogId: string): Promise<WorkLogCollaborator[]> {
    return this.get<WorkLogCollaborator[]>(`/v1/work-logs/${workLogId}/collaborators`)
  }

  /**
   * Get conversation (comments) for a work log
   */
  async getConversation(workLogId: string): Promise<WorkLogComment[]> {
    return this.get<WorkLogComment[]>(`/v1/work-logs/${workLogId}/conversation`)
  }

  /**
   * Get a work log by ID
   */
  async getById(workLogId: string): Promise<WorkLog> {
    return this.get<WorkLog>(`/v1/work-logs/${workLogId}`)
  }
}
