/**
 * REQ-6: CCPA Admin Audit Log Page
 * TASK-7: Implement CCPA Audit Log Page with Filtering and Export
 *
 * Shows audit trail for CCPA-related events:
 * - Privacy request actions
 * - Data access events
 * - Breach notifications
 * - Compliance events
 */

'use client'

import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Button, Card, H2, H3, Input, Spinner } from '@unicornlove/ui'
import { useRouter } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Color mappings
const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '$red2', text: '$red11' },
  high: { bg: '$orange2', text: '$orange11' },
  medium: { bg: '$yellow2', text: '$yellow11' },
  low: { bg: '$green2', text: '$green11' },
  info: { bg: '$gray2', text: '$gray11' },
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  compliance: { bg: '$blue2', text: '$blue11' },
  security: { bg: '$red2', text: '$red11' },
  data_access: { bg: '$green2', text: '$green11' },
  data_modification: { bg: '$orange2', text: '$orange11' },
  authentication: { bg: '$purple2', text: '$purple11' },
  authorization: { bg: '$cyan2', text: '$cyan11' },
  admin: { bg: '$yellow2', text: '$yellow11' },
  system: { bg: '$gray2', text: '$gray11' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  success: { bg: '$green2', text: '$green11' },
  failure: { bg: '$red2', text: '$red11' },
  partial: { bg: '$yellow2', text: '$yellow11' },
  denied: { bg: '$orange2', text: '$orange11' },
}

export default function CCPAAuditLogPage() {
  const router = useRouter()

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [actionSearch, setActionSearch] = useState('')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)

  // Queries
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = trpc.ccpaAdmin.listAuditLogs.useQuery(
    {
      category:
        categoryFilter !== 'all'
          ? (categoryFilter as 'compliance' | 'security' | 'data_access' | 'data_modification')
          : undefined,
      severity:
        severityFilter !== 'all'
          ? (severityFilter as 'critical' | 'high' | 'medium' | 'low' | 'info')
          : undefined,
      action: actionSearch || undefined,
      limit,
      offset,
    },
    { refetchInterval: 30000 }
  )

  const { data: statsData } = trpc.ccpaAdmin.getAuditStats.useQuery({ days: 30 })

  // Helpers
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [])

  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    const logs = logsData?.items ?? []
    let content: string
    let filename: string
    let mimeType: string

    if (format === 'csv') {
      const headers = [
        'Timestamp',
        'Category',
        'Action',
        'Severity',
        'Status',
        'Resource',
        'IP Address',
      ]
      const rows = logs.map((log) => [
        log.createdAt,
        log.category,
        log.action,
        log.severity,
        log.status ?? '',
        log.resourceName ?? '',
        log.ipAddress ?? '',
      ])
      content =
        [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
      filename = `ccpa-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
      mimeType = 'text/csv'
    } else {
      content = JSON.stringify(logs, null, 2)
      filename = `ccpa-audit-log-${new Date().toISOString().slice(0, 10)}.json`
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [logsData])

  // Loading state
  if (isLoading) {
    return (
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$gray11" marginTop="$4">
            Loading audit log...
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Error state
  if (error) {
    return (
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack
          padding="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <Text fontWeight="600" color="$red11">
            Error loading audit log
          </Text>
          <Text color="$red10" fontSize="$2" marginTop="$2">
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            marginTop="$3"
            size="$3"
            backgroundColor="$red9"
            color="white"
            hoverStyle={{ backgroundColor: '$red10' }}
            onPress={() => refetch()}
          >
            Retry
          </Button>
        </YStack>
      </YStack>
    )
  }

  const logs = logsData?.items ?? []
  const totalCount = logsData?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H2 marginBottom="$2">CCPA Audit Log</H2>
          <Text color="$gray11">
            {totalCount} event{totalCount !== 1 ? 's' : ''} in the last 30 days
          </Text>
        </YStack>
        <XStack gap="$2">
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => router.push('/admin/ccpa')}
          >
            Back to Dashboard
          </Button>
          <Button
            backgroundColor="$blue9"
            color="white"
            hoverStyle={{ backgroundColor: '$blue10' }}
            onPress={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => handleExport('json')}
          >
            Export JSON
          </Button>
        </XStack>
      </XStack>

      {/* Summary Stats */}
      {statsData && (
        <XStack gap="$4" marginBottom="$6" flexWrap="wrap">
          <Card padding="$4" flex={1} minWidth={180}>
            <Text color="$gray11" fontSize="$2" marginBottom="$1">
              Total Events (30d)
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$gray12">
              {statsData.totalEvents}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={180} backgroundColor="$red2">
            <Text color="$red11" fontSize="$2" marginBottom="$1">
              Security Events
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$red11">
              {statsData.securityEvents}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={180} backgroundColor="$orange2">
            <Text color="$orange11" fontSize="$2" marginBottom="$1">
              Failed Events
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$orange11">
              {statsData.failedEvents}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={180}>
            <Text color="$gray11" fontSize="$2" marginBottom="$1">
              Compliance Events
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$blue11">
              {statsData.categoryBreakdown?.compliance ?? 0}
            </Text>
          </Card>
        </XStack>
      )}

      {/* Filters */}
      <Card padding="$4" marginBottom="$4">
        <H3 marginBottom="$3">Filters</H3>
        <XStack flexWrap="wrap" gap="$4" alignItems="flex-end">
          <YStack minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Category
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {['all', 'compliance', 'security', 'data_access', 'data_modification'].map(
                (category) => (
                  <Button
                    key={category}
                    onPress={() => {
                      setCategoryFilter(category)
                      setOffset(0)
                    }}
                    size="$2"
                    backgroundColor={categoryFilter === category ? '$blue9' : '$gray3'}
                    color={categoryFilter === category ? 'white' : '$gray11'}
                    hoverStyle={{
                      backgroundColor: categoryFilter === category ? '$blue10' : '$gray4',
                    }}
                  >
                    {category === 'all'
                      ? 'All'
                      : category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                )
              )}
            </XStack>
          </YStack>

          <YStack minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Severity
            </Text>
            <XStack gap="$2">
              {['all', 'critical', 'high', 'medium', 'low', 'info'].map((severity) => (
                <Button
                  key={severity}
                  onPress={() => {
                    setSeverityFilter(severity)
                    setOffset(0)
                  }}
                  size="$2"
                  backgroundColor={severityFilter === severity ? '$blue9' : '$gray3'}
                  color={severityFilter === severity ? 'white' : '$gray11'}
                  hoverStyle={{
                    backgroundColor: severityFilter === severity ? '$blue10' : '$gray4',
                  }}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Search Action
            </Text>
            <Input
              placeholder="Search by action..."
              value={actionSearch}
              onChangeText={(text) => {
                setActionSearch(text)
                setOffset(0)
              }}
            />
          </YStack>
        </XStack>
      </Card>

      {/* Audit Log Table */}
      <Card overflow="hidden">
        <YStack>
          {/* Table Header */}
          <XStack backgroundColor="$gray2" paddingHorizontal="$4" paddingVertical="$3">
            <Text width={180} fontSize="$2" fontWeight="500" color="$gray11">
              Timestamp
            </Text>
            <Text width={120} fontSize="$2" fontWeight="500" color="$gray11">
              Category
            </Text>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
              Action
            </Text>
            <Text width={80} fontSize="$2" fontWeight="500" color="$gray11">
              Severity
            </Text>
            <Text width={80} fontSize="$2" fontWeight="500" color="$gray11">
              Status
            </Text>
            <Text width={150} fontSize="$2" fontWeight="500" color="$gray11">
              Resource
            </Text>
          </XStack>

          {/* Table Body */}
          {logs.length === 0 ? (
            <YStack padding="$8" alignItems="center">
              <Text fontSize="$6" color="$gray8" marginBottom="$2">
                No audit events found
              </Text>
              <Text color="$gray11" textAlign="center">
                No CCPA-related events match your current filters.
              </Text>
            </YStack>
          ) : (
            <YStack>
              {logs.map((log) => (
                <XStack
                  key={log.id}
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                  hoverStyle={{ backgroundColor: '$gray2' }}
                  alignItems="center"
                >
                  {/* Timestamp */}
                  <Text width={180} fontSize="$2" color="$gray11">
                    {formatDate(log.createdAt)}
                  </Text>

                  {/* Category */}
                  <XStack width={120} alignItems="center">
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={CATEGORY_COLORS[log.category]?.bg ?? '$gray2'}
                    >
                      <Text
                        fontSize="$1"
                        color={CATEGORY_COLORS[log.category]?.text ?? '$gray11'}
                      >
                        {log.category?.replace(/_/g, ' ')}
                      </Text>
                    </XStack>
                  </XStack>

                  {/* Action */}
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$gray12" fontSize="$2">
                      {log.action?.replace(/_/g, ' ')}
                    </Text>
                    {log.tableName && (
                      <Text fontSize="$1" color="$gray10">
                        Table: {log.tableName}
                      </Text>
                    )}
                  </YStack>

                  {/* Severity */}
                  <XStack width={80} alignItems="center">
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={SEVERITY_COLORS[log.severity]?.bg ?? '$gray2'}
                    >
                      <Text
                        fontSize="$1"
                        color={SEVERITY_COLORS[log.severity]?.text ?? '$gray11'}
                      >
                        {log.severity}
                      </Text>
                    </XStack>
                  </XStack>

                  {/* Status */}
                  <XStack width={80} alignItems="center">
                    {log.status && (
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={STATUS_COLORS[log.status]?.bg ?? '$gray2'}
                      >
                        <Text
                          fontSize="$1"
                          color={STATUS_COLORS[log.status]?.text ?? '$gray11'}
                        >
                          {log.status}
                        </Text>
                      </XStack>
                    )}
                  </XStack>

                  {/* Resource */}
                  <XStack width={150} alignItems="center">
                    <Text fontSize="$2" color="$gray11" numberOfLines={1}>
                      {log.resourceName || log.recordId?.substring(0, 8) || '-'}
                    </Text>
                  </XStack>
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
      </Card>

      {/* Pagination */}
      {totalCount > limit && (
        <XStack justifyContent="space-between" alignItems="center" marginTop="$4">
          <Text color="$gray11" fontSize="$2">
            Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of {totalCount}
          </Text>
          <XStack gap="$2">
            <Button
              size="$2"
              backgroundColor="$gray3"
              color="$gray11"
              hoverStyle={{ backgroundColor: '$gray4' }}
              disabled={currentPage === 1}
              onPress={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Text color="$gray11" paddingHorizontal="$2">
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              size="$2"
              backgroundColor="$gray3"
              color="$gray11"
              hoverStyle={{ backgroundColor: '$gray4' }}
              disabled={currentPage === totalPages}
              onPress={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Text color="$gray11" fontSize="$2">
              Rows per page:
            </Text>
            {[50, 100, 200].map((size) => (
              <Button
                key={size}
                size="$2"
                backgroundColor={limit === size ? '$blue9' : '$gray3'}
                color={limit === size ? 'white' : '$gray11'}
                hoverStyle={{ backgroundColor: limit === size ? '$blue10' : '$gray4' }}
                onPress={() => {
                  setLimit(size)
                  setOffset(0)
                }}
              >
                {size}
              </Button>
            ))}
          </XStack>
        </XStack>
      )}

      {/* Help Text */}
      <Card
        padding="$4"
        marginTop="$6"
        backgroundColor="$blue2"
        borderWidth={1}
        borderColor="$blue6"
      >
        <Text fontWeight="500" color="$blue11" marginBottom="$2">
          About CCPA Audit Log
        </Text>
        <Text color="$blue10" fontSize="$2">
          This audit log tracks all CCPA-related events including privacy requests, data access,
          modifications, and compliance activities. Logs are immutable and retained for 7 years per
          regulatory requirements. Use the filters above to narrow down events, and export for
          reporting purposes.
        </Text>
      </Card>
    </YStack>
  )
}
