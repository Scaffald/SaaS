import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button, Card, Select, Spinner, Tabs, Text, XStack, YStack } from 'tamagui'
import { AlertTriangle, Check, ChevronDown, ClipboardList, RefreshCcw } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'

import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { useUserRoles } from '@app/core/utils/auth/useUserRoles'
import type { AppRouter } from '@app/supabase/client-types'
import { OfficePageLayout } from '@app/core/features/office/components/OfficePageLayout'

import {
  BACKGROUND_CHECK_STATUSES,
  getStatusMetadata,
  type BackgroundCheckStatus,
} from '../components/status.utils'
import { AdminCheckReviewDialog } from './AdminCheckReviewDialog'
import { AdminDisputeResolutionDialog } from './AdminDisputeResolutionDialog'
import { AdminMetricsPanel } from './AdminMetricsPanel'
import { AdminAuditLogPanel } from './AdminAuditLogPanel'
import { AdminCatalogManager } from './AdminCatalogManager'

type RouterOutputs = inferRouterOutputs<AppRouter>

type AdminCheckSummary = RouterOutputs['backgroundChecks']['adminListChecks'][number]
type AdminDisputeSummary = RouterOutputs['backgroundChecks']['adminListDisputes'][number]

type AdminTab = 'checks' | 'disputes' | 'metrics' | 'audit' | 'catalog'

interface CheckRow {
  id: string
  workerName: string
  workerEmail: string | null
  organizationName: string | null
  status: BackgroundCheckStatus
  statusLabel: string
  packageName: string
  completedAt: string | null
  expiresAt: string | null
  invitedAt: string | null
  raw: AdminCheckSummary
}

interface DisputeRow {
  id: string
  workerName: string
  workerEmail: string | null
  organizationName: string | null
  status: string
  filedAt: string | null
  raw: AdminDisputeSummary
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const deriveWorkerName = (record: {
  display_name?: string | null
  username?: string | null
  id?: string | null
}) => {
  if (record.display_name?.trim()) return record.display_name.trim()
  if (record.username?.trim()) return record.username.trim()
  if (record.id) return `User ${record.id.slice(0, 8)}`
  return 'Worker'
}

const STATUS_FILTERS: Array<{ value: 'all' | BackgroundCheckStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...BACKGROUND_CHECK_STATUSES.map((status) => ({
    value: status,
    label: getStatusMetadata(status).label,
  })),
]

export function AdminBackgroundChecksPage() {
  const router = useRouter()
  const { hasRole, isLoading: isLoadingRoles } = useUserRoles()
  const isAdmin = hasRole('background_check_admin')
  const [activeTab, setActiveTab] = useState<AdminTab>('checks')
  const [statusFilter, setStatusFilter] = useState<'all' | BackgroundCheckStatus>('under_review')
  const [searchQuery, setSearchQuery] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [selectedCheck, setSelectedCheck] = useState<AdminCheckSummary | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeSummary | null>(null)

  const checksQuery = api.backgroundChecks.adminListChecks.useQuery(
    {
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      enabled: isAdmin,
    }
  )

  const disputesQuery = api.backgroundChecks.adminListDisputes.useQuery(undefined, {
    enabled: isAdmin && activeTab === 'disputes',
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })

  const metricsQuery = api.backgroundChecks.adminGetMetrics.useQuery(undefined, {
    enabled: isAdmin && activeTab === 'metrics',
    staleTime: 60_000,
  })

  const accessLogQuery = api.backgroundChecks.adminGetAccessLog.useQuery(
    { limit: 200 },
    {
      enabled: isAdmin && activeTab === 'audit',
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    }
  )

  const checkRows = useMemo<CheckRow[]>(() => {
    return (checksQuery.data ?? []).map((check: AdminCheckSummary) => {
      const worker = check.worker ?? {}
      const organization = check.organization ?? {}
      const statusMeta = getStatusMetadata(check.status as BackgroundCheckStatus)
      return {
        id: check.id,
        workerName: deriveWorkerName(worker),
        workerEmail: worker.email ?? null,
        organizationName: organization.name ?? null,
        status: check.status as BackgroundCheckStatus,
        statusLabel: statusMeta.label,
        packageName: check.package?.display_name ?? check.package?.slug ?? 'Unknown package',
        completedAt: check.completed_at ?? null,
        expiresAt: check.expires_at ?? null,
        invitedAt: check.invited_at ?? null,
        raw: check,
      }
    })
  }, [checksQuery.data])

  const filteredCheckRows = useMemo(() => {
    if (!searchQuery.trim()) return checkRows
    const query = searchQuery.trim().toLowerCase()
    return checkRows.filter((row) => {
      return (
        row.workerName.toLowerCase().includes(query) ||
        (row.workerEmail ?? '').toLowerCase().includes(query) ||
        (row.organizationName ?? '').toLowerCase().includes(query) ||
        row.statusLabel.toLowerCase().includes(query) ||
        row.packageName.toLowerCase().includes(query)
      )
    })
  }, [checkRows, searchQuery])

  const disputeRows = useMemo<DisputeRow[]>(() => {
    return (disputesQuery.data ?? []).map((dispute: AdminDisputeSummary) => {
      const worker = dispute.background_check?.worker ?? {}
      const organization = dispute.background_check?.organization ?? {}
      return {
        id: dispute.id,
        workerName: deriveWorkerName(worker),
        workerEmail: worker.email ?? null,
        organizationName: organization?.name ?? null,
        status: dispute.status,
        filedAt: dispute.created_at ?? null,
        raw: dispute,
      }
    })
  }, [disputesQuery.data])

  const filteredDisputeRows = useMemo(() => {
    if (!searchQuery.trim()) return disputeRows
    const query = searchQuery.trim().toLowerCase()
    return disputeRows.filter((row) => {
      return (
        row.workerName.toLowerCase().includes(query) ||
        (row.workerEmail ?? '').toLowerCase().includes(query) ||
        (row.organizationName ?? '').toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)
      )
    })
  }, [disputeRows, searchQuery])

  const checkColumns: ColumnDef<CheckRow>[] = useMemo(
    () => [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }) => (
          <YStack>
            <Text fontSize="$3" fontWeight="600" color="$color12">
              {row.original.workerName}
            </Text>
            {row.original.workerEmail ? (
              <Text fontSize="$2" color="$color10">
                {row.original.workerEmail}
              </Text>
            ) : null}
          </YStack>
        ),
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization',
        cell: ({ row }) => row.original.organizationName ?? '—',
      },
      {
        accessorKey: 'packageName',
        header: 'Package',
        cell: ({ row }) => row.original.packageName,
      },
      {
        accessorKey: 'statusLabel',
        header: 'Status',
        cell: ({ row }) => row.original.statusLabel,
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ row }) => formatDateTime(row.original.completedAt),
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expires',
        cell: ({ row }) => formatDateTime(row.original.expiresAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="$2"
            variant="outlined"
            icon={ClipboardList}
            onPress={() => setSelectedCheck(row.original.raw)}
          >
            Review
          </Button>
        ),
      },
    ],
    [setSelectedCheck]
  )

  const disputeColumns: ColumnDef<DisputeRow>[] = useMemo(
    () => [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }) => (
          <YStack>
            <Text fontSize="$3" fontWeight="600" color="$color12">
              {row.original.workerName}
            </Text>
            {row.original.workerEmail ? (
              <Text fontSize="$2" color="$color10">
                {row.original.workerEmail}
              </Text>
            ) : null}
          </YStack>
        ),
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization',
        cell: ({ row }) => row.original.organizationName ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status,
      },
      {
        accessorKey: 'filedAt',
        header: 'Filed',
        cell: ({ row }) => formatDateTime(row.original.filedAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="$2"
            variant="outlined"
            icon={AlertTriangle}
            onPress={() => setSelectedDispute(row.original.raw)}
          >
            Resolve
          </Button>
        ),
      },
    ],
    [setSelectedDispute]
  )

  const summaryStats = useMemo(() => {
    const total = checksQuery.data?.length ?? 0
    const underReview =
      checksQuery.data?.filter((check: AdminCheckSummary) => check.status === 'under_review') ?? []
    const pendingDisputes =
      disputesQuery.data?.filter(
        (dispute: AdminDisputeSummary) =>
          dispute.status === 'pending' || dispute.status === 'under_review'
      ) ?? []
    return {
      total,
      underReview: underReview.length,
      pendingDisputes: pendingDisputes.length,
    }
  }, [checksQuery.data, disputesQuery.data])

  if (isLoadingRoles) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$2">
        <Spinner size="large" />
        <Text fontSize="$3" color="$color11">
          Verifying admin access…
        </Text>
      </YStack>
    )
  }

  if (!isAdmin) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$3" px="$4">
        <Text fontSize="$6" fontWeight="700" color="$color12">
          Admin access required
        </Text>
        <Text fontSize="$3" color="$color10" style={{ textAlign: 'center' }}>
          Background check review tools are restricted to compliance administrators. Contact an
          administrator if you believe this is an error.
        </Text>
        <Button
          size="$3"
          variant="outlined"
          onPress={() => router.push(ROUTES.OFFICE_ATS_CHECKS.path)}
        >
          Go to organization background checks
        </Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} bg="$background">
      <YStack p="$4" gap="$4">
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Background check administration
          </Text>
          <Text fontSize="$3" color="$color10">
            Review in-progress screenings, resolve disputes, and keep results compliant.
          </Text>
        </YStack>

        <XStack gap="$3" flexWrap="wrap">
          <Card
            p="$3"
            bg="$color2"
            borderWidth={1}
            borderColor="$borderColor"
            flexGrow={1}
            style={{ flexBasis: 160 }}
          >
            <Text fontSize="$2" color="$color10">
              Active reviews
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$color12">
              {summaryStats.underReview}
            </Text>
          </Card>
          <Card
            p="$3"
            bg="$color2"
            borderWidth={1}
            borderColor="$borderColor"
            flexGrow={1}
            style={{ flexBasis: 160 }}
          >
            <Text fontSize="$2" color="$color10">
              Pending disputes
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$color12">
              {summaryStats.pendingDisputes}
            </Text>
          </Card>
          <Card
            p="$3"
            bg="$color2"
            borderWidth={1}
            borderColor="$borderColor"
            flexGrow={1}
            style={{ flexBasis: 160 }}
          >
            <Text fontSize="$2" color="$color10">
              Total checks in view
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$color12">
              {summaryStats.total}
            </Text>
          </Card>
        </XStack>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AdminTab)}
          activationMode="manual"
        >
          <Tabs.List
            orientation="horizontal"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            bg="$background"
            scrollable
          >
            <XStack gap="$3" px="$2">
              <Tabs.Tab
                value="checks"
                borderBottomWidth={activeTab === 'checks' ? 2 : 0}
                borderBottomColor="$blue10"
                px="$3"
                py="$2"
              >
                Checks
              </Tabs.Tab>
              <Tabs.Tab
                value="disputes"
                borderBottomWidth={activeTab === 'disputes' ? 2 : 0}
                borderBottomColor="$blue10"
                px="$3"
                py="$2"
              >
                Disputes
              </Tabs.Tab>
              <Tabs.Tab
                value="metrics"
                borderBottomWidth={activeTab === 'metrics' ? 2 : 0}
                borderBottomColor="$blue10"
                px="$3"
                py="$2"
              >
                Metrics
              </Tabs.Tab>
              <Tabs.Tab
                value="catalog"
                borderBottomWidth={activeTab === 'catalog' ? 2 : 0}
                borderBottomColor="$blue10"
                px="$3"
                py="$2"
              >
                Catalog
              </Tabs.Tab>
              <Tabs.Tab
                value="audit"
                borderBottomWidth={activeTab === 'audit' ? 2 : 0}
                borderBottomColor="$blue10"
                px="$3"
                py="$2"
              >
                Audit Log
              </Tabs.Tab>
            </XStack>
          </Tabs.List>
        </Tabs>

        {activeTab === 'checks' ? (
          <XStack gap="$3" flexWrap="wrap" justify="space-between" items="center">
            <XStack gap="$2" items="center">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | BackgroundCheckStatus)}
                disablePreventBodyScroll
              >
                <Select.Trigger iconAfter={ChevronDown}>
                  <Select.Value
                    placeholder="Filter by status"
                    aria-label="Filter background checks by status"
                  />
                </Select.Trigger>
                <Select.Content zIndex={200_000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Label>Status filters</Select.Label>
                      {STATUS_FILTERS.map((option, index) => (
                        <Select.Item key={option.value} value={option.value} index={index}>
                          <Select.ItemText>{option.label}</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              <Button
                size="$3"
                variant="outlined"
                icon={RefreshCcw}
                onPress={() => checksQuery.refetch()}
                disabled={checksQuery.isLoading}
              >
                Refresh
              </Button>
            </XStack>
            <Button
              size="$3"
              variant="outlined"
              onPress={() => router.push(ROUTES.OFFICE_ATS_CHECKS.path)}
            >
              Organization view
            </Button>
          </XStack>
        ) : null}

        {activeTab === 'disputes' ? (
          <XStack gap="$2">
            <Button
              size="$3"
              variant="outlined"
              icon={RefreshCcw}
              onPress={() => disputesQuery.refetch()}
              disabled={disputesQuery.isLoading}
            >
              Refresh disputes
            </Button>
          </XStack>
        ) : null}
      </YStack>

      {activeTab === 'checks' ? (
        <OfficePageLayout
          title="Screenings under review"
          searchPlaceholder="Search by worker, organization, or package"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          createButtonLabel="Request background check"
          onCreateClick={() => router.push('/office/background-checks/request')}
          hideCreateButton
          data={filteredCheckRows}
          columns={checkColumns}
          isLoading={checksQuery.isLoading}
          emptyMessage={
            checksQuery.isLoading
              ? 'Loading background checks…'
              : 'No background checks found for this filter.'
          }
          onRowClick={(row) => setSelectedCheck(row.raw)}
        />
      ) : null}

      {activeTab === 'disputes' ? (
        <OfficePageLayout
          title="Dispute management"
          searchPlaceholder="Search disputes…"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          createButtonLabel="Resolve dispute"
          onCreateClick={() => setActiveTab('disputes')}
          hideCreateButton
          data={filteredDisputeRows}
          columns={disputeColumns}
          isLoading={disputesQuery.isLoading}
          emptyMessage={
            disputesQuery.isLoading
              ? 'Loading disputes…'
              : 'No disputes require attention right now.'
          }
          onRowClick={(row) => setSelectedDispute(row.raw)}
        />
      ) : null}

      {activeTab === 'metrics' ? (
        <YStack px="$4" pb="$4">
          <AdminMetricsPanel
            metrics={metricsQuery.data}
            isLoading={metricsQuery.isLoading}
            onRefresh={() => void metricsQuery.refetch()}
          />
        </YStack>
      ) : null}

      {activeTab === 'catalog' ? (
        <YStack px="$4" pb="$4">
          <AdminCatalogManager />
        </YStack>
      ) : null}

      {activeTab === 'audit' ? (
        <AdminAuditLogPanel
          entries={accessLogQuery.data ?? []}
          isLoading={accessLogQuery.isLoading}
          searchValue={auditSearch}
          onSearchChange={setAuditSearch}
          onRefresh={() => void accessLogQuery.refetch()}
        />
      ) : null}

      <AdminCheckReviewDialog
        open={Boolean(selectedCheck)}
        check={selectedCheck}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCheck(null)
          }
        }}
        onUpdated={() => setSelectedCheck(null)}
      />

      <AdminDisputeResolutionDialog
        open={Boolean(selectedDispute)}
        dispute={selectedDispute}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDispute(null)
          }
        }}
        onResolved={() => setSelectedDispute(null)}
      />
    </YStack>
  )
}
