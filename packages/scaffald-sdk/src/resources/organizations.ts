import { Resource } from './base.js'
import type {
  Organization,
  OrganizationMember,
  OrganizationDocument,
  OrganizationSettings,
  ListMembersParams,
  InviteMemberParams,
  RemoveMemberParams,
  ListDocumentsParams,
  CreateDocumentUploadParams,
  DocumentUploadSession,
  DocumentDownloadUrl,
  UpdateSettingsParams,
  OpenJobsCountResponse,
  MembersListResponse,
  DocumentsListResponse,
  InvitationResponse,
  OrganizationInvitation,
  InviteStatus,
  MemberActivityEntry,
  DocumentVersion,
  CommitDocumentVersionParams,
  DocumentShare,
  ShareDocumentParams,
  UpdateDocumentShareParams,
  DocumentSearchResult,
  OrganizationFolder,
  FolderUpsertParams,
  OrganizationLocation,
  LocationUpsertParams,
  AuditLogListParams,
  AuditLogListResponse,
  ExportAuditLogParams,
  AuditLogExportResponse,
  StorageUsageSummary,
} from '../types/organizations.js'

/**
 * Organizations resource for managing organizations, members, documents, and settings
 *
 * @remarks
 * All methods require authentication (API key or OAuth token)
 */
export class Organizations extends Resource {
  // ===== Core Operations =====

  /**
   * Get organization by ID
   *
   * @param id - The organization ID
   * @returns The organization object
   *
   * @example
   * ```typescript
   * const org = await client.organizations.retrieve('org_123')
   * console.log(`${org.name} - ${org.description}`)
   * ```
   */
  async retrieve(id: string): Promise<Organization> {
    return this.get<Organization>(`/v1/organizations/${id}`)
  }

  /**
   * Get count of open jobs for an organization
   *
   * @param id - The organization ID
   * @returns Object with count and organization ID
   *
   * @example
   * ```typescript
   * const { count } = await client.organizations.getOpenJobsCount('org_123')
   * console.log(`${count} open positions`)
   * ```
   */
  async getOpenJobsCount(id: string): Promise<OpenJobsCountResponse> {
    return this.get<OpenJobsCountResponse>(`/v1/organizations/${id}/open-jobs-count`)
  }

  // ===== Member Management =====

  /**
   * List organization members
   *
   * @param id - The organization ID
   * @param params - Optional filtering parameters
   * @returns List of organization members
   *
   * @example
   * ```typescript
   * const members = await client.organizations.listMembers('org_123', {
   *   search: 'john',
   *   roleNames: ['admin', 'member']
   * })
   * ```
   */
  async listMembers(id: string, params?: ListMembersParams): Promise<MembersListResponse> {
    const members = await this.get<OrganizationMember[]>(`/v1/organizations/${id}/members`, params)
    return {
      data: members,
      total: members.length,
    }
  }

  /**
   * Invite a new member to the organization
   *
   * @param id - The organization ID
   * @param params - Invitation parameters
   * @returns Invitation response with ID and token
   *
   * @example
   * ```typescript
   * const invite = await client.organizations.inviteMember('org_123', {
   *   email: 'john@example.com',
   *   roleName: 'member',
   *   message: 'Welcome to the team!'
   * })
   * ```
   */
  async inviteMember(id: string, params: InviteMemberParams): Promise<InvitationResponse> {
    return this.post<InvitationResponse>(`/v1/organizations/${id}/members/invite`, params)
  }

  /**
   * Remove a member from the organization
   *
   * @param id - The organization ID
   * @param userId - The user ID to remove
   * @param params - Optional removal parameters
   * @returns Confirmation of removal
   *
   * @example
   * ```typescript
   * await client.organizations.removeMember('org_123', 'user_456', {
   *   reason: 'Left the company'
   * })
   * ```
   */
  async removeMember(
    id: string,
    userId: string,
    params?: RemoveMemberParams
  ): Promise<{ removed: boolean }> {
    return this.post<{ removed: boolean }>(
      `/v1/organizations/${id}/members/${userId}/remove`,
      params || {}
    )
  }

  // ===== Document Management =====

  /**
   * List organization documents
   *
   * @param id - The organization ID
   * @param params - Optional filtering and pagination parameters
   * @returns List of documents
   *
   * @example
   * ```typescript
   * const docs = await client.organizations.listDocuments('org_123', {
   *   category: 'contracts',
   *   limit: 20
   * })
   * ```
   */
  async listDocuments(id: string, params?: ListDocumentsParams): Promise<DocumentsListResponse> {
    const documents = await this.get<OrganizationDocument[]>(
      `/v1/organizations/${id}/documents`,
      params
    )
    return {
      data: documents,
      total: documents.length,
    }
  }

  /**
   * Get a specific document
   *
   * @param id - The organization ID
   * @param documentId - The document ID
   * @returns The document object
   *
   * @example
   * ```typescript
   * const doc = await client.organizations.getDocument('org_123', 'doc_456')
   * console.log(`${doc.name} (${doc.category})`)
   * ```
   */
  async getDocument(id: string, documentId: string): Promise<OrganizationDocument> {
    return this.get<OrganizationDocument>(`/v1/organizations/${id}/documents/${documentId}`)
  }

  /**
   * Create a document upload session
   *
   * @param id - The organization ID
   * @param params - Upload session parameters
   * @returns Upload session with signed URL
   *
   * @example
   * ```typescript
   * const session = await client.organizations.createDocumentUploadSession('org_123', {
   *   name: 'Employment Contract',
   *   fileName: 'contract.pdf',
   *   mimeType: 'application/pdf',
   *   fileSize: 524288,
   *   category: 'contracts'
   * })
   * // Use session.uploadUrl to upload the file
   * ```
   */
  async createDocumentUploadSession(
    id: string,
    params: CreateDocumentUploadParams
  ): Promise<DocumentUploadSession> {
    return this.post<DocumentUploadSession>(
      `/v1/organizations/${id}/documents/upload-session`,
      params
    )
  }

  /**
   * Create a download URL for a document
   *
   * @param id - The organization ID
   * @param documentId - The document ID
   * @param versionId - Optional specific version ID
   * @returns Signed download URL
   *
   * @example
   * ```typescript
   * const { downloadUrl } = await client.organizations.createDocumentDownloadUrl(
   *   'org_123',
   *   'doc_456'
   * )
   * window.open(downloadUrl)
   * ```
   */
  async createDocumentDownloadUrl(
    id: string,
    documentId: string,
    versionId?: string
  ): Promise<DocumentDownloadUrl> {
    return this.post<DocumentDownloadUrl>(
      `/v1/organizations/${id}/documents/${documentId}/download-url`,
      { versionId }
    )
  }

  // ===== Settings Management =====

  /**
   * Get organization settings
   *
   * @param id - The organization ID
   * @returns Organization settings
   *
   * @example
   * ```typescript
   * const settings = await client.organizations.getSettings('org_123')
   * console.log(`Timezone: ${settings.timezone}`)
   * console.log(`MFA enforced: ${settings.enforce_mfa}`)
   * ```
   */
  async getSettings(id: string): Promise<OrganizationSettings> {
    return this.get<OrganizationSettings>(`/v1/organizations/${id}/settings`)
  }

  /**
   * Update organization settings
   *
   * @param id - The organization ID
   * @param params - Settings to update
   * @returns Updated settings
   *
   * @example
   * ```typescript
   * const updated = await client.organizations.updateSettings('org_123', {
   *   timezone: 'America/Los_Angeles',
   *   enforceMfa: true,
   *   sessionTimeoutMinutes: 30
   * })
   * ```
   */
  async updateSettings(id: string, params: UpdateSettingsParams): Promise<OrganizationSettings> {
    return this.patch<OrganizationSettings>(`/v1/organizations/${id}/settings`, params)
  }

  // ===== Organization Requests =====

  /**
   * Create a request to add a new organization
   *
   * @param params - Organization request parameters
   * @returns Organization request object with status
   *
   * @example
   * ```typescript
   * const { request } = await client.organizations.createRequest({
   *   name: 'Acme Corporation',
   *   slug: 'acme-corp',
   *   website: 'https://acme.com',
   *   notes: 'B2B SaaS company'
   * })
   * console.log(`Request ${request.id} is ${request.status}`)
   * ```
   */
  async createRequest(params: {
    name: string
    slug: string
    website?: string
    notes?: string
  }): Promise<{
    request: {
      id: string
      name: string
      slug: string
      status: string
      created_at: string
    }
  }> {
    return this.post('/v1/organizations/requests', params)
  }

  // ===== Reminder Settings =====

  /**
   * Get inquiry reminder settings for an organization
   *
   * @param id - The organization ID
   * @returns Reminder settings (enabled flag and days)
   *
   * @example
   * ```typescript
   * const settings = await client.organizations.getReminderSettings('org_123')
   * console.log(`Reminders ${settings.reminderEnabled ? 'enabled' : 'disabled'}`)
   * console.log(`Send after ${settings.reminderDays} days`)
   * ```
   */
  async getReminderSettings(id: string): Promise<{
    reminderEnabled: boolean
    reminderDays: number
  }> {
    return this.get(`/v1/organizations/${id}/reminder-settings`)
  }

  /**
   * Update inquiry reminder settings for an organization
   *
   * @param id - The organization ID
   * @param params - Reminder settings to update
   * @returns Updated reminder settings
   *
   * @example
   * ```typescript
   * const updated = await client.organizations.updateReminderSettings('org_123', {
   *   reminderEnabled: true,
   *   reminderDays: 5
   * })
   * ```
   */
  async updateReminderSettings(
    id: string,
    params: {
      reminderEnabled: boolean
      reminderDays: number
    }
  ): Promise<{
    reminderEnabled: boolean
    reminderDays: number
  }> {
    return this.put(`/v1/organizations/${id}/reminder-settings`, params)
  }

  async getProjectsWithOverrides(id: string): Promise<{
    projects: Array<{
      id: string
      name: string | null
      status: string | null
      location_visibility: string | null
      location_visibility_override: boolean | null
      created_at: string
    }>
  }> {
    return this.get(`/v1/organizations/${id}/projects-with-overrides`)
  }

  async updateLocationVisibility(
    id: string,
    default_project_location_visibility: 'public' | 'authenticated' | 'organization_only' | 'private'
  ): Promise<{ organization: unknown }> {
    return this.patch(`/v1/organizations/${id}/location-visibility`, {
      default_project_location_visibility,
    })
  }

  // ===== Invitation Management =====

  async listInvitations(id: string, statuses?: InviteStatus[]): Promise<OrganizationInvitation[]> {
    const params: Record<string, string> = {}
    if (statuses?.length) params.statuses = statuses.join(',')
    return this.get<OrganizationInvitation[]>(`/v1/organizations/${id}/invitations`, params)
  }

  async resendInvitation(id: string, inviteId: string): Promise<OrganizationInvitation> {
    return this.post<OrganizationInvitation>(`/v1/organizations/${id}/invitations/${inviteId}/resend`, {})
  }

  async cancelInvitation(id: string, inviteId: string): Promise<{ id: string; status: string }> {
    return this.post<{ id: string; status: string }>(`/v1/organizations/${id}/invitations/${inviteId}/cancel`, {})
  }

  async acceptInvitation(token: string, reason?: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/v1/organizations/invitations/accept', { token, reason })
  }

  async declineInvitation(token: string, reason?: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/v1/organizations/invitations/decline', { token, reason })
  }

  // ===== Extended Member Management =====

  async getMemberActivity(id: string, lookbackDays = 30): Promise<MemberActivityEntry[]> {
    return this.get<MemberActivityEntry[]>(`/v1/organizations/${id}/member-activity`, { lookbackDays: String(lookbackDays) })
  }

  async transferOwnership(id: string, newOwnerUserId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/v1/organizations/${id}/transfer-ownership`, { newOwnerUserId })
  }

  // ===== Document Versions =====

  async commitDocumentVersion(
    id: string,
    documentId: string,
    params: CommitDocumentVersionParams
  ): Promise<DocumentVersion> {
    return this.post<DocumentVersion>(`/v1/organizations/${id}/documents/${documentId}/commit-version`, params)
  }

  async listDocumentVersions(id: string, documentId: string): Promise<DocumentVersion[]> {
    return this.get<DocumentVersion[]>(`/v1/organizations/${id}/documents/${documentId}/versions`)
  }

  // ===== Document Shares =====

  async listDocumentShares(id: string, documentId: string): Promise<DocumentShare[]> {
    return this.get<DocumentShare[]>(`/v1/organizations/${id}/documents/${documentId}/shares`)
  }

  async shareDocument(id: string, documentId: string, params: ShareDocumentParams): Promise<DocumentShare> {
    return this.post<DocumentShare>(`/v1/organizations/${id}/documents/${documentId}/shares`, params)
  }

  async updateDocumentShare(
    id: string,
    documentId: string,
    shareId: string,
    params: UpdateDocumentShareParams
  ): Promise<DocumentShare> {
    return this.patch<DocumentShare>(`/v1/organizations/${id}/documents/${documentId}/shares/${shareId}`, params)
  }

  async revokeDocumentShare(id: string, documentId: string, shareId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `/v1/organizations/${id}/documents/${documentId}/shares/${shareId}/revoke`,
      {}
    )
  }

  async searchDocuments(id: string, query: string, limit = 10): Promise<DocumentSearchResult[]> {
    return this.get<DocumentSearchResult[]>(`/v1/organizations/${id}/documents/search`, {
      query,
      limit: String(limit),
    })
  }

  // ===== Folders =====

  async listFolders(id: string): Promise<OrganizationFolder[]> {
    return this.get<OrganizationFolder[]>(`/v1/organizations/${id}/folders`)
  }

  async upsertFolder(id: string, params: FolderUpsertParams): Promise<OrganizationFolder> {
    return this.post<OrganizationFolder>(`/v1/organizations/${id}/folders`, params)
  }

  async deleteFolder(id: string, folderId: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/v1/organizations/${id}/folders/${folderId}`)
  }

  // ===== Locations =====

  async listLocations(id: string, includeInactive = false): Promise<OrganizationLocation[]> {
    return this.get<OrganizationLocation[]>(`/v1/organizations/${id}/locations`, {
      includeInactive: String(includeInactive),
    })
  }

  async upsertLocation(id: string, params: LocationUpsertParams): Promise<OrganizationLocation> {
    return this.post<OrganizationLocation>(`/v1/organizations/${id}/locations`, params)
  }

  async archiveLocation(
    id: string,
    locationId: string,
    isActive: boolean
  ): Promise<{ id: string; is_active: boolean }> {
    return this.patch<{ id: string; is_active: boolean }>(
      `/v1/organizations/${id}/locations/${locationId}/archive`,
      { isActive }
    )
  }

  // ===== Audit Log =====

  async listAuditLog(id: string, params?: AuditLogListParams): Promise<AuditLogListResponse> {
    const queryParams: Record<string, string> = {}
    if (params?.limit) queryParams.limit = String(params.limit)
    if (params?.cursor) queryParams.cursor = params.cursor
    if (params?.actionTypes?.length) queryParams.actionTypes = params.actionTypes.join(',')
    return this.get<AuditLogListResponse>(`/v1/organizations/${id}/audit-log`, queryParams)
  }

  async exportAuditLog(id: string, params?: ExportAuditLogParams): Promise<AuditLogExportResponse> {
    return this.post<AuditLogExportResponse>(`/v1/organizations/${id}/audit-log/export`, params ?? {})
  }

  // ===== Storage =====

  async getStorageUsageSummary(id: string): Promise<StorageUsageSummary> {
    return this.get<StorageUsageSummary>(`/v1/organizations/${id}/storage-usage`)
  }
}
