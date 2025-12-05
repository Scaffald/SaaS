import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { DataTable } from '@scf/core/components/ui'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Download, FileText, RefreshCw } from '@tamagui/lucide-icons'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
import { TransactionReceiptModal } from './TransactionReceiptModal'

type TransactionListOutput = inferRouterOutputs<AppRouter>['payments']['adminListTransactions']
type Transaction = TransactionListOutput['items'][number]

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'succeeded':
      return '$green11' as const
    case 'failed':
      return '$red11' as const
    case 'pending':
      return '$orange11' as const
    case 'refunded':
      return '$blue11' as const
    case 'cancelled':
      return '$gray11' as const
    default:
      return '$color11' as const
  }
}

export function OfficeTransactionHistory() {
  const [selectedOrganizationId, _setSelectedOrganizationId] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string | undefined>()
  const [_selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  const transactionsQuery = api.payments.adminListTransactions.useQuery(
    {
      organizationId: selectedOrganizationId,
      status: statusFilter as
        | 'pending'
        | 'succeeded'
        | 'failed'
        | 'refunded'
        | 'cancelled'
        | undefined,
      transactionType: transactionTypeFilter as
        | 'success_fee_upfront'
        | 'success_fee_final'
        | 'background_check'
        | 'background_check_shared'
        | 'id_verification'
        | 'credit_deposit'
        | 'credit_refund'
        | undefined,
    },
    {
      staleTime: 30_000,
    }
  )

  const exportCsvMutation = api.payments.exportTransactions.useQuery(
    {
      format: 'csv',
      organizationId: selectedOrganizationId,
      status: statusFilter as
        | 'pending'
        | 'succeeded'
        | 'failed'
        | 'refunded'
        | 'cancelled'
        | undefined,
      transactionType: transactionTypeFilter as
        | 'success_fee_upfront'
        | 'success_fee_final'
        | 'background_check'
        | 'background_check_shared'
        | 'id_verification'
        | 'credit_deposit'
        | 'credit_refund'
        | undefined,
    },
    {
      enabled: false,
    }
  )

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

  const transactionsColumns = useMemo(() => {
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
            <Text color={getStatusColor(status)} fontWeight="600">
              {formatStatus(status)}
            </Text>
          )
        },
      }),
      columnHelper.accessor('stripePaymentIntentId', {
        header: 'Stripe ID',
        cell: (info) => (
          <Text fontSize="$2" color="$color10" style={{ fontFamily: 'monospace' }}>
            {info.getValue().slice(0, 20)}...
          </Text>
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => (
          <Button
            size="$2"
            variant="outlined"
            icon={FileText}
            onPress={() => setSelectedTransactionId(info.getValue())}
          >
            Receipt
          </Button>
        ),
      }),
    ]
    return defs as ColumnDef<Transaction, unknown>[]
  }, [])

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <Text fontSize="$7" fontWeight="700">
            Transaction History
          </Text>
          <Text color="$color10">View and export payment transaction records.</Text>
        </YStack>
        <XStack gap="$2">
          <Button
            size="$3"
            variant="outlined"
            icon={Download}
            onPress={handleExportCsv}
            disabled={exportCsvMutation.isFetching}
          >
            Export CSV
          </Button>
          <Button
            size="$3"
            variant="outlined"
            icon={RefreshCw}
            onPress={() => transactionsQuery.refetch()}
            disabled={transactionsQuery.isRefetching}
          >
            Refresh
          </Button>
        </XStack>
      </XStack>

      {/* Filters */}
      <Card borderWidth={1} borderColor="$color6" backgroundColor="$color2" padding="$3">
        <XStack gap="$3" flexWrap="wrap">
          <YStack gap="$1" width={200}>
            <Text fontSize="$2" color="$color10">
              Status
            </Text>
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
          </YStack>
          <YStack gap="$1" width={200}>
            <Text fontSize="$2" color="$color10">
              Type
            </Text>
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
          </YStack>
        </XStack>
      </Card>

      {transactionsQuery.isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
          <Spinner size="large" />
          <Text color="$color10">Loading transactions…</Text>
        </YStack>
      ) : (
        <Card borderWidth={1} borderColor="$color6" backgroundColor="$color2" padding="$4">
          <DataTable
            columns={transactionsColumns}
            data={transactionsQuery.data?.items ?? []}
            isLoading={transactionsQuery.isRefetching}
            pageSize={25}
            emptyMessage="No transactions found."
          />
          {transactionsQuery.data && transactionsQuery.data.totalCount > 0 && (
            <Text fontSize="$2" color="$color10" marginTop="$3">
              Showing {transactionsQuery.data.items.length} of {transactionsQuery.data.totalCount}{' '}
              transactions
            </Text>
          )}
        </Card>
      )}

      {_selectedTransactionId && (
        <TransactionReceiptModal
          transactionId={_selectedTransactionId}
          open={Boolean(_selectedTransactionId)}
          onOpenChange={(open) => {
            if (!open) setSelectedTransactionId(null)
          }}
        />
      )}
    </YStack>
  )
}
