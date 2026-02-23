import { usePaymentAnalytics } from '@scf/core/utils/payments-sdk-hooks'
import type { PaymentAnalytics, FailedTransactionRow } from '@scaffald/sdk/types/payments'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import { RefreshCw } from 'lucide-react-native'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Button, Card, Spinner, Table, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const analyticsQuery = usePaymentAnalytics()

  const analytics = analyticsQuery.data as PaymentAnalytics | undefined

  const kpis = analytics?.kpis
  const breakdowns = analytics?.breakdowns
  const failedQueue = analytics?.failedQueue ?? []

  const columnDefs = useMemo(() => {
    const defs = [
      columnHelper.accessor('transactionType', {
        header: 'Type',
        cell: (info) => <Text>{formatTransactionType(info.getValue())}</Text>,
      }),
      columnHelper.accessor('amountCents', {
        header: 'Amount',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('failureReason', {
        header: 'Failure Reason',
        cell: (info) => (
          <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
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
  }, [theme])

  const tableColumns = useMemo(
    () => columnsFromTanStack<FailedTransactionRow>(columnDefs),
    [columnDefs]
  )

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
    <Stack flex={1} padding="md" gap={16}>
      <Row justify="space-between" align="center">
        <Stack>
          <Text>Payment Analytics</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Monitor payment transactions, revenue, and failure rates across all services.
          </Text>
        </Stack>
        <Button
          size="sm"
          variant="outline"
          iconStart={RefreshCw}
          onPress={() => analyticsQuery.refetch()}
          disabled={analyticsQuery.isRefetching}
        >
          Refresh
        </Button>
      </Row>

      {isLoading ? (
        <Stack flex={1} align="center" justify="center" gap={12}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading payment metrics…</Text>
        </Stack>
      ) : (
        <>
          <Row gap={12} wrap>
            {summaryCards.map((card) => (
              <Card
                key={card.label}
                borderWidth={1}
                borderColor={colors.border[theme].default}
                style={{ backgroundColor: colors.bg[theme].subtle }}
                padding="md"
                width="100%"
                maxWidth={280}
              >
                <Stack gap={8}>
                  <Text style={{ color: colors.text[theme].secondary }}>{card.label}</Text>
                  <Text>{card.value}</Text>
                  {card.subtext ? (
                    <Text style={{ color: colors.text[theme].secondary }}>{card.subtext}</Text>
                  ) : null}
                </Stack>
              </Card>
            ))}
          </Row>

          {typeBreakdown.length > 0 && (
            <Card
              borderWidth={1}
              borderColor={colors.border[theme].default}
              style={{ backgroundColor: colors.bg[theme].subtle }}
              padding="md"
            >
              <Stack gap={12}>
                <Text>Revenue by Transaction Type</Text>
                <Stack gap={12}>
                  {typeBreakdown.map((entry) => (
                    <Stack key={entry.type} gap={4}>
                      <Row justify="space-between" align="center">
                        <Text>{entry.label}</Text>
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {formatCurrency(entry.revenue)} · {entry.count} transactions
                        </Text>
                      </Row>
                      <Row gap={8}>
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {entry.succeeded} succeeded, {entry.failed} failed
                        </Text>
                      </Row>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Card>
          )}

          {failedQueue.length > 0 && (
            <Card
              borderWidth={1}
              borderColor={theme === "light" ? colors.error[300] : colors.error[700]}
              style={{ backgroundColor: theme === "light" ? colors.error[50] : colors.error[900] }}
              padding="md"
            >
              <Stack gap={12}>
                <Row justify="space-between" align="center">
                  <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>Failed Transactions Queue</Text>
                  <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                    {failedQueue.length} failed
                  </Text>
                </Row>
                <Table
                  columns={tableColumns}
                  data={failedQueue}
                  pageSize={10}
                  emptyMessage="No failed transactions"
                  getRowId={(row, i) => (row as { id?: string }).id ?? String(i)}
                />
              </Stack>
            </Card>
          )}
        </>
      )}
    </Stack>
  )
}
