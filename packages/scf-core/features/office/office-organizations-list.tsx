import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useOfficeOrganizationsList,
  useOfficeOrganizationRequests,
  useReviewOrganizationRequestMutation,
} from '@scf/core/utils/office-organizations-sdk-hooks'
import {
  DashboardWidget,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  useThemeContext,
} from '@scaffald/ui'
import { Check, Loader2, RefreshCw, X as XIcon } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Button, Label, Paragraph, Separator, Text, TextArea, Row, Stack } from '@scaffald/ui'
import { OfficePageLayout } from './components/OfficePageLayout'
import { CellText, type CmsRowAction } from './components/CmsCells'
import { formatCellDate } from './cms-format'
import { colors, fontWeight } from '@scaffald/ui/tokens'

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
    cell: (info) => <CellText strong>{info.getValue()}</CellText>,
    meta: {
      width: '32%',
    },
  }),
  columnHelper.accessor('industry_name', {
    header: 'Industry',
    cell: (info) => <CellText>{info.getValue()}</CellText>,
  }),
  columnHelper.accessor('visibility', {
    header: 'Visibility',
    cell: (info) => {
      const visibility = info.getValue()
      return <CellText>{visibility.charAt(0).toUpperCase() + visibility.slice(1)}</CellText>
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => <CellText tabular>{formatCellDate(info.getValue())}</CellText>,
  }),
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

  const { data, isLoading, error, refetch } = useOfficeOrganizationsList({ limit: 50, offset: 0 })
  const {
    data: requestData,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    isRefetching: isRequestsRefetching,
    refetch: refetchRequests,
  } = useOfficeOrganizationRequests({ status: 'pending', limit: 25 })

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

  const rowActions = (org: Organization): CmsRowAction[] => [
    { label: 'Edit', onPress: () => handleRowEdit(org) },
  ]

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
              <Text style={{ color: theme === 'light' ? colors.error[700] : colors.error[300] }}>
                {rejectError}
              </Text>
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
        resultNoun="organization"
        wrapWithOfficeLayout
        kicker="Content management"
        title="Organizations"
        tip="Employers on Scaffald. Requests to add a new company wait for approval here."
        searchPlaceholder="Search organizations…"
        searchValue={search}
        onSearchChange={setSearch}
        createButtonLabel="Create organization"
        onCreateClick={() => router.push(ROUTES.OFFICE.CMS.ORGANIZATIONS.CREATE.path)}
        columns={columns as ColumnDef<Organization, unknown>[]}
        data={filteredOrganizations}
        isLoading={isLoading}
        loadError={
          error
            ? { error, retry: () => void refetch(), title: 'Couldn’t load organizations' }
            : undefined
        }
        pageSize={50}
        emptyMessage="No organizations found"
        onRowEdit={handleRowEdit}
        rowActions={rowActions}
        getItemName={getItemName}
        itemType="organization"
        // The moderation queue sits under the header, full width, and only
        // when there is something in it. It was a right rail — "Moderation
        // Summary" with three counts and a Refresh, then "Pending Approvals"
        // — which squeezed the table to ~900px and pushed Create into the
        // left column beside the title, unlike every other CMS list (#1205,
        // #1099).
        headerContent={
          isRequestsLoading ? null : isRequestsError ? (
            // Not "no requests": the 500 behind #1017 said "Check back
            // soon!" while real requests waited unreviewed (#1021).
            <DashboardWidget gap={8}>
              <Text style={{ color: theme === 'light' ? colors.error[700] : colors.error[300] }}>
                Couldn’t load pending requests — there may be some waiting.
              </Text>
              <Row>
                <Button size="sm" variant="outline" onPress={() => refetchRequests()}>
                  Retry
                </Button>
              </Row>
            </DashboardWidget>
          ) : pendingRequests.length > 0 ? (
            <DashboardWidget gap={16}>
              <Row justify="space-between" align="center" gap={12} wrap>
                <Stack gap={2}>
                  <Text style={{ fontWeight: fontWeight.semibold }}>
                    {pendingRequests.length === 1
                      ? '1 organization waiting for approval'
                      : `${pendingRequests.length} organizations waiting for approval`}
                  </Text>
                  <Text style={{ color: colors.text[theme].secondary }}>
                    {moderationCounts.approved} approved · {moderationCounts.rejected} rejected so
                    far
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  variant="outline"
                  iconStart={RefreshCw}
                  disabled={isRequestsRefetching}
                  onPress={refreshRequests}
                >
                  Refresh
                </Button>
              </Row>
              <Stack gap={16}>
                {pendingRequests.map((request, index) => (
                  <Stack key={request.id} gap={12}>
                    <Stack gap={6}>
                      <Text>{request.name}</Text>
                      <Text style={{ color: colors.text[theme].secondary }}>
                        Vanity URL: {request.slug}
                      </Text>
                      {request.website ? (
                        <Text style={{ color: colors.text[theme].emphasis }}>
                          {request.website}
                        </Text>
                      ) : null}
                      <Text style={{ color: colors.text[theme].secondary }}>
                        Submitted {new Date(request.created_at).toLocaleString()}
                      </Text>
                      {request.notes ? (
                        <Paragraph style={{ color: colors.text[theme].secondary }}>
                          Notes: {request.notes}
                        </Paragraph>
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
            </DashboardWidget>
          ) : null
        }
      />
    </>
  )
}
