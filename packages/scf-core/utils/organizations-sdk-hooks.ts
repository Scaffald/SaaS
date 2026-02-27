/**
 * Organizations SDK hooks for managing organizations, members, documents, and settings.
 * Use these instead of api.organizations.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  OrganizationSettings,
  ListMembersParams,
  InviteMemberParams,
  RemoveMemberParams,
  ListDocumentsParams,
  CreateDocumentUploadParams,
  DocumentUploadSession,
  DocumentDownloadUrl,
  UpdateSettingsParams,
  InvitationResponse,
  OrganizationInvitation,
  InviteStatus,
  DocumentVersion,
  CommitDocumentVersionParams,
  DocumentShare,
  ShareDocumentParams,
  UpdateDocumentShareParams,
  OrganizationFolder,
  FolderUpsertParams,
  OrganizationLocation,
  LocationUpsertParams,
  AuditLogListParams,
  ExportAuditLogParams,
  AuditLogExportResponse,
  StorageUsageSummary,
} from '@scaffald/sdk'

// ============================================================================
// ORGANIZATION QUERY HOOKS
// ============================================================================

/** Get organization by ID */
export function useOrganization(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'detail', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.retrieve(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/** Get count of open jobs for an organization */
export function useOrganizationOpenJobsCount(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'openJobsCount', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.getOpenJobsCount(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================================================
// MEMBER MANAGEMENT HOOKS
// ============================================================================

/** List organization members */
export function useOrganizationMembers(
  organizationId: string | undefined,
  params?: ListMembersParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'members', organizationId, params],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.listMembers(organizationId, params)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Invite a new member to the organization */
export function useInviteOrganizationMemberMutation(
  options?: UseMutationOptions<
    InvitationResponse,
    Error,
    { organizationId: string; params: InviteMemberParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      params,
    }: {
      organizationId: string
      params: InviteMemberParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.inviteMember(organizationId, params)
    },
    ...options,
  })
}

/** Remove a member from the organization */
export function useRemoveOrganizationMemberMutation(
  options?: UseMutationOptions<
    { removed: boolean },
    Error,
    { organizationId: string; userId: string; params?: RemoveMemberParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      userId,
      params,
    }: {
      organizationId: string
      userId: string
      params?: RemoveMemberParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.removeMember(organizationId, userId, params)
    },
    ...options,
  })
}

// ============================================================================
// DOCUMENT MANAGEMENT HOOKS
// ============================================================================

/** List organization documents */
export function useOrganizationDocuments(
  organizationId: string | undefined,
  params?: ListDocumentsParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'documents', organizationId, params],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.listDocuments(organizationId, params)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get a specific document */
export function useOrganizationDocument(
  organizationId: string | undefined,
  documentId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'documents', organizationId, documentId],
    queryFn: async () => {
      if (!client || !organizationId || !documentId) {
        throw new Error('Missing client, organizationId, or documentId')
      }
      return client.organizations.getDocument(organizationId, documentId)
    },
    enabled: !!client && !!organizationId && !!documentId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/** Create a document upload session */
export function useCreateDocumentUploadSessionMutation(
  options?: UseMutationOptions<
    DocumentUploadSession,
    Error,
    { organizationId: string; params: CreateDocumentUploadParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      params,
    }: {
      organizationId: string
      params: CreateDocumentUploadParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.createDocumentUploadSession(organizationId, params)
    },
    ...options,
  })
}

/** Create a download URL for a document */
export function useCreateDocumentDownloadUrlMutation(
  options?: UseMutationOptions<
    DocumentDownloadUrl,
    Error,
    { organizationId: string; documentId: string; versionId?: string }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      documentId,
      versionId,
    }: {
      organizationId: string
      documentId: string
      versionId?: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.createDocumentDownloadUrl(organizationId, documentId, versionId)
    },
    ...options,
  })
}

// ============================================================================
// SETTINGS MANAGEMENT HOOKS
// ============================================================================

/** Get organization settings */
export function useOrganizationSettings(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'settings', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.getSettings(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/** Update organization settings */
export function useUpdateOrganizationSettingsMutation(
  options?: UseMutationOptions<
    OrganizationSettings,
    Error,
    { organizationId: string; params: UpdateSettingsParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      params,
    }: {
      organizationId: string
      params: UpdateSettingsParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.updateSettings(organizationId, params)
    },
    ...options,
  })
}

// ============================================================================
// ORGANIZATION REQUESTS
// ============================================================================

/** Create a request to add a new organization */
export function useCreateOrganizationRequestMutation(
  options?: UseMutationOptions<
    {
      request: {
        id: string
        name: string
        slug: string
        status: string
        created_at: string
      }
    },
    Error,
    {
      name: string
      slug: string
      website?: string
      notes?: string
    }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: {
      name: string
      slug: string
      website?: string
      notes?: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.createRequest(params)
    },
    ...options,
  })
}

// ============================================================================
// REMINDER SETTINGS
// ============================================================================

/** Get inquiry reminder settings for an organization */
export function useOrganizationReminderSettings(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'reminderSettings', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.getReminderSettings(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/** Update inquiry reminder settings for an organization */
export function useUpdateOrganizationReminderSettingsMutation(
  options?: UseMutationOptions<
    {
      reminderEnabled: boolean
      reminderDays: number
    },
    Error,
    {
      organizationId: string
      reminderEnabled: boolean
      reminderDays: number
    }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      reminderEnabled,
      reminderDays,
    }: {
      organizationId: string
      reminderEnabled: boolean
      reminderDays: number
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.updateReminderSettings(organizationId, {
        reminderEnabled,
        reminderDays,
      })
    },
    ...options,
  })
}

/** Get projects that override the organization's default location visibility */
export function useOrganizationProjectsWithOverrides(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'projectsWithOverrides', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.getProjectsWithOverrides(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

type OrgProjectLocationVisibility = 'public' | 'authenticated' | 'organization_only' | 'private'

/** Update the organization's default project location visibility */
export function useUpdateOrganizationLocationVisibilityMutation(
  options?: UseMutationOptions<
    { organization: unknown },
    Error,
    { organizationId: string; default_project_location_visibility: OrgProjectLocationVisibility }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      default_project_location_visibility,
    }: {
      organizationId: string
      default_project_location_visibility: OrgProjectLocationVisibility
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.updateLocationVisibility(
        organizationId,
        default_project_location_visibility
      )
    },
    ...options,
  })
}

// ============================================================================
// INVITATION HOOKS
// ============================================================================

/** List organization invitations */
export function useOrganizationInvitations(
  organizationId: string | undefined,
  statuses?: InviteStatus[],
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'invitations', organizationId, statuses],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.listInvitations(organizationId, statuses)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Resend an invitation */
export function useResendOrganizationInvitationMutation(
  options?: UseMutationOptions<OrganizationInvitation, Error, { organizationId: string; inviteId: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ organizationId, inviteId }: { organizationId: string; inviteId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.resendInvitation(organizationId, inviteId)
    },
    ...options,
  })
}

/** Cancel an invitation */
export function useCancelOrganizationInvitationMutation(
  options?: UseMutationOptions<{ id: string; status: string }, Error, { organizationId: string; inviteId: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ organizationId, inviteId }: { organizationId: string; inviteId: string }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.cancelInvitation(organizationId, inviteId)
    },
    ...options,
  })
}

/** Accept an invitation by token */
export function useAcceptOrganizationInvitationMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { token: string; reason?: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ token, reason }: { token: string; reason?: string }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.acceptInvitation(token, reason)
    },
    ...options,
  })
}

/** Decline an invitation by token */
export function useDeclineOrganizationInvitationMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { token: string; reason?: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ token, reason }: { token: string; reason?: string }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.declineInvitation(token, reason)
    },
    ...options,
  })
}

// ============================================================================
// MEMBER EXTENDED HOOKS
// ============================================================================

/** Get member activity for the past N days */
export function useOrganizationMemberActivity(
  organizationId: string | undefined,
  lookbackDays = 30,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'memberActivity', organizationId, lookbackDays],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.getMemberActivity(organizationId, lookbackDays)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Transfer organization ownership */
export function useTransferOrganizationOwnershipMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { organizationId: string; newOwnerUserId: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      newOwnerUserId,
    }: {
      organizationId: string
      newOwnerUserId: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.transferOwnership(organizationId, newOwnerUserId)
    },
    ...options,
  })
}

// ============================================================================
// DOCUMENT VERSION & SHARE HOOKS
// ============================================================================

/** Commit an uploaded document version */
export function useCommitDocumentVersionMutation(
  options?: UseMutationOptions<
    DocumentVersion,
    Error,
    { organizationId: string; documentId: string; params: CommitDocumentVersionParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      documentId,
      params,
    }: {
      organizationId: string
      documentId: string
      params: CommitDocumentVersionParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.commitDocumentVersion(organizationId, documentId, params)
    },
    ...options,
  })
}

/** List document versions */
export function useOrganizationDocumentVersions(
  organizationId: string | undefined,
  documentId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'documentVersions', organizationId, documentId],
    queryFn: async () => {
      if (!client || !organizationId || !documentId) {
        throw new Error('Missing client, organizationId, or documentId')
      }
      return client.organizations.listDocumentVersions(organizationId, documentId)
    },
    enabled: !!client && !!organizationId && !!documentId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** List document shares */
export function useOrganizationDocumentShares(
  organizationId: string | undefined,
  documentId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'documentShares', organizationId, documentId],
    queryFn: async () => {
      if (!client || !organizationId || !documentId) {
        throw new Error('Missing client, organizationId, or documentId')
      }
      return client.organizations.listDocumentShares(organizationId, documentId)
    },
    enabled: !!client && !!organizationId && !!documentId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Share a document */
export function useShareDocumentMutation(
  options?: UseMutationOptions<
    DocumentShare,
    Error,
    { organizationId: string; documentId: string; params: ShareDocumentParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      documentId,
      params,
    }: {
      organizationId: string
      documentId: string
      params: ShareDocumentParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.shareDocument(organizationId, documentId, params)
    },
    ...options,
  })
}

/** Update document share */
export function useUpdateDocumentShareMutation(
  options?: UseMutationOptions<
    DocumentShare,
    Error,
    { organizationId: string; documentId: string; shareId: string; params: UpdateDocumentShareParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      documentId,
      shareId,
      params,
    }: {
      organizationId: string
      documentId: string
      shareId: string
      params: UpdateDocumentShareParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.updateDocumentShare(organizationId, documentId, shareId, params)
    },
    ...options,
  })
}

/** Revoke a document share */
export function useRevokeDocumentShareMutation(
  options?: UseMutationOptions<
    { success: boolean },
    Error,
    { organizationId: string; documentId: string; shareId: string }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      documentId,
      shareId,
    }: {
      organizationId: string
      documentId: string
      shareId: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.revokeDocumentShare(organizationId, documentId, shareId)
    },
    ...options,
  })
}

/** Search organization documents */
export function useSearchOrganizationDocuments(
  organizationId: string | undefined,
  query: string,
  options?: { enabled?: boolean; limit?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'documentSearch', organizationId, query],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.searchDocuments(organizationId, query, options?.limit)
    },
    enabled: !!client && !!organizationId && query.length > 0 && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// FOLDER HOOKS
// ============================================================================

/** List organization folders */
export function useOrganizationFolders(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'folders', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.listFolders(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Create or update a folder */
export function useUpsertOrganizationFolderMutation(
  options?: UseMutationOptions<OrganizationFolder, Error, { organizationId: string; params: FolderUpsertParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      params,
    }: {
      organizationId: string
      params: FolderUpsertParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.upsertFolder(organizationId, params)
    },
    ...options,
  })
}

/** Delete a folder */
export function useDeleteOrganizationFolderMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { organizationId: string; folderId: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      folderId,
    }: {
      organizationId: string
      folderId: string
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.deleteFolder(organizationId, folderId)
    },
    ...options,
  })
}

// ============================================================================
// LOCATION HOOKS
// ============================================================================

/** List organization locations */
export function useOrganizationLocations(
  organizationId: string | undefined,
  includeInactive = false,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'locations', organizationId, includeInactive],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.listLocations(organizationId, includeInactive)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Create or update a location */
export function useUpsertOrganizationLocationMutation(
  options?: UseMutationOptions<
    OrganizationLocation,
    Error,
    { organizationId: string; params: LocationUpsertParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      params,
    }: {
      organizationId: string
      params: LocationUpsertParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.upsertLocation(organizationId, params)
    },
    ...options,
  })
}

/** Archive or reactivate a location */
export function useArchiveOrganizationLocationMutation(
  options?: UseMutationOptions<
    { id: string; is_active: boolean },
    Error,
    { organizationId: string; locationId: string; isActive: boolean }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      locationId,
      isActive,
    }: {
      organizationId: string
      locationId: string
      isActive: boolean
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.archiveLocation(organizationId, locationId, isActive)
    },
    ...options,
  })
}

// ============================================================================
// AUDIT LOG HOOKS
// ============================================================================

/** List audit log entries (cursor-paginated) */
export function useOrganizationAuditLog(
  organizationId: string | undefined,
  params?: AuditLogListParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['organizations', 'auditLog', organizationId, params],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.listAuditLog(organizationId, params)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Export audit log as CSV or JSON */
export function useExportOrganizationAuditLogMutation(
  options?: UseMutationOptions<
    AuditLogExportResponse,
    Error,
    { organizationId: string; params?: ExportAuditLogParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      organizationId,
      params,
    }: {
      organizationId: string
      params?: ExportAuditLogParams
    }) => {
      if (!client) throw new Error('Missing client')
      return client.organizations.exportAuditLog(organizationId, params)
    },
    ...options,
  })
}

// ============================================================================
// STORAGE HOOKS
// ============================================================================

/** Get storage usage summary */
export function useOrganizationStorageUsage(
  organizationId: string | undefined,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery<StorageUsageSummary>({
    queryKey: ['organizations', 'storageUsage', organizationId],
    queryFn: async () => {
      if (!client || !organizationId) throw new Error('Missing client or organizationId')
      return client.organizations.getStorageUsageSummary(organizationId)
    },
    enabled: !!client && !!organizationId && options?.enabled !== false,
    staleTime: 60 * 1000,
    refetchInterval: options?.refetchInterval,
  })
}
