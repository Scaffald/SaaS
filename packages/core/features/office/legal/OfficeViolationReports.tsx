import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { DataTable } from '@app/ui'
import { RefreshCw } from '@tamagui/lucide-icons'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from 'tamagui'

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
        cell: (info) => (
          <Text fontSize="$2" numberOfLines={2}>
            {info.getValue()}
          </Text>
        ),
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
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          if (row.status === 'pending') {
            return (
              <XStack gap="$1">
                <Button
                  size="$2"
                  variant="outlined"
                  theme="blue"
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
              </XStack>
            )
          }
          return null
        },
      }),
    ]
    return defs as ColumnDef<ViolationReport, unknown>[]
  }, [updateMutation])

  return (
    <YStack flex={1} p="$4" gap="$4">
      <XStack justify="space-between" items="center">
        <YStack>
          <Text fontSize="$7" fontWeight="700">
            Anti-Circumvention Violation Reports
          </Text>
          <Text color="$color10">
            Review and manage reports of off-platform hires and fee avoidance.
          </Text>
        </YStack>
        <Button
          size="$3"
          variant="outlined"
          icon={RefreshCw}
          onPress={() => reportsQuery.refetch()}
          disabled={reportsQuery.isRefetching}
        >
          Refresh
        </Button>
      </XStack>

      {reportsQuery.isLoading ? (
        <YStack flex={1} items="center" justify="center" gap="$3">
          <Spinner size="large" />
          <Text color="$color10">Loading violation reports…</Text>
        </YStack>
      ) : (
        <Card borderWidth={1} borderColor="$color6" bg="$color2" padding="$4">
          <DataTable
            columns={reportsColumns}
            data={reportsQuery.data?.items ?? []}
            isLoading={reportsQuery.isRefetching}
            pageSize={25}
            emptyMessage="No violation reports found."
          />
          {reportsQuery.data && reportsQuery.data.totalCount > 0 && (
            <Text fontSize="$2" color="$color10" mt="$3">
              Showing {reportsQuery.data.items.length} of {reportsQuery.data.totalCount} reports
            </Text>
          )}
        </Card>
      )}
    </YStack>
  )
}
