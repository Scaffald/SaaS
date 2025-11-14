import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Button, Dialog, Label, Separator, Spinner, Text, TextArea, XStack, YStack } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import {
  ArrowRightCircle,
  Check,
  Loader2,
  Pencil,
  RefreshCw,
  X as XIcon,
} from '@tamagui/lucide-icons'
import { DashboardLayout, DashboardWidget, QuickLinksSidebar } from '@app/ui'
import { QuickActionsWidget } from './components/QuickActionsWidget'
import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { OfficePageLayout } from './components/OfficePageLayout'

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

const createColumns = (router: ReturnType<typeof useRouter>) => [
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
  const toast = useToastController()

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
    onError: (error: Error) => {
      toast.show('Unable to review request', {
        message: error.message ?? 'Please try again shortly.',
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
    router.push(`/office/organizations/${org.id}/edit`)
  }
  
  const handleRowDelete = async (org: Organization) => {
    await handleDelete(org.id)
  }
  
  const getItemName = (org: Organization) => org.name

  const refreshRequests = () => {
    void refetchRequests()
  }

  const isProcessingAction = (id: string) =>
    reviewMutation.isLoading && processingId !== null && processingId === id

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
            gap="$4"
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
              Provide a short reason for rejecting <Text fontWeight="600">{rejectDialog.name}</Text>
              . This helps the requester understand what to do next.
            </Dialog.Description>
            <YStack gap="$2">
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
                <Text fontSize="$2" color="$red10">
                  {rejectError}
                </Text>
              ) : null}
            </YStack>
            <XStack gap="$3" justify="flex-end">
              <Dialog.Close asChild>
                <Button variant="outlined" disabled={reviewMutation.isLoading}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                theme="error"
                icon={isProcessingAction(rejectDialog.requestId) ? Loader2 : XIcon}
                disabled={reviewMutation.isLoading}
                onPress={handleRejectConfirm}
              >
                Reject Request
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <DashboardLayout
        leftContent={
          <OfficePageLayout
            title="Organizations"
            searchPlaceholder="Search organizations..."
            searchValue={search}
            onSearchChange={setSearch}
            createButtonLabel="Create Organization"
            onCreateClick={() => router.push(ROUTES.OFFICE_CMS_ORGANIZATIONS_CREATE.path)}
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
          />
        }
        rightContent={
          <QuickLinksSidebar>
            <YStack gap="$4">
              <DashboardWidget gap="$4">
                <XStack justify="space-between" items="center">
                  <Text fontSize="$5" fontWeight="700">
                    Moderation Summary
                  </Text>
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={RefreshCw}
                    disabled={isRequestsLoading || isRequestsRefetching}
                    onPress={refreshRequests}
                  >
                    Refresh
                  </Button>
                </XStack>
                <XStack gap="$4" $sm={{ flexDirection: 'column', gap: '$3' }}>
                  <YStack gap="$1">
                    <Text fontSize="$2" color="$color11">
                      Pending
                    </Text>
                    <Text fontSize="$7" fontWeight="700">
                      {moderationCounts.pending}
                    </Text>
                  </YStack>
                  <YStack gap="$1">
                    <Text fontSize="$2" color="$color11">
                      Approved
                    </Text>
                    <Text fontSize="$7" fontWeight="700" color="$green10">
                      {moderationCounts.approved}
                    </Text>
                  </YStack>
                  <YStack gap="$1">
                    <Text fontSize="$2" color="$color11">
                      Rejected
                    </Text>
                    <Text fontSize="$7" fontWeight="700" color="$red10">
                      {moderationCounts.rejected}
                    </Text>
                  </YStack>
                </XStack>
              </DashboardWidget>

              <DashboardWidget gap="$4">
                <Text fontSize="$5" fontWeight="700">
                  Pending Approvals
                </Text>
                {isRequestsLoading ? (
                  <XStack justify="center" py="$4">
                    <Spinner size="large" />
                  </XStack>
                ) : pendingRequests.length === 0 ? (
                  <Text fontSize="$3" color="$color11">
                    No pending organization requests. Check back soon!
                  </Text>
                ) : (
                  <YStack gap="$4">
                    {pendingRequests.map((request, index) => (
                      <YStack key={request.id} gap="$3">
                        <YStack gap="$1.5">
                          <Text fontSize="$4" fontWeight="600">
                            {request.name}
                          </Text>
                          <Text fontSize="$2" color="$color11">
                            Vanity URL: {request.slug}
                          </Text>
                          {request.website ? (
                            <Text fontSize="$2" color="$blue10">
                              {request.website}
                            </Text>
                          ) : null}
                          <Text fontSize="$2" color="$color11">
                            Submitted {new Date(request.created_at).toLocaleString()}
                          </Text>
                          {request.notes ? (
                            <Text fontSize="$2" color="$color11">
                              {request.notes}
                            </Text>
                          ) : null}
                        </YStack>
                        <XStack gap="$2">
                          <Button
                            size="$2"
                            theme="success"
                            icon={isProcessingAction(request.id) ? Loader2 : Check}
                            disabled={reviewMutation.isLoading}
                            onPress={() => handleApprove(request)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="$2"
                            variant="outlined"
                            theme="error"
                            icon={XIcon}
                            disabled={reviewMutation.isLoading}
                            onPress={() => openRejectDialog(request)}
                          >
                            Reject
                          </Button>
                        </XStack>
                        {index < pendingRequests.length - 1 ? <Separator /> : null}
                      </YStack>
                    ))}
                  </YStack>
                )}
              </DashboardWidget>

              <QuickActionsWidget
                context="list"
                resourceName="Organization"
                onCreate={() => router.push(ROUTES.OFFICE_CMS_ORGANIZATIONS_CREATE.path)}
                onRefresh={refreshRequests}
                isLoading={isRequestsLoading || isRequestsRefetching}
              />
            </YStack>
          </QuickLinksSidebar>
        }
      />
    </>
  )
}
