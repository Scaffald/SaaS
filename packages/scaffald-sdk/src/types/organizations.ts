/**
 * Organization types for the Scaffald SDK
 */

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  visibility: 'public' | 'authenticated' | 'organization_only' | 'private'
  address: Record<string, unknown> | null
  logo_url: string | null
  industry_id: string | null
  industries: {
    id: string
    name: string
    slug: string
  } | null
  owner_user_id: string | null
  default_project_location_visibility:
    | 'public'
    | 'authenticated'
    | 'organization_only'
    | 'private'
    | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  userId: string
  profile: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
    headline: string | null
  } | null
  roles: string[]
  joinedAt: string
}

export interface OrganizationDocument {
  id: string
  name: string
  category:
    | 'contracts'
    | 'templates'
    | 'compliance'
    | 'certifications'
    | 'onboarding'
    | 'general'
    | 'other'
  tags: string[]
  folder_id: string | null
  latest_version_number: number | null
  latest_size_bytes: number | null
  latest_mime_type: string | null
  version_count: number
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  organization_id: string
  timezone: string
  locale: string
  default_currency: string
  business_hours: unknown[]
  holiday_calendar: unknown[]
  notification_preferences: Record<string, unknown>
  security_preferences: Record<string, unknown>
  privacy_preferences: Record<string, unknown>
  enforce_mfa: boolean
  session_timeout_minutes: number
  ip_allow_list: string[]
  storage_warning_thresholds: number[]
}

// Request parameter types

export interface ListMembersParams {
  search?: string
  roleNames?: string[]
}

export interface InviteMemberParams {
  email: string
  roleName?: string
  message?: string
  personalNote?: string
}

export interface RemoveMemberParams {
  reason?: string
}

export interface ListDocumentsParams {
  folderId?: string | null
  search?: string
  category?: OrganizationDocument['category']
  limit?: number
  cursor?: string
}

export interface CreateDocumentUploadParams {
  name: string
  fileName: string
  mimeType: string
  fileSize: number
  folderId?: string | null
  description?: string
  category?: OrganizationDocument['category']
  tags?: string[]
}

export interface DocumentUploadSession {
  documentId: string
  versionId: string
  storagePath: string
  uploadUrl: string
  uploadToken: string
  expiresIn: number
  isNewDocument: boolean
}

export interface DocumentDownloadUrl {
  downloadUrl: string
  expiresIn: number
}

export interface UpdateSettingsParams {
  timezone?: string
  locale?: string
  defaultCurrency?: string
  enforceMfa?: boolean
  sessionTimeoutMinutes?: number
  ipAllowList?: string[]
  notificationPreferences?: Record<string, unknown>
  securityPreferences?: Record<string, unknown>
  privacyPreferences?: Record<string, unknown>
}

// Response types

export interface OpenJobsCountResponse {
  count: number
  organizationId: string
}

export interface MembersListResponse {
  data: OrganizationMember[]
  total: number
}

export interface DocumentsListResponse {
  data: OrganizationDocument[]
  total: number
  cursor?: string
}

export interface InvitationResponse {
  id: string
  token: string
}

// Invitation types

export interface OrganizationInvitation {
  id: string
  invitee_email: string
  role_name: string | null
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'canceled'
  message: string | null
  personal_note: string | null
  viewed_at: string | null
  expires_at: string | null
  created_at: string
  resent_count: number | null
}

export type InviteStatus = OrganizationInvitation['status']

// Member activity

export interface MemberActivityEntry {
  userId: string
  actions: number
  lastActionAt: string
}

// Document version

export interface DocumentVersion {
  id: string
  version_number: number
  size_bytes: number
  mime_type: string
  checksum: string | null
  created_at: string
  uploaded_by: string | null
}

export interface CommitDocumentVersionParams {
  versionId: string
  storagePath: string
  fileName: string
  mimeType: string
  fileSize: number
  checksum?: string
  notes?: string
}

// Document share

export interface DocumentShare {
  id: string
  share_type: 'organization_member' | 'external'
  permission: 'view' | 'edit' | 'manage'
  target_user_id: string | null
  external_email: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

export interface ShareDocumentParams {
  permission?: 'view' | 'edit' | 'manage'
  shareType?: 'organization_member' | 'external'
  targetUserId?: string
  externalEmail?: string
  expiresAt?: string
}

export interface UpdateDocumentShareParams {
  permission?: 'view' | 'edit' | 'manage'
  expiresAt?: string | null
}

// Document search result

export interface DocumentSearchResult {
  id: string
  name: string
  category: OrganizationDocument['category']
  updated_at: string
}

// Folder

export interface OrganizationFolder {
  id: string
  name: string
  description: string | null
  parent_folder_id: string | null
  depth: number
  created_at: string
}

export interface FolderUpsertParams {
  folderId?: string
  name: string
  description?: string
  parentFolderId?: string | null
}

// Location

export interface OrganizationLocation {
  id: string
  name: string
  location_type: 'headquarters' | 'branch' | 'job_site' | 'remote' | 'other'
  address: Record<string, unknown>
  latitude: number | null
  longitude: number | null
  timezone: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface LocationUpsertParams {
  locationId?: string
  name: string
  locationType?: OrganizationLocation['location_type']
  address?: {
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  latitude?: number
  longitude?: number
  timezone?: string
  phone?: string
  email?: string
  isActive?: boolean
}

// Audit log

export interface AuditLogEntry {
  id: string
  action_type: string
  target_type: string | null
  target_id: string | null
  actor_user_id: string | null
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogListParams {
  limit?: number
  cursor?: string
  actionTypes?: string[]
}

export interface AuditLogListResponse {
  items: AuditLogEntry[]
  nextCursor: string | null
}

export interface ExportAuditLogParams {
  format?: 'csv' | 'json'
  since?: string
}

export interface AuditLogExportResponse {
  format: 'csv' | 'json'
  payload: string | AuditLogEntry[]
}

// Storage usage

export interface StorageUsageSummary {
  usageBytes: number
  maxBytes: number
  percentUsed: number
  documentCount: number
  versionCount: number
  warnings: number[]
  maxFileBytes: number
  updatedAt: string
}
