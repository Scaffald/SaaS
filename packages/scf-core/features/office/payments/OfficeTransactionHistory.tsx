import { usePaymentTransactions, useExportTransactions } from '@scf/core/utils/payments-sdk-hooks'
import type { PaymentTransaction } from '@scaffald/sdk'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import { downloadFile } from '@scf/core/utils/platform'
import { ListToolbar, ScreenHeader, ResponsiveSelect, Table, useThemeContext } from '@scaffald/ui'
import { Download, FileText, RefreshCw } from 'lucide-react-native'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { type FilterPillConfig, useToolbarFilters } from '@scf/core/components/toolbarFilters'
import { Button, Card, ErrorState, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { TransactionReceiptModal } from './TransactionReceiptModal'
import { colors } from '@scaffald/ui/tokens'
import { useScreenRhythm } from '@scf/core/constants/layout'

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
      return theme === 'light' ? colors.green[700] : colors.green[300]
    case 'failed':
      return theme === 'light' ? colors.error[700] : colors.error[300]
    case 'pending':
      return theme === 'light' ? colors.yellow[700] : colors.yellow[300]
    case 'refunded':
      return colors.text[theme].emphasis
    case 'cancelled':
      return colors.text[theme].secondary
    default:
      return colors.text[theme].secondary
  }
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'success_fee_upfront', label: 'Success fee (upfront)' },
  { value: 'success_fee_final', label: 'Success fee (final)' },
  { value: 'background_check', label: 'Background check' },
  { value: 'background_check_shared', label: 'Background check (shared)' },
  { value: 'id_verification', label: 'ID verification' },
  { value: 'credit_deposit', label: 'Credit deposit' },
  { value: 'credit_refund', label: 'Credit refund' },
]

const optionLabel = (options: { value: string; label: string }[], value: string | undefined) =>
  options.find((option) => option.value === value)?.label

export function OfficeTransactionHistory() {
  const { gutter, verticalPadding } = useScreenRhythm()
  const { theme } = useThemeContext()
  const [selectedOrganizationId, _setSelectedOrganizationId] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string | undefined>()
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const openFilters = useCallback(() => setFiltersOpen(true), [])

  const filterPills = useMemo<FilterPillConfig[]>(
    () => [
      {
        id: 'status',
        label: 'Status',
        value: optionLabel(STATUS_OPTIONS, statusFilter),
        isActive: Boolean(statusFilter),
        onPress: openFilters,
        popoverContent: (
          <ResponsiveSelect
            value={statusFilter ?? ''}
            onValueChange={(value) => setStatusFilter(value || undefined)}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
          />
        ),
      },
      {
        id: 'type',
        label: 'Type',
        value: optionLabel(TYPE_OPTIONS, transactionTypeFilter),
        isActive: Boolean(transactionTypeFilter),
        onPress: openFilters,
        popoverContent: (
          <ResponsiveSelect
            value={transactionTypeFilter ?? ''}
            onValueChange={(value) => setTransactionTypeFilter(value || undefined)}
            placeholder="All types"
            options={TYPE_OPTIONS}
          />
        ),
      },
    ],
    [statusFilter, transactionTypeFilter, openFilters]
  )
  const toolbarFilters = useToolbarFilters(filterPills, openFilters)

  const transactionsQuery = usePaymentTransactions({
    organizationId: selectedOrganizationId,
    status: statusFilter,
    transactionType: transactionTypeFilter,
  })

  const hasRows = (transactionsQuery.data?.totalCount ?? 0) > 0

  const exportCsvMutation = useExportTransactions({
    format: 'csv',
    organizationId: selectedOrganizationId,
    status: statusFilter,
    transactionType: transactionTypeFilter,
  })

  const handleExportCsv = async () => {
    const result = await exportCsvMutation.refetch()
    if (result.data?.data) {
      const blob = new Blob([result.data.data], {
        type: result.data.contentType,
      })
      const url = URL.createObjectURL(blob)
      void downloadFile({
        url,
        filename: `transactions-${new Date().toISOString().split('T')[0]}.csv`,
      })
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
          <Text
            style={{
              color: colors.text[theme].secondary,
              fontFamily: 'monospace',
            }}
          >
            {info.getValue()?.slice(0, 20) ?? '—'}...
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
    return defs as ColumnDef<Record<string, unknown>, unknown>[]
  }, [theme])

  const tableColumns = useMemo(
    () => columnsFromTanStack<Record<string, unknown>>(transactionsColumnDefs),
    [transactionsColumnDefs]
  )

  return (
    <Stack flex={1} paddingHorizontal={gutter} paddingVertical={verticalPadding} gap={16}>
      <ScreenHeader
        kicker="Payments"
        title="Transaction history"
        tip="Every payment transaction, exportable as CSV."
        actions={
          <Row gap={8}>
            <Button
              size="sm"
              variant="outline"
              iconStart={Download}
              onPress={handleExportCsv}
              // Nothing to export from an empty (or not yet loaded) result:
              // the button used to stay live and download a header row (#1209).
              disabled={exportCsvMutation.isFetching || !hasRows}
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
        }
      />

      {/* The one toolbar row (#1209): the Status and Type selects live in
          the Filters & sort flyout, the applied ones show as chips, and the
          count sits at the right. They were two labelled selects in a grey
          card. No search field: the transactions endpoint takes no search
          term, and filtering only the loaded page would pass a partial
          answer off as the whole. */}
      <ListToolbar
        filterContent={toolbarFilters.filterContent}
        activeFilterCount={toolbarFilters.activeFilterCount}
        chips={toolbarFilters.chips}
        onClearAll={
          toolbarFilters.activeFilterCount > 0
            ? () => {
                setStatusFilter(undefined)
                setTransactionTypeFilter(undefined)
              }
            : undefined
        }
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        // Unknown while loading or after a failed load — not "0 transactions".
        resultCount={transactionsQuery.data?.totalCount}
        resultNoun="transaction"
      />

      {transactionsQuery.isLoading ? (
        <Stack flex={1} align="center" justify="center" gap={12}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading transactions…</Text>
        </Stack>
      ) : transactionsQuery.isError ? (
        // A failed load is not "no transactions": the 500 behind #1019 read as
        // "No transactions found." for every office user (#1021).
        <ErrorState
          title="Couldn’t load transactions"
          description="The transaction history did not load. Nothing here means there are none."
          error={transactionsQuery.error as Error}
          retry={() => transactionsQuery.refetch()}
        />
      ) : (
        <Card
          borderWidth={1}
          borderColor={colors.border[theme].default}
          // The table's own surface is bg.default; a subtle card around it drew
          // a white table inside a grey frame (Scaffald/SaaS#1102). One surface.
          style={{ backgroundColor: colors.bg[theme].default }}
          padding="md"
        >
          <Table
            columns={tableColumns}
            data={
              (transactionsQuery.data?.items ??
                []) as unknown as import('@scaffald/ui').TableRowData[]
            }
            loading={transactionsQuery.isRefetching}
            renderLoading={() => (
              <Stack align="center" justify="center" paddingVertical={24} gap={8}>
                <Spinner variant="ios" size="lg" />
                <Text style={{ color: colors.text[theme].secondary }}>Loading…</Text>
              </Stack>
            )}
            pageSize={25}
            emptyMessage="No transactions found."
          />
          {/* The toolbar carries the total; this only says when the table
              holds fewer rows than that. */}
          {transactionsQuery.data &&
            transactionsQuery.data.items.length < transactionsQuery.data.totalCount && (
              <Text style={{ color: colors.text[theme].secondary, marginTop: 12 }}>
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
