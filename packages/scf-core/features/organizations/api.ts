import { api } from '@scf/core/utils/api'
import {
  useInviteOrganizationMemberMutation,
  useOrganizationMembers as useOrgMembersSdk,
  useRemoveOrganizationMemberMutation,
  useOrganizationDocuments as useOrgDocumentsSdk,
  useCreateDocumentUploadSessionMutation,
  useCreateDocumentDownloadUrlMutation,
  useOrganizationSettings as useOrgSettingsSdk,
  useUpdateOrganizationSettingsMutation,
  useOrganizationInvitations,
  useResendOrganizationInvitationMutation,
  useCancelOrganizationInvitationMutation,
  useAcceptOrganizationInvitationMutation,
  useDeclineOrganizationInvitationMutation,
  useOrganizationMemberActivity as useOrgMemberActivitySdk,
  useTransferOrganizationOwnershipMutation,
  useCommitDocumentVersionMutation,
  useOrganizationDocumentVersions,
  useOrganizationDocumentShares,
  useShareDocumentMutation,
  useUpdateDocumentShareMutation,
  useRevokeDocumentShareMutation,
  useOrganizationFolders as useOrgFoldersSdk,
  useUpsertOrganizationFolderMutation,
  useDeleteOrganizationFolderMutation,
  useSearchOrganizationDocuments as useSearchOrgDocumentsSdk,
  useOrganizationLocations as useOrgLocationsSdk,
  useUpsertOrganizationLocationMutation,
  useArchiveOrganizationLocationMutation,
  useOrganizationAuditLog as useOrgAuditLogSdk,
  useExportOrganizationAuditLogMutation,
  useOrganizationStorageUsage as useOrgStorageUsageSdk,
} from '@scf/core/utils/organizations-sdk-hooks'

import type { InviteStatus } from '@scaffald/sdk'

export const useOrganizationInvites = (
  organizationId: string,
  statuses?: Array<InviteStatus>
) => {
  return useOrganizationInvitations(organizationId || undefined, statuses, {
    enabled: Boolean(organizationId),
  })
}

export const useInviteOrganizationMember = () => useInviteOrganizationMemberMutation()

export const useResendOrganizationInvite = () => useResendOrganizationInvitationMutation()

export const useCancelOrganizationInvite = () => useCancelOrganizationInvitationMutation()

export const useAcceptOrganizationInvite = () => useAcceptOrganizationInvitationMutation()

export const useDeclineOrganizationInvite = () => useDeclineOrganizationInvitationMutation()

export const useOrganizationMembers = (organizationId: string, search?: string) =>
  useOrgMembersSdk(organizationId || undefined, { search }, { enabled: Boolean(organizationId) })

export const useOrganizationMemberActivity = (organizationId: string, lookbackDays = 30) =>
  useOrgMemberActivitySdk(organizationId || undefined, lookbackDays, {
    enabled: Boolean(organizationId),
  })

export const useRemoveOrganizationMember = () => useRemoveOrganizationMemberMutation()

export const useTransferOrganizationOwnership = () => useTransferOrganizationOwnershipMutation()

export const useOrganizationDocuments = (
  organizationId: string,
  params?: { folderId?: string | null; search?: string }
) => useOrgDocumentsSdk(organizationId || undefined, params, { enabled: Boolean(organizationId) })

export const useDocumentUploadSession = () => useCreateDocumentUploadSessionMutation()

export const useCommitDocumentVersion = () => useCommitDocumentVersionMutation()

export const useDocumentVersions = (organizationId: string, documentId: string) =>
  useOrganizationDocumentVersions(organizationId || undefined, documentId || undefined, {
    enabled: Boolean(organizationId && documentId),
  })

export const useDocumentDownloadUrl = () => useCreateDocumentDownloadUrlMutation()

export const useDocumentShares = (organizationId: string, documentId: string) =>
  useOrganizationDocumentShares(organizationId || undefined, documentId || undefined, {
    enabled: Boolean(organizationId && documentId),
  })

export const useShareDocument = () => useShareDocumentMutation()

export const useUpdateDocumentShare = () => useUpdateDocumentShareMutation()

export const useRevokeDocumentShare = () => useRevokeDocumentShareMutation()

export const useOrganizationFolders = (organizationId: string) =>
  useOrgFoldersSdk(organizationId || undefined, { enabled: Boolean(organizationId) })

export const useUpsertOrganizationFolder = () => useUpsertOrganizationFolderMutation()

export const useDeleteOrganizationFolder = () => useDeleteOrganizationFolderMutation()

export const useSearchOrganizationDocuments = (organizationId: string, query: string) =>
  useSearchOrgDocumentsSdk(organizationId || undefined, query, {
    enabled: Boolean(organizationId) && query.length > 0,
  })

export const useOrganizationLocations = (organizationId: string, includeInactive = false) =>
  useOrgLocationsSdk(organizationId || undefined, includeInactive, {
    enabled: Boolean(organizationId),
  })

export const useUpsertOrganizationLocation = () => useUpsertOrganizationLocationMutation()

export const useArchiveOrganizationLocation = () => useArchiveOrganizationLocationMutation()

export const useOrganizationSettings = (organizationId: string) =>
  useOrgSettingsSdk(organizationId || undefined, { enabled: Boolean(organizationId) })

export const useUpdateOrganizationSettings = () => useUpdateOrganizationSettingsMutation()

export const useOrganizationAuditLog = (
  organizationId: string,
  params?: { cursor?: string; actionTypes?: string[]; limit?: number }
) =>
  useOrgAuditLogSdk(
    organizationId || undefined,
    { cursor: params?.cursor, actionTypes: params?.actionTypes, limit: params?.limit },
    { enabled: Boolean(organizationId) }
  )

export const useExportOrganizationAuditLog = () => useExportOrganizationAuditLogMutation()

export const useOrganizationStorageUsage = (organizationId: string) =>
  useOrgStorageUsageSdk(organizationId || undefined, {
    enabled: Boolean(organizationId),
    refetchInterval: 60_000,
  })

export const useRenewalSettings = (organizationId: string) => {
  // biome-ignore lint/suspicious/noExplicitAny: api.organizations unavailable in Node.js typecheck (Deno functions excluded)
  return (api as unknown as Record<string, any>).organizations.getRenewalSettings.useQuery(
    { organizationId },
    { enabled: Boolean(organizationId) }
  ) as import('@tanstack/react-query').UseQueryResult<{ enabled: boolean; intervals: number[] }>
}

export const useUpdateRenewalSettings = () => {
  // biome-ignore lint/suspicious/noExplicitAny: api.organizations unavailable in Node.js typecheck (Deno functions excluded)
  return (api as unknown as Record<string, any>).organizations.updateRenewalSettings.useMutation() as import('@tanstack/react-query').UseMutationResult<
    { enabled: boolean; intervals: number[] },
    Error,
    { organizationId: string; enabled?: boolean; intervals?: number[] }
  >
}
