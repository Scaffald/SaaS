import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useOfficeOrganizationsList,
  useOfficeOrganizationRequests,
  useDeleteOfficeOrganizationMutation,
  useReviewOrganizationRequestMutation,
} from '@scf/core/utils/office-organizations-sdk-hooks'
import { DashboardWidget, Modal, ModalHeader, ModalContent, ModalActions, useThemeContext } from '@scaffald/ui'
import { Check, Loader2, RefreshCw, X as XIcon } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Button,
  Label,
  Paragraph,
  Separator,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
} from '@scaffald/ui'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'
import { colors } from '@scaffald/ui/tokens'

type Organization = {
  id: string
  name: string
  slug: string
  industry_id: string | null
  industry_name: string | null
  logo_url: string | null
  visibility: string
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

type OrganizationRequestRow = {
  id: string
  name: string
  slug: string
  website: string | null
  notes: string | null
  message?: string | null
  personal_note?: string | null
  viewed_at?: string | null
  resent_count?: number | null
  status: 'pending' | 'approved' | 'rejected'
  metadata: Record<string, unknown>
  created_at: string
  created_by_user_id: string
  reviewed_at: string | null
  reviewed_by_user_id: string | null
  rejection_reason: string | null
  organization_id: string | null
}

const columnHelper = createColumnHelper<Organization>()

const createColumns = (_router: ReturnType<typeof useRouter>) => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
    meta: {
      width: '$25',
    },
  }),
  columnHelper.accessor('industry_name', {
    header: 'Industry',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('visibility', {
    header: 'Visibility',
    cell: (info) => {
      const visibility = info.getValue()
      return visibility.charAt(0).toUpperCase() + visibility.slice(1)
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  // Actions column removed - using RowActionOverlay instead
]

export function OfficeOrganizationsList() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    requestId: string
    name: string
    reason: string
  }>({
    open: false,
    requestId: '',
    name: '',
    reason: '',
  })
  const [rejectError, setRejectError] = useState<string | null>(null)
  const toast = useToast()

  const { data, isLoading, refetch } = useOfficeOrganizationsList({ limit: 50, offset: 0 })
  const {
    data: requestData,
    isLoading: isRequestsLoading,
    isRefetching: isRequestsRefetching,
    refetch: refetchRequests,
  } = useOfficeOrganizationRequests({ status: 'pending', limit: 25 })

  const deleteMutation = useDeleteOfficeOrganizationMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const reviewMutation = useReviewOrganizationRequestMutation({
    onSuccess: async () => {
      await Promise.all([refetch(), refetchRequests()])
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Please try again shortly.'
      toast.show({
        title: 'Unable to review request',
        message: 'Please try again shortly.',
        variant: 'error',
      })
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  const resetRejectDialog = () => {
    setRejectDialog({
      open: false,
      requestId: '',
      name: '',
      reason: '',
    })
    setRejectError(null)
  }

  const handleApprove = async (request: OrganizationRequestRow) => {
    setProcessingId(request.id)
    try {
      await reviewMutation.mutateAsync({ id: request.id, params: { action: 'approve' } })
      toast.show({
        title: 'Organization approved',
        message: `${request.name} is now available for office management.`,
        variant: 'success',
      })
    } catch (error) {
      // onError handler already surfaces toast feedback
      console.error('Failed to approve organization request', error)
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (request: OrganizationRequestRow) => {
    setRejectDialog({
      open: true,
      requestId: request.id,
      name: request.name,
      reason: '',
    })
    setRejectError(null)
  }

  const handleRejectConfirm = async () => {
    if (!rejectDialog.requestId) {
      return
    }

    if (!rejectDialog.reason.trim()) {
      setRejectError('Please provide a brief reason for the rejection.')
      return
    }

    setRejectError(null)
    setProcessingId(rejectDialog.requestId)

    try {
      await reviewMutation.mutateAsync({
        id: rejectDialog.requestId,
        params: { action: 'reject', rejectionReason: rejectDialog.reason.trim() },
      })
      toast.show({
        title: 'Request rejected',
        message: `${rejectDialog.name} has been rejected.`,
        variant: 'success',
      })
      resetRejectDialog()
    } catch (error) {
      console.error('Failed to reject organization request', error)
    } finally {
      setProcessingId(null)
    }
  }

  const pendingRequests = (requestData?.requests as OrganizationRequestRow[]) ?? []
  const moderationCounts = requestData?.counts ?? { pending: 0, approved: 0, rejected: 0 }

  const organizations = (data?.organizations ?? []) as unknown as Organization[]
  const filteredOrganizations = organizations.filter(
    (org: Organization) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  )

  const columns = createColumns(router)

  const handleRowEdit = (org: Organization) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.ORGANIZATIONS.EDIT, { id: org.id }))
  }

  const handleRowDelete = async (org: Organization) => {
    await handleDelete(org.id)
  }

  const getItemName = (org: Organization) => org.name

  const refreshRequests = () => {
    void refetchRequests()
  }

  const isProcessingAction = (id: string) =>
    reviewMutation.isPending && processingId !== null && processingId === id

  return (
    <>
      <Modal visible={rejectDialog.open} onClose={resetRejectDialog}>
        <ModalHeader title="Reject Request" onClose={resetRejectDialog} />
        <ModalContent>
          <Stack gap={8}>
            <Text>
              Provide a short reason for rejecting <Text>{rejectDialog.name}</Text>. This helps the
              requester understand what to do next.
            </Text>
            <Label htmlFor="organization-reject-reason">Rejection Reason</Label>
            <TextArea
              id="organization-reject-reason"
              value={rejectDialog.reason}
              onChangeText={(value) => {
                setRejectDialog((prev) => ({
                  ...prev,
                  reason: value,
                }))
                if (rejectError) {
                  setRejectError(null)
                }
              }}
              placeholder="Share why this request cannot be approved right now..."
              style={{ minHeight: 120 }}
              autoFocus
            />
            {rejectError ? (
              <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{rejectError}</Text>
            ) : null}
          </Stack>
        </ModalContent>
        <ModalActions
          primaryAction={{
            label: 'Reject Request',
            onPress: handleRejectConfirm,
            color: 'error',
            disabled: reviewMutation.isPending,
            loading: isProcessingAction(rejectDialog.requestId),
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: resetRejectDialog,
            disabled: reviewMutation.isPending,
          }}
        />
      </Modal>

      <OfficePageLayout
        wrapWithOfficeLayout
        showBreadcrumb
        title="Organizations"
        searchPlaceholder="Search organizations..."
        searchValue={search}
        onSearchChange={setSearch}
        createButtonLabel="Create Organization"
        onCreateClick={() => router.push(ROUTES.OFFICE.CMS.ORGANIZATIONS.CREATE.path)}
        columns={columns as ColumnDef<Organization, unknown>[]}
        data={filteredOrganizations}
        isLoading={isLoading}
        pageSize={50}
        emptyMessage="No organizations found"
        hideCreateButton
        onRowEdit={handleRowEdit}
        onRowDelete={handleRowDelete}
        getItemName={getItemName}
        itemType="organization"
        rightContent={
          <Stack gap={16}>
            <DashboardWidget gap={16}>
              <Row justify="space-between" align="center">
                <Text>Moderation Summary</Text>
                <Button
                  size="sm"
                  variant="outline"
                  iconStart={RefreshCw}
                  disabled={isRequestsLoading || isRequestsRefetching}
                  onPress={refreshRequests}
                >
                  Refresh
                </Button>
              </Row>
              <Row gap={16}>
                <Stack gap={4}>
                  <Text style={{ color: colors.text[theme].secondary }}>Pending</Text>
                  <Text>{moderationCounts.pending}</Text>
                </Stack>
                <Stack gap={4}>
                  <Text style={{ color: colors.text[theme].secondary }}>Approved</Text>
                  <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }}>
                    {moderationCounts.approved}
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text style={{ color: colors.text[theme].secondary }}>Rejected</Text>
                  <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                    {moderationCounts.rejected}
                  </Text>
                </Stack>
              </Row>
            </DashboardWidget>

            <DashboardWidget gap={16}>
              <Text>Pending Approvals</Text>
              {isRequestsLoading ? (
                <Row justify="center" paddingVertical={16}>
                  <Spinner variant="ios" size="lg" />
                </Row>
              ) : pendingRequests.length === 0 ? (
                <Text style={{ color: colors.text[theme].secondary }}>
                  No pending organization requests. Check back soon!
                </Text>
              ) : (
                <Stack gap={16}>
                  {pendingRequests.map((request, index) => (
                    <Stack key={request.id} gap={12}>
                      <Stack gap={6}>
                        <Text>{request.name}</Text>
                        <Text style={{ color: colors.text[theme].secondary }}>
                          Vanity URL: {request.slug}
                        </Text>
                        {request.website ? (
                          <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>{request.website}</Text>
                        ) : null}
                        <Text style={{ color: colors.text[theme].secondary }}>
                          Submitted {new Date(request.created_at).toLocaleString()}
                        </Text>
                        {request.notes ? (
                          <Paragraph style={{ color: colors.text[theme].secondary }}>
                            Notes: {request.notes}
                          </Paragraph>
                        ) : null}
                        {request.message ? (
                          <Paragraph style={{ color: colors.text[theme].secondary }}>
                            Message: {request.message}
                          </Paragraph>
                        ) : null}
                        {typeof request.resent_count === 'number' && request.resent_count > 0 ? (
                          <Text style={{ color: colors.text[theme].secondary }}>
                            Resent {request.resent_count} time(s)
                          </Text>
                        ) : null}
                      </Stack>
                      <Row gap={8}>
                        <Button
                          size="sm"
                          color="success"
                          iconStart={isProcessingAction(request.id) ? Loader2 : Check}
                          disabled={reviewMutation.isPending}
                          onPress={() => handleApprove(request)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          color="error"
                          iconStart={XIcon}
                          disabled={reviewMutation.isPending}
                          onPress={() => openRejectDialog(request)}
                        >
                          Reject
                        </Button>
                      </Row>
                      {index < pendingRequests.length - 1 ? <Separator /> : null}
                    </Stack>
                  ))}
                </Stack>
              )}
            </DashboardWidget>

            <QuickActionsWidget
              context="list"
              resourceName="Organization"
              onCreate={() => router.push(ROUTES.OFFICE.CMS.ORGANIZATIONS.CREATE.path)}
              onRefresh={refreshRequests}
              isLoading={isRequestsLoading || isRequestsRefetching}
            />
          </Stack>
        }
      />
    </>
  )
}
