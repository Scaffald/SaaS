import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { useIdVerificationList } from '@scf/core/utils/id-verification-sdk-hooks'
import type { IdVerificationListItem } from '@scf/core/utils/id-verification-sdk-hooks'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import { useDebounce } from '@scf/core/utils/useDebounce'
import type { AppRouter } from '@scf/supabase/client-types'
import { RefreshCcw } from 'lucide-react-native'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@scaffald/ui'
import {
  Button,
  MetricBlock,
  MetricRow,
  ScreenHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'
import { StatusBadge } from '@scf/core/components/ui/StatusBadge'

type RouterOutputs = inferRouterOutputs<AppRouter>
type OrganizationOption = RouterOutputs['office']['getOrganizations']['organizations'][number]
type StatusFilter = 'all' | 'active' | 'expired' | 'revoked'

// Themed StatusBadge tones rather than fixed 100/700 ramps, which stayed
// light boxes on the dark ground.
const STATUS_META: Record<
  Exclude<StatusFilter, 'all'>,
  { label: string; variant: 'success' | 'warning' | 'error' }
> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'error' },
}

const SOURCE_LABEL: Record<'worker' | 'organization' | 'platform', string> = {
  worker: 'Worker self-serve',
  organization: 'Organization',
  platform: 'Platform initiated',
}

interface IdVerificationAdminPageProps {
  selectedOrganizationId: string | null
  onOrganizationChange: (organizationId: string | null) => void
}

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100)
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
]

export function IdVerificationAdminPage({
  selectedOrganizationId,
  onOrganizationChange,
}: IdVerificationAdminPageProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchValue, setSearchValue] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 400)

  const { data: organizationsData, isLoading: isLoadingOrganizations } = useAllOrganizations()
  const organizations = useMemo<OrganizationOption[]>(
    () => (organizationsData?.organizations ?? []) as OrganizationOption[],
    [organizationsData?.organizations]
  )

  useEffect(() => {
    if (!selectedOrganizationId && organizations.length === 1) {
      onOrganizationChange(organizations[0].id as string)
    }
  }, [organizations, selectedOrganizationId, onOrganizationChange])

  const listQuery = useIdVerificationList(
    {
      limit: 200,
      offset: 0,
      status: statusFilter,
      organizationId: selectedOrganizationId ?? undefined,
      search: debouncedSearch || undefined,
    },
    { enabled: true }
  )

  const summary = listQuery.data?.summary ?? {
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0,
  }
  // Until the list has actually loaded, a count is unknown, not zero: a failed
  // load used to read "Active badges 0 … Total verifications 0" (#1021).
  const count = (n: number): number | string => (listQuery.data ? n : '—')

  const columns = useMemo<ColumnDef<IdVerificationListItem, unknown>[]>(() => {
    return [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) => (
          <Stack>
            <Text style={{ color: colors.text[t].secondary }}>{row.original.workerName}</Text>
            {row.original.workerEmail ? (
              <Text style={{ color: colors.text[t].secondary }}>{row.original.workerEmail}</Text>
            ) : null}
          </Stack>
        ),
        meta: { width: '$20' },
      },
      {
        accessorKey: 'badgeStatus',
        header: 'Badge status',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) => {
          const badgeKey = row.original.badgeStatus as Exclude<StatusFilter, 'all'>
          const meta = STATUS_META[badgeKey]
          if (!meta) {
            return (
              <Text style={{ color: colors.text[t].secondary }}>{row.original.badgeStatus}</Text>
            )
          }
          return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>
        },
      },
      {
        accessorKey: 'verificationLevel',
        header: 'Level',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) =>
          row.original.verificationLevel ?? '—',
      },
      {
        accessorKey: 'verifiedAt',
        header: 'Verified',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) =>
          formatDate(row.original.verifiedAt),
      },
      {
        accessorKey: 'badgeExpiresAt',
        header: 'Expires',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) =>
          formatDate(row.original.badgeExpiresAt),
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) =>
          row.original.organizationName ?? '—',
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) => {
          const sourceKey = (row.original.source ?? 'worker') as keyof typeof SOURCE_LABEL
          return <StatusBadge>{SOURCE_LABEL[sourceKey] ?? sourceKey}</StatusBadge>
        },
      },
      {
        accessorKey: 'personaStatus',
        header: 'Persona status',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) =>
          row.original.personaStatus ?? '—',
      },
      {
        accessorKey: 'priceCents',
        header: 'Amount',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) =>
          formatCurrency(row.original.priceCents ?? 0),
      },
    ]
  }, [t])

  const handleOrganizationChange = (value: string) => {
    if (value === '__all__') {
      onOrganizationChange(null)
    } else {
      onOrganizationChange(value)
    }
  }

  const selectedOrganizationName = selectedOrganizationId
    ? ((organizations.find((org) => org.id === selectedOrganizationId)?.name as
        | string
        | undefined) ?? 'Selected organization')
    : undefined

  const organizationFilter = (
    <Stack gap={6} style={{ minWidth: 240 }}>
      <Text
        style={{
          fontSize: fontSize.xxs,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: colors.text[t].tertiary,
        }}
      >
        Organization
      </Text>
      <ResponsiveSelect
        value={selectedOrganizationId ?? '__all__'}
        onValueChange={handleOrganizationChange}
        placeholder={selectedOrganizationName ?? 'All organizations'}
        options={[
          { value: '__all__', label: 'All organizations' },
          ...organizations.map((org) => ({
            value: org.id as string,
            label: (org.name as string) ?? 'Untitled org',
          })),
        ]}
      />
      {isLoadingOrganizations ? (
        <Row gap={8} align="center">
          <Spinner variant="ios" size="sm" />
          <Text style={{ color: colors.text[t].secondary }}>Loading organizations…</Text>
        </Row>
      ) : null}
    </Stack>
  )

  return (
    <Stack flex={1} gap={16}>
      <Stack gap={12}>
        {/* Title first, then the figures. The header used to come after the
            stats and the filters, and the four 200px-minimum cards stacked
            one per row at 390, pushing the list below the fold (#1126).
            MetricRow wraps whole columns: 2x2 on a phone, 4-up on desktop. */}
        <ScreenHeader
          kicker="Screening"
          title="ID verifications"
          actions={
            <Button
              size="sm"
              variant="outline"
              iconStart={RefreshCcw}
              onPress={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              Refresh
            </Button>
          }
        />

        <MetricRow bordered minColumnWidth={140}>
          <MetricBlock label="Active badges" value={count(summary.active)} />
          <MetricBlock label="Expired badges" value={count(summary.expired)} />
          <MetricBlock label="Revoked badges" value={count(summary.revoked)} />
          <MetricBlock label="Total verifications" value={count(summary.total)} />
        </MetricRow>
      </Stack>

      {/* One toolbar row (#1209): badge status as the toolbar's folder tabs,
          then search, the organization select inside Filters & sort, and the
          count. It stacked a "Badge status filter" label, a bordered pill
          around underline tabs and a full-width organization select above
          the search. */}
      <OfficePageLayout
        toolbarTabs={STATUS_TABS.map((tab) => ({ key: tab.value, label: tab.label }))}
        activeToolbarTab={statusFilter}
        onToolbarTabChange={(key) => setStatusFilter(key as StatusFilter)}
        filterContent={organizationFilter}
        activeFilterCount={selectedOrganizationId ? 1 : 0}
        filterChips={
          selectedOrganizationId
            ? [
                {
                  id: 'organization',
                  label: 'Organization',
                  value: selectedOrganizationName,
                  active: true,
                  onPress: () => setFiltersOpen(true),
                  onClear: () => onOrganizationChange(null),
                },
              ]
            : undefined
        }
        onClearFilters={selectedOrganizationId ? () => onOrganizationChange(null) : undefined}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        resultNoun="verification"
        title="ID Verifications"
        searchPlaceholder="Search worker, organization, or status"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        createButtonLabel="New verification"
        onCreateClick={() => undefined}
        hideCreateButton
        hideHeader
        columns={columns}
        data={listQuery.data?.items ?? []}
        isLoading={listQuery.isLoading}
        emptyMessage={
          listQuery.isLoading
            ? 'Loading ID verifications…'
            : 'No ID verifications found for this filter.'
        }
        loadError={
          listQuery.isError
            ? {
                error: listQuery.error,
                retry: () => listQuery.refetch(),
                title: 'Couldn’t load ID verifications',
              }
            : undefined
        }
        itemType="verification"
        pageSize={25}
      />
    </Stack>
  )
}
