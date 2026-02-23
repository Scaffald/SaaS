import { usePaymentTransactions, useExportTransactions } from '@scf/core/utils/payments-sdk-hooks'
import type { PaymentTransaction } from '@scaffald/sdk/types/payments'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import { ResponsiveSelect, Table, useThemeContext } from '@scaffald/ui'
import { Download, FileText, RefreshCw } from 'lucide-react-native'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { TransactionReceiptModal } from './TransactionReceiptModal'
import { colors } from '@scaffald/ui/tokens'

type Transaction = PaymentTransaction

const columnHelper = createColumnHelper<Transaction>()

const formatCurrency = (cents: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

const formatTransactionType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const getStatusColor = (status: string, theme: 'light' | 'dark') => {
  switch (status) {
    case 'succeeded':
      return theme === "light" ? colors.green[700] : colors.green[300]
    case 'failed':
      return theme === "light" ? colors.error[700] : colors.error[300]
    case 'pending':
      return theme === "light" ? colors.yellow[700] : colors.yellow[300]
    case 'refunded':
      return theme === "light" ? colors.blue[700] : colors.blue[300]
    case 'cancelled':
      return colors.text[theme].secondary
    default:
      return colors.text[theme].secondary
  }
}

export function OfficeTransactionHistory() {
  const { theme } = useThemeContext()
  const [selectedOrganizationId, _setSelectedOrganizationId] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string | undefined>()
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  const transactionsQuery = usePaymentTransactions({
    organizationId: selectedOrganizationId,
    status: statusFilter,
    transactionType: transactionTypeFilter,
  })

  const exportCsvMutation = useExportTransactions({
    format: 'csv',
    organizationId: selectedOrganizationId,
    status: statusFilter,
    transactionType: transactionTypeFilter,
  })

  const handleExportCsv = async () => {
    const result = await exportCsvMutation.refetch()
    if (result.data?.data) {
      const blob = new Blob([result.data.data], { type: result.data.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const transactionsColumnDefs = useMemo(() => {
    const defs = [
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor('organizationName', {
        header: 'Organization',
        cell: (info) => info.getValue() ?? 'N/A',
      }),
      columnHelper.accessor('transactionType', {
        header: 'Type',
        cell: (info) => formatTransactionType(info.getValue()),
      }),
      columnHelper.accessor('amountCents', {
        header: 'Amount',
        cell: (info) => {
          const row = info.row.original
          return formatCurrency(info.getValue(), row.currency)
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <Text style={{ color: getStatusColor(status, theme) }}>{formatStatus(status)}</Text>
          )
        },
      }),
      columnHelper.accessor('stripePaymentIntentId', {
        header: 'Stripe ID',
        cell: (info) => (
          <Text style={{ color: colors.text[theme].secondary, fontFamily: 'monospace' }}>
            {info.getValue().slice(0, 20)}...
          </Text>
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => (
          <Button
            size="sm"
            variant="outline"
            iconStart={FileText}
            onPress={() => setSelectedTransactionId(info.getValue())}
          >
            Receipt
          </Button>
        ),
      }),
    ]
    return defs as ColumnDef<Transaction, unknown>[]
  }, [theme])

  const tableColumns = useMemo(
    () => columnsFromTanStack<Transaction>(transactionsColumnDefs),
    [transactionsColumnDefs]
  )

  return (
    <Stack flex={1} padding="md" gap={16}>
      <Row justify="space-between" align="center">
        <Stack>
          <Text>Transaction History</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            View and export payment transaction records.
          </Text>
        </Stack>
        <Row gap={8}>
          <Button
            size="sm"
            variant="outline"
            iconStart={Download}
            onPress={handleExportCsv}
            disabled={exportCsvMutation.isFetching}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCw}
            onPress={() => transactionsQuery.refetch()}
            disabled={transactionsQuery.isRefetching}
          >
            Refresh
          </Button>
        </Row>
      </Row>

      {/* Filters */}
      <Card
        borderWidth={1}
        borderColor={colors.border[theme].default}
        style={{ backgroundColor: colors.bg[theme].subtle }}
        padding="sm"
      >
        <Row gap={12} wrap>
          <Stack gap={4} width={200}>
            <Text style={{ color: colors.text[theme].secondary }}>Status</Text>
            <ResponsiveSelect
              value={statusFilter ?? ''}
              onValueChange={(value) => setStatusFilter(value || undefined)}
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'succeeded', label: 'Succeeded' },
                { value: 'failed', label: 'Failed' },
                { value: 'pending', label: 'Pending' },
                { value: 'refunded', label: 'Refunded' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              triggerProps={{ width: 200 }}
            />
          </Stack>
          <Stack gap={4} width={200}>
            <Text style={{ color: colors.text[theme].secondary }}>Type</Text>
            <ResponsiveSelect
              value={transactionTypeFilter ?? ''}
              onValueChange={(value) => setTransactionTypeFilter(value || undefined)}
              placeholder="All Types"
              options={[
                { value: '', label: 'All Types' },
                { value: 'success_fee_upfront', label: 'Success Fee (Upfront)' },
                { value: 'success_fee_final', label: 'Success Fee (Final)' },
                { value: 'background_check', label: 'Background Check' },
                { value: 'background_check_shared', label: 'Background Check (Shared)' },
                { value: 'id_verification', label: 'ID Verification' },
                { value: 'credit_deposit', label: 'Credit Deposit' },
                { value: 'credit_refund', label: 'Credit Refund' },
              ]}
              triggerProps={{ width: 200 }}
            />
          </Stack>
        </Row>
      </Card>

      {transactionsQuery.isLoading ? (
        <Stack flex={1} align="center" justify="center" gap={12}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading transactions…</Text>
        </Stack>
      ) : (
        <Card
          borderWidth={1}
          borderColor={colors.border[theme].default}
          style={{ backgroundColor: colors.bg[theme].subtle }}
          padding="md"
        >
          <Table
            columns={tableColumns}
            data={transactionsQuery.data?.items ?? []}
            loading={transactionsQuery.isRefetching}
            renderLoading={() => (
              <Stack align="center" justify="center" paddingVertical={24} gap={8}>
                <Spinner size="lg" />
                <Text style={{ color: colors.text[theme].secondary }}>Loading…</Text>
              </Stack>
            )}
            pageSize={25}
            emptyMessage="No transactions found."
          />
          {transactionsQuery.data && transactionsQuery.data.totalCount > 0 && (
            <Text style={{ color: colors.text[theme].secondary }} marginTop={12}>
              Showing {transactionsQuery.data.items.length} of {transactionsQuery.data.totalCount}{' '}
              transactions
            </Text>
          )}
        </Card>
      )}

      {selectedTransactionId && (
        <TransactionReceiptModal
          transactionId={selectedTransactionId}
          open={Boolean(selectedTransactionId)}
          onOpenChange={(open) => {
            if (!open) setSelectedTransactionId(null)
          }}
        />
      )}
    </Stack>
  )
}
