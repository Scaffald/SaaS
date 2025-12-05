import { ROUTES } from '@scf/core/constants/routes'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { api } from '@scf/core/utils/api'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import type { AppRouter } from '@scf/supabase/client-types'
import { ExternalLink, Eye, RefreshCcw } from '@tamagui/lucide-icons'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Button, Label, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

import { getStatusMetadata } from '../components/status.utils'
import { OrganizationCheckDetails } from './OrganizationCheckDetails'

type RouterOutputs = inferRouterOutputs<AppRouter>
type OrganizationCheckSummary = RouterOutputs['backgroundChecks']['organizationListChecks'][number]
type OrganizationOption = RouterOutputs['office']['getOrganizations']['organizations'][number]

type CheckRow = {
  id: string
  workerId: string
  workerName: string
  workerEmail: string | null
  status: string
  statusLabel: string
  packageName: string
  createdAt: string | null
  invitedAt: string | null
  completedAt: string | null
  expiresAt: string | null
  jobTitle: string
  raw: OrganizationCheckSummary
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const deriveWorkerName = (check: OrganizationCheckSummary) => {
  const displayName = check.worker?.display_name?.trim()
  if (displayName) return displayName
  const username = check.worker?.username?.trim()
  if (username) return username
  if (check.worker_user_id) {
    return `User ${check.worker_user_id.slice(0, 8)}`
  }
  return 'Unknown worker'
}

const mapCheckToRow = (check: OrganizationCheckSummary): CheckRow => {
  const statusMeta = getStatusMetadata(check.status)
  return {
    id: check.id,
    workerId: check.worker_user_id,
    workerName: deriveWorkerName(check),
    workerEmail: check.worker?.email ?? null,
    status: check.status,
    statusLabel: statusMeta.label,
    packageName: check.package?.display_name ?? check.package?.slug ?? 'Unknown package',
    createdAt: check.created_at ?? null,
    invitedAt: check.invited_at ?? null,
    completedAt: check.completed_at ?? null,
    expiresAt: check.expires_at ?? null,
    jobTitle: check.job?.title ?? '—',
    raw: check,
  }
}

export function OrganizationBackgroundChecksPage() {
  const router = useRouter()
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null)

  const { data: organizationsData, isLoading: isLoadingOrganizations } = useAllOrganizations()
  const organizations = useMemo<OrganizationOption[]>(
    () => (organizationsData?.organizations ?? []) as OrganizationOption[],
    [organizationsData?.organizations]
  )

  useEffect(() => {
    if (!selectedOrganizationId && organizations.length === 1) {
      setSelectedOrganizationId(organizations[0].id as string)
    }
  }, [organizations, selectedOrganizationId])

  const checksQuery = api.backgroundChecks.organizationListChecks.useQuery(
    { organization_id: selectedOrganizationId ?? '' },
    {
      enabled: Boolean(selectedOrganizationId),
      refetchOnWindowFocus: true,
      staleTime: 60_000,
    }
  )

  const rows = useMemo(() => {
    if (!checksQuery.data) return []
    return checksQuery.data.map(mapCheckToRow)
  }, [checksQuery.data])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return rows
    }

    const query = searchQuery.trim().toLowerCase()
    return rows.filter((row: CheckRow) => {
      return (
        row.workerName.toLowerCase().includes(query) ||
        row.packageName.toLowerCase().includes(query) ||
        row.statusLabel.toLowerCase().includes(query) ||
        (row.workerEmail ?? '').toLowerCase().includes(query) ||
        row.jobTitle.toLowerCase().includes(query)
      )
    })
  }, [rows, searchQuery])

  const handleNavigateToRequest = () => {
    if (!selectedOrganizationId) return
    router.push({
      pathname: ROUTES.OFFICE.ATS.CHECKS.REQUEST.path,
      params: { organizationId: selectedOrganizationId },
    })
  }

  const columns = useMemo<ColumnDef<CheckRow, unknown>[]>(
    () =>
      [
        {
          accessorKey: 'workerName',
          header: 'Worker',
          cell: ({ row }: CellContext<CheckRow, unknown>) => (
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
          meta: {
            width: '$20',
          },
        },
        {
          accessorKey: 'packageName',
          header: 'Package',
          cell: ({ row }: CellContext<CheckRow, unknown>) => row.original.packageName,
        },
        {
          accessorKey: 'statusLabel',
          header: 'Status',
          cell: ({ row }: CellContext<CheckRow, unknown>) => row.original.statusLabel,
        },
        {
          accessorKey: 'createdAt',
          header: 'Requested',
          cell: ({ row }: CellContext<CheckRow, unknown>) => formatDateTime(row.original.createdAt),
        },
        {
          accessorKey: 'completedAt',
          header: 'Completed',
          cell: ({ row }: CellContext<CheckRow, unknown>) =>
            formatDateTime(row.original.completedAt),
        },
        {
          accessorKey: 'expiresAt',
          header: 'Expires',
          cell: ({ row }: CellContext<CheckRow, unknown>) => formatDateTime(row.original.expiresAt),
        },
        {
          accessorKey: 'jobTitle',
          header: 'Job Link',
          cell: ({ row }: CellContext<CheckRow, unknown>) => row.original.jobTitle,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }: CellContext<CheckRow, unknown>) => (
            <Button
              size="$2"
              variant="outlined"
              icon={Eye}
              onPress={() => setSelectedCheckId(row.original.id)}
            >
              View
            </Button>
          ),
        },
      ] satisfies ColumnDef<CheckRow, unknown>[],
    []
  )

  if (isLoadingOrganizations) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$2">
        <Spinner size="large" />
        <Text fontSize="$3" color="$color11">
          Loading organizations…
        </Text>
      </YStack>
    )
  }

  if (!organizations.length) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" paddingHorizontal="$4">
        <Text fontSize="$6" fontWeight="700" color="$color12">
          No organizations available
        </Text>
        <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
          Create an organization before managing background checks.
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1}>
      <YStack padding="$4" gap="$3">
        <YStack gap="$2">
          <Label htmlFor="office-background-checks-organization">Organization</Label>
          <ResponsiveSelect
            value={selectedOrganizationId ?? ''}
            onValueChange={(value) => {
              setSelectedOrganizationId(value)
              setSelectedCheckId(null)
            }}
            placeholder={
              selectedOrganizationId
                ? (organizations.find((org) => org.id === selectedOrganizationId)?.name ??
                  'Select organization')
                : 'Select organization'
            }
            label="Organization"
            options={organizations.map((org) => ({
              value: org.id as string,
              label: (org.name as string) ?? 'Untitled organization',
            }))}
          />
        </YStack>

        <XStack gap="$2" justifyContent="flex-end">
          <Button
            size="$3"
            variant="outlined"
            icon={RefreshCcw}
            onPress={() => checksQuery.refetch()}
            disabled={checksQuery.isLoading}
          >
            Refresh
          </Button>
          <Button
            size="$3"
            theme="blue"
            icon={ExternalLink}
            onPress={handleNavigateToRequest}
            disabled={!selectedOrganizationId}
          >
            Request Check
          </Button>
        </XStack>
      </YStack>

      {selectedOrganizationId ? (
        <OfficePageLayout
          title="Background Checks"
          searchPlaceholder="Filter results..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          createButtonLabel="Request Background Check"
          onCreateClick={handleNavigateToRequest}
          hideCreateButton
          columns={columns}
          data={filteredRows}
          isLoading={checksQuery.isLoading}
          emptyMessage={
            checksQuery.isLoading
              ? 'Loading background checks…'
              : 'No background checks found for this organization yet.'
          }
          onRowView={(row: CheckRow) => setSelectedCheckId(row.id)}
        />
      ) : (
        <YStack flex={1} padding="$4" gap="$3" alignItems="center" justifyContent="center">
          <Text fontSize="$5" fontWeight="700" color="$color12">
            Select an organization to view background checks
          </Text>
          <Text fontSize="$3" color="$color11">
            Choose an organization above to manage screening requests and results.
          </Text>
        </YStack>
      )}

      {selectedCheckId ? (
        <YStack paddingHorizontal="$4" paddingBottom="$6" gap="$3">
          <OrganizationCheckDetails
            checkId={selectedCheckId}
            summary={rows.find((row: CheckRow) => row.id === selectedCheckId)?.raw}
            onClose={() => setSelectedCheckId(null)}
          />
        </YStack>
      ) : null}
    </YStack>
  )
}
