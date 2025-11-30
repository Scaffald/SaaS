import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { DataTable } from '@app/core/components/ui'
import { RefreshCw } from '@tamagui/lucide-icons'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from 'tamagui'

type PaymentAnalytics = inferRouterOutputs<AppRouter>['payments']['adminGetAnalytics']

type FailedTransactionRow = PaymentAnalytics['failedQueue'][number]

const columnHelper = createColumnHelper<FailedTransactionRow>()

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

const formatTransactionType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function OfficePaymentAnalytics() {
  const analyticsQuery = api.payments.adminGetAnalytics.useQuery(undefined, {
    staleTime: 60_000,
  })

  const analytics = analyticsQuery.data as PaymentAnalytics | undefined

  const kpis = analytics?.kpis
  const breakdowns = analytics?.breakdowns
  const failedQueue = analytics?.failedQueue ?? []

  const columns = useMemo(() => {
    const defs = [
      columnHelper.accessor('transactionType', {
        header: 'Type',
        cell: (info) => <Text fontWeight="600">{formatTransactionType(info.getValue())}</Text>,
      }),
      columnHelper.accessor('amountCents', {
        header: 'Amount',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('failureReason', {
        header: 'Failure Reason',
        cell: (info) => (
          <Text color="$red11" fontSize="$3">
            {info.getValue() ?? 'Unknown error'}
          </Text>
        ),
      }),
      columnHelper.accessor('failedAt', {
        header: 'Failed At',
        cell: (info) => {
          const value = info.getValue()
          if (!value) {
            return '—'
          }
          return new Date(value).toLocaleString()
        },
      }),
    ]
    return defs as ColumnDef<FailedTransactionRow, unknown>[]
  }, [])

  const summaryCards = useMemo(() => {
    if (!kpis) {
      return []
    }

    return [
      {
        label: 'Total Revenue',
        value: formatCurrency(kpis.totalRevenue),
        subtext: `${kpis.succeededTransactions} successful transactions`,
      },
      {
        label: 'Success Rate',
        value: `${kpis.successRate.toFixed(1)}%`,
        subtext: `${kpis.succeededTransactions} of ${kpis.totalTransactions} succeeded`,
      },
      {
        label: 'Failed Transactions',
        value: kpis.failedTransactions.toString(),
        subtext: kpis.failedTransactions > 0 ? 'Requires attention' : 'All transactions succeeded',
      },
      {
        label: 'Pending',
        value: kpis.pendingTransactions.toString(),
        subtext: 'Awaiting completion',
      },
    ]
  }, [kpis])

  const typeBreakdown = useMemo(() => {
    if (!breakdowns?.byType) {
      return []
    }

    return Object.entries(breakdowns.byType)
      .map(([type, stats]) => ({
        type,
        label: formatTransactionType(type),
        ...(stats as { revenue: number; count: number; succeeded: number; failed: number }),
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [breakdowns])

  const isLoading = analyticsQuery.isLoading

  return (
    <YStack flex={1} p="$4" gap="$4">
      <XStack justify="space-between" items="center">
        <YStack>
          <Text fontSize="$7" fontWeight="700">
            Payment Analytics
          </Text>
          <Text color="$color10" fontSize="$3">
            Monitor payment transactions, revenue, and failure rates across all services.
          </Text>
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
          <Text color="$color10">Loading payment metrics…</Text>
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
                maxWidth={280}
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

          {typeBreakdown.length > 0 && (
            <Card borderWidth={1} borderColor="$color6" bg="$color2" padding="$4">
              <YStack gap="$3">
                <Text fontWeight="600" fontSize="$4">
                  Revenue by Transaction Type
                </Text>
                <YStack gap="$3">
                  {typeBreakdown.map((entry) => (
                    <YStack key={entry.type} gap="$1">
                      <XStack justify="space-between" items="center">
                        <Text fontWeight="600">{entry.label}</Text>
                        <Text color="$color10" fontSize="$2">
                          {formatCurrency(entry.revenue)} · {entry.count} transactions
                        </Text>
                      </XStack>
                      <XStack gap="$2">
                        <Text fontSize="$2" color="$color10">
                          {entry.succeeded} succeeded, {entry.failed} failed
                        </Text>
                      </XStack>
                    </YStack>
                  ))}
                </YStack>
              </YStack>
            </Card>
          )}

          {failedQueue.length > 0 && (
            <Card borderWidth={1} borderColor="$red6" bg="$red2" padding="$4">
              <YStack gap="$3">
                <XStack justify="space-between" items="center">
                  <Text fontWeight="600" fontSize="$4" color="$red11">
                    Failed Transactions Queue
                  </Text>
                  <Text color="$red11" fontSize="$3">
                    {failedQueue.length} failed
                  </Text>
                </XStack>
                <DataTable
                  columns={columns}
                  data={failedQueue}
                  isLoading={false}
                  pageSize={10}
                  emptyMessage="No failed transactions"
                />
              </YStack>
            </Card>
          )}
        </>
      )}
    </YStack>
  )
}
