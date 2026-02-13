import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { DashboardWidget, Dialog } from '@unicornlove/beyond-ui'
import { Check, Loader2, RefreshCw, X as XIcon } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
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
} from '@unicornlove/beyond-ui'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'

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

  const { data, isLoading, refetch } = api.office.listOrganizations.useQuery({
    limit: 50,
    offset: 0,
  })
  const {
    data: requestData,
    isLoading: isRequestsLoading,
    isRefetching: isRequestsRefetching,
    refetch: refetchRequests,
  } = api.office.listOrganizationRequests.useQuery({
    status: 'pending',
    limit: 25,
  })

  const deleteMutation = api.office.deleteOrganization.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const reviewMutation = api.office.reviewOrganizationRequest.useMutation({
    onSuccess: async () => {
      await Promise.all([refetch(), refetchRequests()])
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Please try again shortly.'
      toast.show({
        title: 'Unable to review request',
        variant: 'error',
      })
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
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
      await reviewMutation.mutateAsync({ id: request.id, action: 'approve' })
      toast.show('Organization approved', {
        message: `${request.name} is now available for office management.`,
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
        action: 'reject',
        rejectionReason: rejectDialog.reason.trim(),
      })
      toast.show('Request rejected', {
        message: `${rejectDialog.name} has been rejected.`,
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

  const organizations = data?.organizations ?? []
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
      <Dialog
        modal
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetRejectDialog()
          } else {
            setRejectDialog((prev) => ({
              ...prev,
              open: true,
            }))
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            key="content"
            bordered
            elevate
            gap={16}
            width={520}
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.92 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          >
            <Dialog.Title>Reject Request</Dialog.Title>
            <Dialog.Description>
              Provide a short reason for rejecting <Text>{rejectDialog.name}</Text>. This helps the
              requester understand what to do next.
            </Dialog.Description>
            <Stack gap={8}>
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
              {rejectError ? <Text color="$red10">{rejectError}</Text> : null}
            </Stack>
            <Row gap={12} justify="flex-end">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={reviewMutation.isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                theme="error"
                iconStart={isProcessingAction(rejectDialog.requestId) ? Loader2 : XIcon}
                disabled={reviewMutation.isPending}
                onPress={handleRejectConfirm}
              >
                Reject Request
              </Button>
            </Row>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

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
                  size="xs"
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
                  <Text color="$gray11">Pending</Text>
                  <Text>{moderationCounts.pending}</Text>
                </Stack>
                <Stack gap={4}>
                  <Text color="$gray11">Approved</Text>
                  <Text color="$green10">{moderationCounts.approved}</Text>
                </Stack>
                <Stack gap={4}>
                  <Text color="$gray11">Rejected</Text>
                  <Text color="$red10">{moderationCounts.rejected}</Text>
                </Stack>
              </Row>
            </DashboardWidget>

            <DashboardWidget gap={16}>
              <Text>Pending Approvals</Text>
              {isRequestsLoading ? (
                <Row justify="center" paddingVertical={16}>
                  <Spinner size="lg" />
                </Row>
              ) : pendingRequests.length === 0 ? (
                <Text color="$gray11">No pending organization requests. Check back soon!</Text>
              ) : (
                <Stack gap={16}>
                  {pendingRequests.map((request, index) => (
                    <Stack key={request.id} gap={12}>
                      <Stack gap={6}>
                        <Text>{request.name}</Text>
                        <Text color="$gray11">Vanity URL: {request.slug}</Text>
                        {request.website ? <Text color="$blue10">{request.website}</Text> : null}
                        <Text color="$gray11">
                          Submitted {new Date(request.created_at).toLocaleString()}
                        </Text>
                        {request.notes ? (
                          <Paragraph color="$gray11">Notes: {request.notes}</Paragraph>
                        ) : null}
                        {request.message ? (
                          <Paragraph color="$gray11">Message: {request.message}</Paragraph>
                        ) : null}
                        {typeof request.resent_count === 'number' && request.resent_count > 0 ? (
                          <Text color="$gray11">Resent {request.resent_count} time(s)</Text>
                        ) : null}
                      </Stack>
                      <Row gap={8}>
                        <Button
                          size="xs"
                          theme="success"
                          iconStart={isProcessingAction(request.id) ? Loader2 : Check}
                          disabled={reviewMutation.isPending}
                          onPress={() => handleApprove(request)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          theme="error"
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
