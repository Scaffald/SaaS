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
  Card,
  type GetThemeValueForKey,
  Spinner,
  Tabs,
  Text,
  Row,
  Stack,
} from '@scaffald/ui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type OrganizationOption = RouterOutputs['office']['getOrganizations']['organizations'][number]
type StatusFilter = 'all' | 'active' | 'expired' | 'revoked'

const STATUS_META: Record<
  Exclude<StatusFilter, 'all'>,
  {
    label: string
    color: GetThemeValueForKey<'color'>
    backgroundColor: GetThemeValueForKey<'backgroundColor'>
  }
> = {
  active: { label: 'Active', color: '$green11', backgroundColor: '$green4' },
  expired: { label: 'Expired', color: '$orange11', backgroundColor: '$orange4' },
  revoked: { label: 'Revoked', color: '$red11', backgroundColor: '$red4' },
}

const SOURCE_META: Record<
  'worker' | 'organization' | 'platform',
  {
    label: string
    color: GetThemeValueForKey<'color'>
    backgroundColor: GetThemeValueForKey<'backgroundColor'>
  }
> = {
  worker: { label: 'Worker self-serve', color: '$color11', backgroundColor: '$color4' },
  organization: { label: 'Organization', color: '$blue11', backgroundColor: '$blue4' },
  platform: { label: 'Platform initiated', color: '$purple11', backgroundColor: '$purple4' },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchValue, setSearchValue] = useState('')
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

  const columns = useMemo<ColumnDef<IdVerificationListItem, unknown>[]>(() => {
    return [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }: CellContext<IdVerificationListItem, unknown>) => (
          <Stack>
            <Text color="$gray11">{row.original.workerName}</Text>
            {row.original.workerEmail ? (
              <Text color="$gray11">{row.original.workerEmail}</Text>
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
            return <Text color="$gray11">{row.original.badgeStatus}</Text>
          }
          return (
            <Text
              color={meta.color}
              backgroundColor={meta.backgroundColor}
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={12}
            >
              {meta.label}
            </Text>
          )
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
          const sourceKey = (row.original.source ?? 'worker') as keyof typeof SOURCE_META
          const meta = SOURCE_META[sourceKey]
          return (
            <Text
              color={meta.color}
              backgroundColor={meta.backgroundColor}
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={12}
            >
              {meta.label}
            </Text>
          )
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
  }, [])

  const handleOrganizationChange = (value: string) => {
    if (value === '__all__') {
      onOrganizationChange(null)
    } else {
      onOrganizationChange(value)
    }
  }

  return (
    <Stack flex={1} gap={16}>
      <Stack paddingHorizontal={16} gap={12}>
        <Row gap={12} wrap>
          {[
            {
              label: 'Active badges',
              value: summary.active,
              color: '$green12' as GetThemeValueForKey<'color'>,
            },
            {
              label: 'Expired badges',
              value: summary.expired,
              color: '$orange12' as GetThemeValueForKey<'color'>,
            },
            {
              label: 'Revoked badges',
              value: summary.revoked,
              color: '$red12' as GetThemeValueForKey<'color'>,
            },
            {
              label: 'Total verifications',
              value: summary.total,
              color: '$color12' as GetThemeValueForKey<'color'>,
            },
          ].map((item) => (
            <Card
              key={item.label}
              flex={1}
              minWidth={200}
              padding="sm"
              borderColor="$borderColor"
              borderWidth={1}
            >
              <Text color="$gray11">{item.label}</Text>
              <Text color={item.color}>{item.value}</Text>
            </Card>
          ))}
        </Row>

        <Stack gap={8}>
          <Text color="$gray11">Badge status filter</Text>
          <Row
            backgroundColor="$color2"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
            overflow="hidden"
          >
            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              {STATUS_TABS.map((tab) => (
                <Tabs.Item key={tab.value} value={tab.value}>
                  <Tabs.Trigger flex={1}>{tab.label}</Tabs.Trigger>
                </Tabs.Item>
              ))}
            </Tabs>
          </Row>
        </Stack>

        <Stack gap={8}>
          <Text color="$gray11">Organization</Text>
          <ResponsiveSelect
            value={selectedOrganizationId ?? '__all__'}
            onValueChange={handleOrganizationChange}
            placeholder={
              selectedOrganizationId
                ? (organizations.find((org) => org.id === selectedOrganizationId)?.name ??
                  'Select organization')
                : 'All organizations'
            }
            label="Organization"
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
              <Spinner size="sm" />
              <Text color="$gray11">Loading organizations…</Text>
            </Row>
          ) : null}
        </Stack>

        <Row justify="flex-end">
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCcw}
            onPress={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            Refresh
          </Button>
        </Row>
      </Stack>

      <OfficePageLayout
        title="ID Verifications"
        searchPlaceholder="Search worker, organization, or status"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        createButtonLabel="New verification"
        onCreateClick={() => undefined}
        hideCreateButton
        columns={columns}
        data={listQuery.data?.items ?? []}
        isLoading={listQuery.isLoading}
        emptyMessage={
          listQuery.isLoading
            ? 'Loading ID verifications…'
            : 'No ID verifications found for this filter.'
        }
        itemType="verification"
        pageSize={25}
      />
    </Stack>
  )
}
