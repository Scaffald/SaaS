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
} from '@scaffald/sdk/types/organizations'

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
