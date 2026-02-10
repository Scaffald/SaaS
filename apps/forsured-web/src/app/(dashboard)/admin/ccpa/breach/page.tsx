/**
 * CCPA Admin Breach Notifications List Page
 * TASK-6: Create Breach Notification Management Pages
 *
 * Lists all breach incidents with:
 * - Severity filtering
 * - 72-hour deadline tracking
 * - Notification status indicators
 * - Quick actions for notification tracking
 */

'use client'

import { useState, useCallback } from 'react'
import { Stack, Row, Text, Button, Card, Heading, Spinner, colors, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Color mappings
const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: colors.error[200], text: colors.error[600] },
  high: { bg: colors.warning[200], text: colors.warning[600] },
  medium: { bg: colors.warning[200], text: colors.warning[600] },
  low: { bg: colors.gray[100], text: colors.text.light.secondary },
}

const REMEDIATION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_started: { bg: colors.gray[100], text: colors.text.light.secondary },
  in_progress: { bg: colors.primary[200], text: colors.primary[600] },
  completed: { bg: colors.success[200], text: colors.success[600] },
  ongoing_monitoring: { bg: colors.purple[200], text: colors.purple[600] },
}

const BREACH_TYPE_LABELS: Record<string, string> = {
  unauthorized_access: 'Unauthorized Access',
  data_exfiltration: 'Data Exfiltration',
  ransomware: 'Ransomware',
  insider_threat: 'Insider Threat',
  lost_device: 'Lost Device',
  misconfiguration: 'Misconfiguration',
  third_party_breach: 'Third Party Breach',
  other: 'Other',
}

export default function CCPABreachListPage() {
  const router = useRouter()

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [notificationFilter, setNotificationFilter] = useState<string>('all')

  // Fetch breaches
  const {
    data: breachesData,
    isLoading,
    error,
    refetch,
  } = trpc.ccpaAdmin.listBreaches.useQuery(
    {
      severity:
        severityFilter !== 'all'
          ? (severityFilter as 'critical' | 'high' | 'medium' | 'low')
          : undefined,
      notificationRequired: notificationFilter === 'required' ? true : undefined,
    },
    { refetchInterval: 30000 }
  )

  // Helpers
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  const getDeadlineStatus = useCallback((hoursToDeadline: number | null, notificationSent: boolean) => {
    if (notificationSent) return { color: colors.success[600], text: 'Notified' }
    if (hoursToDeadline === null) return { color: colors.text.light.secondary, text: 'N/A' }
    if (hoursToDeadline < 0) return { color: colors.error[600], text: `${Math.abs(hoursToDeadline)}h overdue` }
    if (hoursToDeadline <= 24) return { color: colors.error[600], text: `${hoursToDeadline}h remaining` }
    if (hoursToDeadline <= 48) return { color: colors.warning[600], text: `${hoursToDeadline}h remaining` }
    return { color: colors.success[600], text: `${hoursToDeadline}h remaining` }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
        <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Spinner size="lg" />
          <Text color={colors.text.light.secondary} style={{ marginTop: spacing[16] }}>
            Loading breach incidents...
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
            Error loading breach incidents
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

  const breaches = breachesData?.items ?? []
  const totalCount = breachesData?.totalCount ?? 0

  // Summary stats
  const criticalCount = breaches.filter((b) => b.severity === 'critical').length
  const pendingNotificationCount = breaches.filter(
    (b) => b.notificationRequired && !b.userNotificationSent
  ).length
  const overdueCount = breaches.filter(
    (b) => b.hoursToDeadline !== null && b.hoursToDeadline < 0 && !b.userNotificationSent
  ).length

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Heading level={2} style={{ marginBottom: spacing[8] }}>Breach Notifications</Heading>
          <Text color={colors.text.light.secondary}>
            {totalCount} total incident{totalCount !== 1 ? 's' : ''} tracked
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
            color="error"
            variant="filled"
            onPress={() => router.push('/admin/ccpa/breach/new')}
          >
            Report New Breach
          </Button>
        </Row>
      </Row>

      {/* Summary Stats */}
      <Row gap={spacing[16]} style={{ marginBottom: spacing[24], flexWrap: 'wrap' }}>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
          <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
            Total Incidents
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.primary}>
            {totalCount}
          </Text>
        </Card>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 180, backgroundColor: colors.error[200] }}>
          <Text color={colors.error[600]} size="xs" style={{ marginBottom: spacing[4] }}>
            Critical Severity
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.error[600]}>
            {criticalCount}
          </Text>
        </Card>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 180, backgroundColor: colors.warning[200] }}>
          <Text color={colors.warning[600]} size="xs" style={{ marginBottom: spacing[4] }}>
            Pending Notification
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.warning[600]}>
            {pendingNotificationCount}
          </Text>
        </Card>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 180, backgroundColor: colors.error[200] }}>
          <Text color={colors.error[600]} size="xs" style={{ marginBottom: spacing[4] }}>
            Overdue (72h)
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.error[600]}>
            {overdueCount}
          </Text>
        </Card>
      </Row>

      {/* Filters */}
      <Card style={{ padding: spacing[16], marginBottom: spacing[16] }}>
        <Row style={{ flexWrap: 'wrap', gap: spacing[16], alignItems: 'flex-end' }}>
          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Severity
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                <Button
                  key={severity}
                  onPress={() => setSeverityFilter(severity)}
                  size="xs"
                  color={severityFilter === severity ? 'primary' : 'gray'}
                  variant={severityFilter === severity ? 'filled' : 'outline'}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))}
            </Row>
          </Stack>

          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Notification Status
            </Text>
            <Row gap={spacing[8]}>
              <Button
                onPress={() => setNotificationFilter('all')}
                size="xs"
                color={notificationFilter === 'all' ? 'primary' : 'gray'}
                variant={notificationFilter === 'all' ? 'filled' : 'outline'}
              >
                All
              </Button>
              <Button
                onPress={() => setNotificationFilter('required')}
                size="xs"
                color={notificationFilter === 'required' ? 'primary' : 'gray'}
                variant={notificationFilter === 'required' ? 'filled' : 'outline'}
              >
                Notification Required
              </Button>
            </Row>
          </Stack>
        </Row>
      </Card>

      {/* Breaches Table */}
      <Card style={{ overflow: 'hidden' }}>
        <Stack>
          {/* Table Header */}
          <Row style={{ backgroundColor: colors.gray[100], paddingHorizontal: spacing[16], paddingVertical: spacing[12] }}>
            <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              ID
            </Text>
            <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Type
            </Text>
            <Text style={{ width: 100 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Severity
            </Text>
            <Text style={{ width: 100 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Affected
            </Text>
            <Text style={{ width: 150 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              72h Deadline
            </Text>
            <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Remediation
            </Text>
            <Text style={{ width: 150 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Discovered
            </Text>
            <Text style={{ width: 100 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Actions
            </Text>
          </Row>

          {/* Table Body */}
          {breaches.length === 0 ? (
            <Stack style={{ padding: spacing[32], alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }} color={colors.gray[300]} style={{ marginBottom: spacing[8] }}>
                No breach incidents found
              </Text>
              <Text color={colors.text.light.secondary} style={{ textAlign: 'center' }}>
                No breach incidents match your current filters.
              </Text>
            </Stack>
          ) : (
            <Stack>
              {breaches.map((breach) => {
                const deadlineStatus = getDeadlineStatus(
                  breach.hoursToDeadline,
                  breach.userNotificationSent
                )
                return (
                  <Row
                    key={breach.id}
                    style={{
                      backgroundColor:
                        breach.hoursToDeadline !== null &&
                        breach.hoursToDeadline < 0 &&
                        !breach.userNotificationSent
                          ? colors.error[200]
                          : 'transparent',
                      paddingHorizontal: spacing[16],
                      paddingVertical: spacing[12],
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.light.default,
                      alignItems: 'center',
                    }}
                  >
                    {/* ID */}
                    <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.primary[600]}>
                      {breach.breachNumber}
                    </Text>

                    {/* Type */}
                    <Stack style={{ flex: 1 }}>
                      <Text weight="medium" color={colors.text.light.primary}>
                        {BREACH_TYPE_LABELS[breach.breachType] ?? breach.breachType}
                      </Text>
                      <Text size="xs" color={colors.text.light.secondary}>
                        {breach.dataTypesExposed?.slice(0, 3).join(', ')}
                        {(breach.dataTypesExposed?.length ?? 0) > 3 ? '...' : ''}
                      </Text>
                    </Stack>

                    {/* Severity */}
                    <Row style={{ width: 100, alignItems: 'center' }}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: SEVERITY_COLORS[breach.severity]?.bg ?? colors.gray[100],
                        }}
                      >
                        <Text
                          size="xs"
                          weight="medium"
                          color={SEVERITY_COLORS[breach.severity]?.text ?? colors.text.light.secondary}
                        >
                          {breach.severity.toUpperCase()}
                        </Text>
                      </Row>
                    </Row>

                    {/* Affected */}
                    <Stack style={{ width: 100 }}>
                      <Text size="xs" weight="medium" color={colors.text.light.primary}>
                        {breach.affectedUserCount} users
                      </Text>
                      <Text size="xs" color={colors.text.light.secondary}>
                        {breach.affectedCaliforniaResidents} CA
                      </Text>
                    </Stack>

                    {/* 72h Deadline */}
                    <Row style={{ width: 150, alignItems: 'center' }}>
                      {breach.notificationRequired ? (
                        <Text size="xs" weight="medium" color={deadlineStatus.color}>
                          {deadlineStatus.text}
                        </Text>
                      ) : (
                        <Text size="xs" color={colors.text.light.secondary}>
                          Not required
                        </Text>
                      )}
                    </Row>

                    {/* Remediation */}
                    <Row style={{ width: 120, alignItems: 'center' }}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor:
                            REMEDIATION_STATUS_COLORS[breach.remediationStatus ?? 'not_started']?.bg ??
                            colors.gray[100],
                        }}
                      >
                        <Text
                          size="xs"
                          color={
                            REMEDIATION_STATUS_COLORS[breach.remediationStatus ?? 'not_started']
                              ?.text ?? colors.text.light.secondary
                          }
                        >
                          {(breach.remediationStatus ?? 'not_started').replace(/_/g, ' ')}
                        </Text>
                      </Row>
                    </Row>

                    {/* Discovered */}
                    <Row style={{ width: 150, alignItems: 'center' }}>
                      <Text size="xs" color={colors.text.light.secondary}>
                        {formatDate(breach.discoveredAt)}
                      </Text>
                    </Row>

                    {/* Actions */}
                    <Row style={{ width: 100, alignItems: 'center' }}>
                      <Button
                        size="xs"
                        color="primary"
                        variant="filled"
                        onPress={() => router.push(`/admin/ccpa/breach/${breach.id}`)}
                      >
                        View
                      </Button>
                    </Row>
                  </Row>
                )
              })}
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Help Text */}
      <Card
        style={{
          padding: spacing[16],
          marginTop: spacing[24],
          backgroundColor: colors.warning[200],
          borderWidth: 1,
          borderColor: colors.warning[400],
        }}
      >
        <Heading level={3} style={{ marginBottom: spacing[8] }} color={colors.warning[600]}>
          CCPA 72-Hour Notification Requirement
        </Heading>
        <Text color={colors.warning[500]} size="xs">
          Under CCPA, if a data breach affects more than 500 California residents, you must notify:
        </Text>
        <Stack style={{ marginTop: spacing[8] }} gap={spacing[4]}>
          <Text color={colors.warning[500]} size="xs">
            - Affected users within 72 hours of discovery
          </Text>
          <Text color={colors.warning[500]} size="xs">
            - California Attorney General if &gt;500 CA residents affected
          </Text>
          <Text color={colors.warning[500]} size="xs">
            - Law enforcement if criminal activity suspected
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}
