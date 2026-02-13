import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import { RefreshCw } from 'lucide-react-native'
import type { ColumnDef } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Card, Spinner, Table, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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

const getStatusColor = (status: string, theme: 'light' | 'dark') => {
  switch (status) {
    case 'pending':
      return theme === "light" ? colors.yellow[700] : colors.yellow[300]
    case 'under_review':
      return theme === "light" ? colors.blue[700] : colors.blue[300]
    case 'confirmed':
      return theme === "light" ? colors.error[700] : colors.error[300] as const
    case 'dismissed':
      return colors.text[theme].secondary as const
    case 'resolved':
      return theme === "light" ? colors.green[700] : colors.green[300] as const
    default:
      return colors.text[theme].secondary
  }
}

export function OfficeViolationReports() {
  const { theme } = useThemeContext()
  const reportsQuery = api.legalAgreements.listViolationReports.useQuery(undefined, {
    staleTime: 30_000,
  })

  const updateMutation = api.legalAgreements.updateViolationReport.useMutation({
    onSuccess: () => {
      reportsQuery.refetch()
    },
  })

  const reportsColumnDefs = useMemo(() => {
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
        cell: (info) => <Text>{info.getValue()}</Text>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return <Text color={getStatusColor(status, theme)}>{formatStatus(status)}</Text>
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
                  size="sm"
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
  }, [updateMutation, theme])

  const tableColumns = useMemo(
    () => columnsFromTanStack<ViolationReport>(reportsColumnDefs),
    [reportsColumnDefs]
  )

  return (
    <Stack flex={1} padding="md" gap={16}>
      <Row justify="space-between" align="center">
        <Stack>
          <Text>Anti-Circumvention Violation Reports</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
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
          <Text style={{ color: colors.text[theme].secondary }}>Loading violation reports…</Text>
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
            data={reportsQuery.data?.items ?? []}
            loading={reportsQuery.isRefetching}
            renderLoading={() => (
              <Stack align="center" justify="center" paddingVertical={24} gap={8}>
                <Spinner size="lg" />
                <Text style={{ color: colors.text[theme].secondary }}>Loading…</Text>
              </Stack>
            )}
            pageSize={25}
            emptyMessage="No violation reports found."
          />
          {reportsQuery.data && reportsQuery.data.totalCount > 0 && (
            <Text style={{ color: colors.text[theme].secondary }} marginTop={12}>
              Showing {reportsQuery.data.items.length} of {reportsQuery.data.totalCount} reports
            </Text>
          )}
        </Card>
      )}
    </Stack>
  )
}
