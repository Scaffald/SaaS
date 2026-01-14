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
import { Stack, Row, Text, Button, Card, Heading, Input, Spinner, colors, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Color mappings
const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: colors.error[200], text: colors.error[600] },
  high: { bg: colors.warning[200], text: colors.warning[600] },
  medium: { bg: colors.warning[200], text: colors.warning[600] },
  low: { bg: colors.success[200], text: colors.success[600] },
  info: { bg: colors.gray[100], text: colors.text.light.secondary },
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  compliance: { bg: colors.primary[200], text: colors.primary[600] },
  security: { bg: colors.error[200], text: colors.error[600] },
  data_access: { bg: colors.success[200], text: colors.success[600] },
  data_modification: { bg: colors.warning[200], text: colors.warning[600] },
  authentication: { bg: colors.purple[200], text: colors.purple[600] },
  authorization: { bg: colors.info[200], text: colors.info[600] },
  admin: { bg: colors.warning[200], text: colors.warning[600] },
  system: { bg: colors.gray[100], text: colors.text.light.secondary },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  success: { bg: colors.success[200], text: colors.success[600] },
  failure: { bg: colors.error[200], text: colors.error[600] },
  partial: { bg: colors.warning[200], text: colors.warning[600] },
  denied: { bg: colors.warning[200], text: colors.warning[600] },
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
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
        <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Spinner size="lg" />
          <Text color={colors.text.light.secondary} style={{ marginTop: spacing[16] }}>
            Loading audit log...
          </Text>
        </Stack>
      </Stack>
    )
  }

  // Error state
  if (error) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
        <Stack
          style={{
            padding: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
            borderRadius: spacing[16],
          }}
        >
          <Text weight="semibold" color={colors.error[600]}>
            Error loading audit log
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            style={{ marginTop: spacing[12] }}
            size="sm"
            color="error"
            variant="filled"
            onPress={() => refetch()}
          >
            Retry
          </Button>
        </Stack>
      </Stack>
    )
  }

  const logs = logsData?.items ?? []
  const totalCount = logsData?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Heading level={2} style={{ marginBottom: spacing[8] }}>CCPA Audit Log</Heading>
          <Text color={colors.text.light.secondary}>
            {totalCount} event{totalCount !== 1 ? 's' : ''} in the last 30 days
          </Text>
        </Stack>
        <Row gap={spacing[8]}>
          <Button
            variant="outline"
            color="gray"
            onPress={() => router.push('/admin/ccpa')}
          >
            Back to Dashboard
          </Button>
          <Button
            color="primary"
            variant="filled"
            onPress={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            color="gray"
            onPress={() => handleExport('json')}
          >
            Export JSON
          </Button>
        </Row>
      </Row>

      {/* Summary Stats */}
      {statsData && (
        <Row gap={spacing[16]} style={{ marginBottom: spacing[24], flexWrap: 'wrap' }}>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
            <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
              Total Events (30d)
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.primary}>
              {statsData.totalEvents}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180, backgroundColor: colors.error[200] }}>
            <Text color={colors.error[600]} size="xs" style={{ marginBottom: spacing[4] }}>
              Security Events
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.error[600]}>
              {statsData.securityEvents}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180, backgroundColor: colors.warning[200] }}>
            <Text color={colors.warning[600]} size="xs" style={{ marginBottom: spacing[4] }}>
              Failed Events
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.warning[600]}>
              {statsData.failedEvents}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
            <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
              Compliance Events
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.primary[600]}>
              {statsData.categoryBreakdown?.compliance ?? 0}
            </Text>
          </Card>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ padding: spacing[16], marginBottom: spacing[16] }}>
        <Heading level={3} style={{ marginBottom: spacing[12] }}>Filters</Heading>
        <Row style={{ flexWrap: 'wrap', gap: spacing[16], alignItems: 'flex-end' }}>
          <Stack style={{ minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Category
            </Text>
            <Row gap={spacing[8]} style={{ flexWrap: 'wrap' }}>
              {['all', 'compliance', 'security', 'data_access', 'data_modification'].map(
                (category) => (
                  <Button
                    key={category}
                    onPress={() => {
                      setCategoryFilter(category)
                      setOffset(0)
                    }}
                    size="xs"
                    color={categoryFilter === category ? 'primary' : 'gray'}
                    variant={categoryFilter === category ? 'filled' : 'outline'}
                  >
                    {category === 'all'
                      ? 'All'
                      : category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                )
              )}
            </Row>
          </Stack>

          <Stack style={{ minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Severity
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'critical', 'high', 'medium', 'low', 'info'].map((severity) => (
                <Button
                  key={severity}
                  onPress={() => {
                    setSeverityFilter(severity)
                    setOffset(0)
                  }}
                  size="xs"
                  color={severityFilter === severity ? 'primary' : 'gray'}
                  variant={severityFilter === severity ? 'filled' : 'outline'}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))}
            </Row>
          </Stack>

          <Stack style={{ flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
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
          </Stack>
        </Row>
      </Card>

      {/* Audit Log Table */}
      <Card style={{ overflow: 'hidden' }}>
        <Stack>
          {/* Table Header */}
          <Row style={{ backgroundColor: colors.gray[100], paddingHorizontal: spacing[16], paddingVertical: spacing[12] }}>
            <Text style={{ width: 180 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Timestamp
            </Text>
            <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Category
            </Text>
            <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Action
            </Text>
            <Text style={{ width: 80 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Severity
            </Text>
            <Text style={{ width: 80 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Status
            </Text>
            <Text style={{ width: 150 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Resource
            </Text>
          </Row>

          {/* Table Body */}
          {logs.length === 0 ? (
            <Stack style={{ padding: spacing[32], alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }} color={colors.gray[300]} style={{ marginBottom: spacing[8] }}>
                No audit events found
              </Text>
              <Text color={colors.text.light.secondary} style={{ textAlign: 'center' }}>
                No CCPA-related events match your current filters.
              </Text>
            </Stack>
          ) : (
            <Stack>
              {logs.map((log) => (
                <Row
                  key={log.id}
                  style={{
                    paddingHorizontal: spacing[16],
                    paddingVertical: spacing[12],
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.light.default,
                    alignItems: 'center',
                  }}
                >
                  {/* Timestamp */}
                  <Text style={{ width: 180 }} size="xs" color={colors.text.light.secondary}>
                    {formatDate(log.createdAt)}
                  </Text>

                  {/* Category */}
                  <Row style={{ width: 120, alignItems: 'center' }}>
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: 8,
                        backgroundColor: CATEGORY_COLORS[log.category]?.bg ?? colors.gray[100],
                      }}
                    >
                      <Text
                        size="xs"
                        color={CATEGORY_COLORS[log.category]?.text ?? colors.text.light.secondary}
                      >
                        {log.category?.replace(/_/g, ' ')}
                      </Text>
                    </Row>
                  </Row>

                  {/* Action */}
                  <Stack style={{ flex: 1 }}>
                    <Text weight="medium" color={colors.text.light.primary} size="xs">
                      {log.action?.replace(/_/g, ' ')}
                    </Text>
                    {log.tableName && (
                      <Text size="xs" color={colors.text.light.tertiary}>
                        Table: {log.tableName}
                      </Text>
                    )}
                  </Stack>

                  {/* Severity */}
                  <Row style={{ width: 80, alignItems: 'center' }}>
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: 8,
                        backgroundColor: SEVERITY_COLORS[log.severity]?.bg ?? colors.gray[100],
                      }}
                    >
                      <Text
                        size="xs"
                        color={SEVERITY_COLORS[log.severity]?.text ?? colors.text.light.secondary}
                      >
                        {log.severity}
                      </Text>
                    </Row>
                  </Row>

                  {/* Status */}
                  <Row style={{ width: 80, alignItems: 'center' }}>
                    {log.status && (
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: STATUS_COLORS[log.status]?.bg ?? colors.gray[100],
                        }}
                      >
                        <Text
                          size="xs"
                          color={STATUS_COLORS[log.status]?.text ?? colors.text.light.secondary}
                        >
                          {log.status}
                        </Text>
                      </Row>
                    )}
                  </Row>

                  {/* Resource */}
                  <Row style={{ width: 150, alignItems: 'center' }}>
                    <Text size="xs" color={colors.text.light.secondary} style={{ numberOfLines: 1 }}>
                      {log.resourceName || log.recordId?.substring(0, 8) || '-'}
                    </Text>
                  </Row>
                </Row>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Pagination */}
      {totalCount > limit && (
        <Row justifyContent="space-between" alignItems="center" style={{ marginTop: spacing[16] }}>
          <Text color={colors.text.light.secondary} size="xs">
            Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of {totalCount}
          </Text>
          <Row gap={spacing[8]}>
            <Button
              size="xs"
              variant="outline"
              color="gray"
              disabled={currentPage === 1}
              onPress={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Text color={colors.text.light.secondary} style={{ paddingHorizontal: spacing[8] }}>
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              size="xs"
              variant="outline"
              color="gray"
              disabled={currentPage === totalPages}
              onPress={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </Row>
          <Row gap={spacing[8]} alignItems="center">
            <Text color={colors.text.light.secondary} size="xs">
              Rows per page:
            </Text>
            {[50, 100, 200].map((size) => (
              <Button
                key={size}
                size="xs"
                color={limit === size ? 'primary' : 'gray'}
                variant={limit === size ? 'filled' : 'outline'}
                onPress={() => {
                  setLimit(size)
                  setOffset(0)
                }}
              >
                {size}
              </Button>
            ))}
          </Row>
        </Row>
      )}

      {/* Help Text */}
      <Card
        style={{
          padding: spacing[16],
          marginTop: spacing[24],
          backgroundColor: colors.info[200],
          borderWidth: 1,
          borderColor: colors.info[400],
        }}
      >
        <Text weight="medium" color={colors.info[600]} style={{ marginBottom: spacing[8] }}>
          About CCPA Audit Log
        </Text>
        <Text color={colors.info[500]} size="xs">
          This audit log tracks all CCPA-related events including privacy requests, data access,
          modifications, and compliance activities. Logs are immutable and retained for 7 years per
          regulatory requirements. Use the filters above to narrow down events, and export for
          reporting purposes.
        </Text>
      </Card>
    </Stack>
  )
}
