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
}
