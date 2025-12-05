import { api } from '@scf/core/utils/api'

export const useOrganizationInvites = (
  organizationId: string,
  statuses?: Array<'pending' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'canceled'>
) => {
  return api.organizations.listInvitations.useQuery(
    { organizationId, statuses },
    { enabled: Boolean(organizationId) }
  )
}

export const useInviteOrganizationMember = () => api.organizations.inviteMember.useMutation()

export const useResendOrganizationInvite = () => api.organizations.resendInvitation.useMutation()

export const useCancelOrganizationInvite = () => api.organizations.cancelInvitation.useMutation()

export const useAcceptOrganizationInvite = () => api.organizations.acceptInvitation.useMutation()

export const useDeclineOrganizationInvite = () => api.organizations.declineInvitation.useMutation()

export const useOrganizationMembers = (organizationId: string, search?: string) =>
  api.organizations.listMembers.useQuery(
    { organizationId, search },
    { enabled: Boolean(organizationId) }
  )

export const useOrganizationMemberActivity = (organizationId: string, lookbackDays = 30) =>
  api.organizations.getMemberActivity.useQuery(
    { organizationId, lookbackDays },
    { enabled: Boolean(organizationId) }
  )

export const useRemoveOrganizationMember = () => api.organizations.removeMember.useMutation()

export const useTransferOrganizationOwnership = () =>
  api.organizations.transferOwnership.useMutation()

export const useOrganizationDocuments = (
  organizationId: string,
  params?: { folderId?: string | null; search?: string }
) =>
  api.organizations.listDocuments.useQuery(
    {
      organizationId,
      folderId: params?.folderId,
      search: params?.search,
    },
    { enabled: Boolean(organizationId) }
  )

export const useDocumentUploadSession = () =>
  api.organizations.createDocumentUploadSession.useMutation()

export const useCommitDocumentVersion = () => api.organizations.commitDocumentVersion.useMutation()

export const useDocumentVersions = (organizationId: string, documentId: string) =>
  api.organizations.listDocumentVersions.useQuery(
    { organizationId, documentId },
    { enabled: Boolean(organizationId && documentId) }
  )

export const useDocumentDownloadUrl = () =>
  api.organizations.createDocumentDownloadUrl.useMutation()

export const useDocumentShares = (organizationId: string, documentId: string) =>
  api.organizations.listDocumentShares.useQuery(
    { organizationId, documentId },
    { enabled: Boolean(organizationId && documentId) }
  )

export const useShareDocument = () => api.organizations.shareDocument.useMutation()

export const useUpdateDocumentShare = () => api.organizations.updateDocumentShare.useMutation()

export const useRevokeDocumentShare = () => api.organizations.revokeDocumentShare.useMutation()

export const useOrganizationFolders = (organizationId: string) =>
  api.organizations.listFolders.useQuery({ organizationId }, { enabled: Boolean(organizationId) })

export const useUpsertOrganizationFolder = () => api.organizations.upsertFolder.useMutation()

export const useDeleteOrganizationFolder = () => api.organizations.deleteFolder.useMutation()

export const useSearchOrganizationDocuments = (organizationId: string, query: string) =>
  api.organizations.searchDocuments.useQuery(
    { organizationId, query },
    { enabled: Boolean(organizationId) && query.length > 0 }
  )

export const useOrganizationLocations = (organizationId: string, includeInactive = false) =>
  api.organizations.listLocations.useQuery(
    { organizationId, includeInactive },
    { enabled: Boolean(organizationId) }
  )

export const useUpsertOrganizationLocation = () => api.organizations.upsertLocation.useMutation()

export const useArchiveOrganizationLocation = () => api.organizations.archiveLocation.useMutation()

export const useOrganizationSettings = (organizationId: string) =>
  api.organizations.getSettings.useQuery({ organizationId }, { enabled: Boolean(organizationId) })

export const useUpdateOrganizationSettings = () => api.organizations.updateSettings.useMutation()

export const useOrganizationAuditLog = (
  organizationId: string,
  params?: { cursor?: string; actionTypes?: string[]; limit?: number }
) =>
  api.organizations.listAuditLog.useQuery(
    {
      organizationId,
      cursor: params?.cursor,
      actionTypes: params?.actionTypes,
      limit: params?.limit,
    },
    { enabled: Boolean(organizationId) }
  )

export const useExportOrganizationAuditLog = () => api.organizations.exportAuditLog.useMutation()

export const useOrganizationStorageUsage = (organizationId: string) =>
  api.organizations.getStorageUsageSummary.useQuery(
    { organizationId },
    { enabled: Boolean(organizationId), refetchInterval: 60_000 }
  )
