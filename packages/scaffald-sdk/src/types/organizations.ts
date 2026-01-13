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
