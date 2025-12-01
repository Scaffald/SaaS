import { OfficePageLayout } from '@app/core/features/office/components/OfficePageLayout'
import { api } from '@app/core/utils/api'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import { useDebounce } from '@app/core/utils/useDebounce'
import type { AppRouter } from '@app/supabase/client-types'
import { RefreshCcw } from '@tamagui/lucide-icons'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/ui'
import {
  Button,
  Card,
  type GetThemeValueForKey,
  Spinner,
  Tabs,
  Text,
  XStack,
  YStack,
} from 'tamagui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type VerificationListResponse = RouterOutputs['idVerification']['listVerifications']
type VerificationItem = VerificationListResponse['items'][number]
type OrganizationOption = RouterOutputs['office']['getOrganizations']['organizations'][number]
type StatusFilter = 'all' | 'active' | 'expired' | 'revoked'

const STATUS_META: Record<
  Exclude<StatusFilter, 'all'>,
  {
    label: string
    color: GetThemeValueForKey<'color'>
    bg: GetThemeValueForKey<'backgroundColor'>
  }
> = {
  active: { label: 'Active', color: '$green11', bg: '$green4' },
  expired: { label: 'Expired', color: '$orange11', bg: '$orange4' },
  revoked: { label: 'Revoked', color: '$red11', bg: '$red4' },
}

const SOURCE_META: Record<
  'worker' | 'organization' | 'platform',
  {
    label: string
    color: GetThemeValueForKey<'color'>
    bg: GetThemeValueForKey<'backgroundColor'>
  }
> = {
  worker: { label: 'Worker self-serve', color: '$color11', bg: '$color4' },
  organization: { label: 'Organization', color: '$blue11', bg: '$blue4' },
  platform: { label: 'Platform initiated', color: '$purple11', bg: '$purple4' },
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

  const listQuery = api.idVerification.listVerifications.useQuery(
    {
      limit: 200,
      offset: 0,
      status: statusFilter,
      organizationId: selectedOrganizationId ?? undefined,
      search: debouncedSearch || undefined,
    },
    { placeholderData: (previousData) => previousData, staleTime: 30_000 }
  )

  const summary = listQuery.data?.summary ?? {
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0,
  }

  const columns = useMemo<ColumnDef<VerificationItem, unknown>[]>(() => {
    return [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }: CellContext<VerificationItem, unknown>) => (
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
        meta: { width: '$20' },
      },
      {
        accessorKey: 'badgeStatus',
        header: 'Badge status',
        cell: ({ row }: CellContext<VerificationItem, unknown>) => {
          const badgeKey = row.original.badgeStatus as Exclude<StatusFilter, 'all'>
          const meta = STATUS_META[badgeKey]
          if (!meta) {
            return (
              <Text fontSize="$3" color="$color11">
                {row.original.badgeStatus}
              </Text>
            )
          }
          return (
            <Text
              fontSize="$2"
              fontWeight="600"
              color={meta.color}
              bg={meta.bg}
              px="$2"
              py="$1"
              rounded="$3"
            >
              {meta.label}
            </Text>
          )
        },
      },
      {
        accessorKey: 'verificationLevel',
        header: 'Level',
        cell: ({ row }: CellContext<VerificationItem, unknown>) =>
          row.original.verificationLevel ?? '—',
      },
      {
        accessorKey: 'verifiedAt',
        header: 'Verified',
        cell: ({ row }: CellContext<VerificationItem, unknown>) =>
          formatDate(row.original.verifiedAt),
      },
      {
        accessorKey: 'badgeExpiresAt',
        header: 'Expires',
        cell: ({ row }: CellContext<VerificationItem, unknown>) =>
          formatDate(row.original.badgeExpiresAt),
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization',
        cell: ({ row }: CellContext<VerificationItem, unknown>) =>
          row.original.organizationName ?? '—',
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }: CellContext<VerificationItem, unknown>) => {
          const sourceKey = (row.original.source ?? 'worker') as keyof typeof SOURCE_META
          const meta = SOURCE_META[sourceKey]
          return (
            <Text
              fontSize="$2"
              fontWeight="600"
              color={meta.color}
              bg={meta.bg}
              px="$2"
              py="$1"
              rounded="$3"
            >
              {meta.label}
            </Text>
          )
        },
      },
      {
        accessorKey: 'personaStatus',
        header: 'Persona status',
        cell: ({ row }: CellContext<VerificationItem, unknown>) =>
          row.original.personaStatus ?? '—',
      },
      {
        accessorKey: 'priceCents',
        header: 'Amount',
        cell: ({ row }: CellContext<VerificationItem, unknown>) =>
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
    <YStack flex={1} gap="$4">
      <YStack px="$4" gap="$3">
        <XStack gap="$3" flexWrap="wrap">
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
              p="$3"
              borderColor="$borderColor"
              borderWidth={1}
            >
              <Text fontSize="$2" color="$color11">
                {item.label}
              </Text>
              <Text fontSize="$6" fontWeight="700" color={item.color}>
                {item.value}
              </Text>
            </Card>
          ))}
        </XStack>

        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Badge status filter
          </Text>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <Tabs.List
              bg="$color2"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              overflow="hidden"
            >
              {STATUS_TABS.map((tab) => (
                <Tabs.Tab key={tab.value} flex={1} value={tab.value}>
                  <Text fontSize="$3" fontWeight="600">
                    {tab.label}
                  </Text>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Organization
          </Text>
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
            <XStack gap="$2" items="center">
              <Spinner size="small" />
              <Text fontSize="$2" color="$color11">
                Loading organizations…
              </Text>
            </XStack>
          ) : null}
        </YStack>

        <XStack justify="flex-end">
          <Button
            size="$3"
            variant="outlined"
            icon={RefreshCcw}
            onPress={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            Refresh
          </Button>
        </XStack>
      </YStack>

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
    </YStack>
  )
}
