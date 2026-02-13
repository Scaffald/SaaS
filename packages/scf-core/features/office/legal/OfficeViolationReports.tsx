import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { DataTable } from '@scf/core/components/ui'
import { RefreshCw } from 'lucide-react-native'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

type ViolationReportsOutput =
  inferRouterOutputs<AppRouter>['legalAgreements']['listViolationReports']
type ViolationReport = ViolationReportsOutput['items'][number]

const columnHelper = createColumnHelper<ViolationReport>()

const formatViolationType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '$orange11' as const
    case 'under_review':
      return '$blue11' as const
    case 'confirmed':
      return '$red11' as const
    case 'dismissed':
      return '$gray11' as const
    case 'resolved':
      return '$green11' as const
    default:
      return '$color11' as const
  }
}

export function OfficeViolationReports() {
  const reportsQuery = api.legalAgreements.listViolationReports.useQuery(undefined, {
    staleTime: 30_000,
  })

  const updateMutation = api.legalAgreements.updateViolationReport.useMutation({
    onSuccess: () => {
      reportsQuery.refetch()
    },
  })

  const reportsColumns = useMemo(() => {
    const defs = [
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor('reportedByName', {
        header: 'Reported By',
        cell: (info) => info.getValue() ?? 'N/A',
      }),
      columnHelper.accessor('organizationName', {
        header: 'Organization',
        cell: (info) => info.getValue() ?? 'N/A',
      }),
      columnHelper.accessor('workerName', {
        header: 'Worker',
        cell: (info) => info.getValue() ?? 'N/A',
      }),
      columnHelper.accessor('violationType', {
        header: 'Type',
        cell: (info) => formatViolationType(info.getValue()),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => <Text >{info.getValue()}</Text>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return <Text color={getStatusColor(status)}>{formatStatus(status)}</Text>
        },
      }),
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          if (row.status === 'pending') {
            return (
              <Row gap={4}>
                <Button
                  size="xs"
                  variant="outline"
                  color="primary"
                  onPress={() => {
                    updateMutation.mutate({
                      reportId: info.getValue(),
                      status: 'under_review',
                    })
                  }}
                  disabled={updateMutation.isPending}
                >
                  Review
                </Button>
              </Row>
            )
          }
          return null
        },
      }),
    ]
    return defs as ColumnDef<ViolationReport, unknown>[]
  }, [updateMutation])

  return (
    <Stack flex={1} padding="md" gap={16}>
      <Row justify="space-between" align="center">
        <Stack>
          <Text>Anti-Circumvention Violation Reports</Text>
          <Text color="$gray11">
            Review and manage reports of off-platform hires and fee avoidance.
          </Text>
        </Stack>
        <Button
          size="sm"
          variant="outline"
          iconStart={RefreshCw}
          onPress={() => reportsQuery.refetch()}
          disabled={reportsQuery.isRefetching}
        >
          Refresh
        </Button>
      </Row>

      {reportsQuery.isLoading ? (
        <Stack flex={1} align="center" justify="center" gap={12}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading violation reports…</Text>
        </Stack>
      ) : (
        <Card borderWidth={1} borderColor="$color6" backgroundColor="$color2" padding="md">
          <DataTable
            columns={reportsColumns}
            data={reportsQuery.data?.items ?? []}
            isLoading={reportsQuery.isRefetching}
            pageSize={25}
            emptyMessage="No violation reports found."
          />
          {reportsQuery.data && reportsQuery.data.totalCount > 0 && (
            <Text color="$gray11" marginTop={12}>
              Showing {reportsQuery.data.items.length} of {reportsQuery.data.totalCount} reports
            </Text>
          )}
        </Card>
      )}
    </Stack>
  )
}
