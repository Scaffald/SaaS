import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { DataTable } from '@app/ui'
import { RefreshCw } from '@tamagui/lucide-icons'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo, useState } from 'react'
import { Button, Card, Input, Paragraph, Progress, Spinner, Text, XStack, YStack } from 'tamagui'

type StorageAnalytics = inferRouterOutputs<AppRouter>['office']['storage']['analytics']

type StorageTableRow = {
  userId: string
  displayName: string
  username: string
  totalBytes: number
  workLogBytes: number
  portfolioBytes: number
  certificationBytes: number
  storageLimitBytes: number | null
  usagePercentOfLimit: number | null
  updatedAt: string | null
}

const columnHelper = createColumnHelper<StorageTableRow>()

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']
  const base = Math.log(bytes) / Math.log(1024)
  const unitIndex = Math.min(Math.floor(base), UNITS.length - 1)
  const scaled = bytes / 1024 ** unitIndex

  return `${scaled.toFixed(unitIndex === 0 ? 0 : 1)} ${UNITS[unitIndex]}`
}

const formatPercent = (value: number | null | undefined): string => {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return '—'
  }
  return `${value?.toFixed(1)}%`
}

export function OfficeStorageDashboard() {
  const [search, setSearch] = useState('')
  const analyticsQuery = api.office.storage.analytics.useQuery(undefined, {
    staleTime: 60_000,
  })

  const analytics = analyticsQuery.data as StorageAnalytics | undefined

  const topUsers: StorageAnalytics['topUsers'] = analytics?.topUsers ?? []

  const tableRows = useMemo<StorageTableRow[]>(() => {
    if (topUsers.length === 0) {
      return []
    }

    return topUsers.map((user: StorageAnalytics['topUsers'][number]) => {
      const displayName =
        user.displayName?.trim() || user.username?.trim() || user.userId.slice(0, 8)

      return {
        userId: user.userId,
        displayName,
        username: user.username ?? '',
        totalBytes: user.totalBytes,
        workLogBytes: user.workLogBytes,
        portfolioBytes: user.portfolioBytes,
        certificationBytes: user.certificationBytes,
        storageLimitBytes: user.storageLimitBytes,
        usagePercentOfLimit: user.usagePercentOfLimit,
        updatedAt: user.updatedAt,
      }
    })
  }, [topUsers])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return tableRows
    }

    return tableRows.filter((row) => {
      if (row.displayName.toLowerCase().includes(query)) {
        return true
      }

      if (row.username.toLowerCase().includes(query)) {
        return true
      }

      return row.userId.toLowerCase().includes(query)
    })
  }, [tableRows, search])

  const columns = useMemo(() => {
    const defs = [
      columnHelper.accessor('displayName', {
        header: 'User',
        cell: (info) => {
          const row = info.row.original
          return (
            <YStack gap="$1">
              <Text fontWeight="600">{row.displayName}</Text>
              <Text color="$color10" fontSize="$2">
                {row.username ? `@${row.username}` : row.userId.slice(0, 8)}
              </Text>
            </YStack>
          )
        },
      }),
      columnHelper.accessor('totalBytes', {
        header: 'Total Usage',
        cell: (info) => formatBytes(info.getValue()),
      }),
      columnHelper.accessor('workLogBytes', {
        header: 'Work Logs',
        cell: (info) => formatBytes(info.getValue()),
      }),
      columnHelper.accessor('portfolioBytes', {
        header: 'Portfolio',
        cell: (info) => formatBytes(info.getValue()),
      }),
      columnHelper.accessor('certificationBytes', {
        header: 'Certifications',
        cell: (info) => formatBytes(info.getValue()),
      }),
      columnHelper.accessor('usagePercentOfLimit', {
        header: 'Limit',
        cell: (info) => {
          const row = info.row.original
          if (!row.storageLimitBytes) {
            return (
              <Text color="$color10" fontSize="$2">
                No limit
              </Text>
            )
          }

          const percent = row.usagePercentOfLimit ?? 0
          const clamped = Math.min(Math.max(percent, 0), 200)

          return (
            <YStack gap="$1">
              <Progress value={clamped} max={100} bg="$color3" size="$1">
                <Progress.Indicator animation="bouncy" bg={percent > 100 ? '$red10' : '$green10'} />
              </Progress>
              <Text fontSize="$2" color="$color10">
                {formatPercent(percent)} of {formatBytes(row.storageLimitBytes)}
              </Text>
            </YStack>
          )
        },
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: (info) => {
          const value = info.getValue()
          if (!value) {
            return '—'
          }
          return new Date(value).toLocaleString()
        },
      }),
    ]
    return defs as ColumnDef<StorageTableRow, unknown>[]
  }, [])

  const totals = analytics?.totals
  const breakdown = (analytics?.breakdown ?? []) as StorageAnalytics['breakdown']

  const summaryCards = useMemo(() => {
    if (!totals) {
      return []
    }

    const cards = [
      {
        label: 'Total storage used',
        value: formatBytes(totals.totalBytes),
        subtext: totals.lastUpdatedAt
          ? `Updated ${new Date(totals.lastUpdatedAt).toLocaleString()}`
          : undefined,
      },
      {
        label: 'Tracked users',
        value: totals.userCount.toLocaleString(),
        subtext: `Avg ${formatBytes(totals.averageBytes)} per user`,
      },
      {
        label: 'Configured limits',
        value: totals.limitsConfiguredCount.toLocaleString(),
        subtext:
          totals.totalLimitBytes > 0
            ? `${formatBytes(totals.totalLimitBytes)} allocated`
            : 'No user limits configured',
      },
      {
        label: 'Utilization',
        value: totals.utilizationPercent !== null ? formatPercent(totals.utilizationPercent) : '—',
        subtext:
          totals.overLimitCount > 0
            ? `${totals.overLimitCount} over limit`
            : 'All users within limits',
      },
    ]

    return cards
  }, [totals])

  const isLoading = analyticsQuery.isLoading

  return (
    <YStack flex={1} p="$4" gap="$4">
      <XStack justify="space-between" items="center">
        <YStack>
          <Text fontSize="$7" fontWeight="700">
            Storage Analytics
          </Text>
          <Paragraph color="$color10">
            Monitor how workers consume storage across work logs, portfolios, and certifications.
          </Paragraph>
        </YStack>
        <Button
          size="$3"
          variant="outlined"
          icon={RefreshCw}
          onPress={() => analyticsQuery.refetch()}
          disabled={analyticsQuery.isRefetching}
        >
          Refresh
        </Button>
      </XStack>

      {isLoading ? (
        <YStack flex={1} items="center" justify="center" gap="$3">
          <Spinner size="large" />
          <Text color="$color10">Loading storage metrics…</Text>
        </YStack>
      ) : (
        <>
          <XStack gap="$3" flexWrap="wrap">
            {summaryCards.map((card) => (
              <Card
                key={card.label}
                borderWidth={1}
                borderColor="$color6"
                bg="$color2"
                padding="$4"
                width="100%"
                maxWidth={320}
              >
                <YStack gap="$2">
                  <Text color="$color10" fontSize="$2">
                    {card.label}
                  </Text>
                  <Text fontSize="$5" fontWeight="700">
                    {card.value}
                  </Text>
                  {card.subtext ? (
                    <Text color="$color10" fontSize="$2">
                      {card.subtext}
                    </Text>
                  ) : null}
                </YStack>
              </Card>
            ))}
          </XStack>

          <Card borderWidth={1} borderColor="$color6" bg="$color2" padding="$4">
            <YStack gap="$3">
              <Text fontWeight="600" fontSize="$4">
                Usage breakdown
              </Text>
              <YStack gap="$3">
                {breakdown.map((entry: StorageAnalytics['breakdown'][number]) => (
                  <YStack key={entry.label} gap="$1">
                    <XStack justify="space-between" items="center">
                      <Text fontWeight="600">{entry.label}</Text>
                      <Text color="$color10" fontSize="$2">
                        {formatBytes(entry.bytes)} · {formatPercent(entry.percent)}
                      </Text>
                    </XStack>
                    <Progress value={entry.percent} max={100} bg="$color3" size="$1">
                      <Progress.Indicator animation="bouncy" bg="$blue10" />
                    </Progress>
                  </YStack>
                ))}
              </YStack>
            </YStack>
          </Card>

          <Card borderWidth={1} borderColor="$color6" bg="$color2" padding="$4">
            <YStack gap="$3">
              <XStack justify="space-between" items="center">
                <Text fontWeight="600" fontSize="$4">
                  Top users by storage consumption
                </Text>
                <Button
                  size="$2"
                  variant="outlined"
                  onPress={() => analyticsQuery.refetch()}
                  disabled={analyticsQuery.isRefetching}
                >
                  Refresh table
                </Button>
              </XStack>
              <Input
                placeholder="Search by name, username, or user ID…"
                value={search}
                onChangeText={setSearch}
              />
              <DataTable
                columns={columns}
                data={filteredRows}
                isLoading={analyticsQuery.isRefetching}
                pageSize={25}
                emptyMessage="No storage usage records found"
              />
            </YStack>
          </Card>
        </>
      )}
    </YStack>
  )
}
