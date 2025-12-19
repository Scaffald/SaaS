/**
 * REQ-6: CCPA Admin Breach Notifications List Page
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
import { YStack, XStack, Text, Button, Card, H2, H3, Spinner } from '@unicornlove/ui'
import { useRouter } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Color mappings
const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '$red2', text: '$red11' },
  high: { bg: '$orange2', text: '$orange11' },
  medium: { bg: '$yellow2', text: '$yellow11' },
  low: { bg: '$gray2', text: '$gray11' },
}

const REMEDIATION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_started: { bg: '$gray2', text: '$gray11' },
  in_progress: { bg: '$blue2', text: '$blue11' },
  completed: { bg: '$green2', text: '$green11' },
  ongoing_monitoring: { bg: '$purple2', text: '$purple11' },
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
    if (notificationSent) return { color: '$green11', text: 'Notified' }
    if (hoursToDeadline === null) return { color: '$gray11', text: 'N/A' }
    if (hoursToDeadline < 0) return { color: '$red11', text: `${Math.abs(hoursToDeadline)}h overdue` }
    if (hoursToDeadline <= 24) return { color: '$red11', text: `${hoursToDeadline}h remaining` }
    if (hoursToDeadline <= 48) return { color: '$orange11', text: `${hoursToDeadline}h remaining` }
    return { color: '$green11', text: `${hoursToDeadline}h remaining` }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$gray11" marginTop="$4">
            Loading breach incidents...
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
            Error loading breach incidents
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
    <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H2 marginBottom="$2">Breach Notifications</H2>
          <Text color="$gray11">
            {totalCount} total incident{totalCount !== 1 ? 's' : ''} tracked
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
            backgroundColor="$red9"
            color="white"
            hoverStyle={{ backgroundColor: '$red10' }}
            onPress={() => router.push('/admin/ccpa/breach/new')}
          >
            Report New Breach
          </Button>
        </XStack>
      </XStack>

      {/* Summary Stats */}
      <XStack gap="$4" marginBottom="$6" flexWrap="wrap">
        <Card padding="$4" flex={1} minWidth={180}>
          <Text color="$gray11" fontSize="$2" marginBottom="$1">
            Total Incidents
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$gray12">
            {totalCount}
          </Text>
        </Card>
        <Card padding="$4" flex={1} minWidth={180} backgroundColor="$red2">
          <Text color="$red11" fontSize="$2" marginBottom="$1">
            Critical Severity
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$red11">
            {criticalCount}
          </Text>
        </Card>
        <Card padding="$4" flex={1} minWidth={180} backgroundColor="$orange2">
          <Text color="$orange11" fontSize="$2" marginBottom="$1">
            Pending Notification
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$orange11">
            {pendingNotificationCount}
          </Text>
        </Card>
        <Card padding="$4" flex={1} minWidth={180} backgroundColor="$red2">
          <Text color="$red11" fontSize="$2" marginBottom="$1">
            Overdue (72h)
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$red11">
            {overdueCount}
          </Text>
        </Card>
      </XStack>

      {/* Filters */}
      <Card padding="$4" marginBottom="$4">
        <XStack flexWrap="wrap" gap="$4" alignItems="flex-end">
          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Severity
            </Text>
            <XStack gap="$2">
              {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                <Button
                  key={severity}
                  onPress={() => setSeverityFilter(severity)}
                  size="$2"
                  backgroundColor={severityFilter === severity ? '$blue9' : '$gray3'}
                  color={severityFilter === severity ? 'white' : '$gray11'}
                  hoverStyle={{ backgroundColor: severityFilter === severity ? '$blue10' : '$gray4' }}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Notification Status
            </Text>
            <XStack gap="$2">
              <Button
                onPress={() => setNotificationFilter('all')}
                size="$2"
                backgroundColor={notificationFilter === 'all' ? '$blue9' : '$gray3'}
                color={notificationFilter === 'all' ? 'white' : '$gray11'}
                hoverStyle={{ backgroundColor: notificationFilter === 'all' ? '$blue10' : '$gray4' }}
              >
                All
              </Button>
              <Button
                onPress={() => setNotificationFilter('required')}
                size="$2"
                backgroundColor={notificationFilter === 'required' ? '$blue9' : '$gray3'}
                color={notificationFilter === 'required' ? 'white' : '$gray11'}
                hoverStyle={{ backgroundColor: notificationFilter === 'required' ? '$blue10' : '$gray4' }}
              >
                Notification Required
              </Button>
            </XStack>
          </YStack>
        </XStack>
      </Card>

      {/* Breaches Table */}
      <Card overflow="hidden">
        <YStack>
          {/* Table Header */}
          <XStack backgroundColor="$gray2" paddingHorizontal="$4" paddingVertical="$3">
            <Text width={120} fontSize="$2" fontWeight="500" color="$gray11">
              ID
            </Text>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
              Type
            </Text>
            <Text width={100} fontSize="$2" fontWeight="500" color="$gray11">
              Severity
            </Text>
            <Text width={100} fontSize="$2" fontWeight="500" color="$gray11">
              Affected
            </Text>
            <Text width={150} fontSize="$2" fontWeight="500" color="$gray11">
              72h Deadline
            </Text>
            <Text width={120} fontSize="$2" fontWeight="500" color="$gray11">
              Remediation
            </Text>
            <Text width={150} fontSize="$2" fontWeight="500" color="$gray11">
              Discovered
            </Text>
            <Text width={100} fontSize="$2" fontWeight="500" color="$gray11">
              Actions
            </Text>
          </XStack>

          {/* Table Body */}
          {breaches.length === 0 ? (
            <YStack padding="$8" alignItems="center">
              <Text fontSize="$6" color="$gray8" marginBottom="$2">
                No breach incidents found
              </Text>
              <Text color="$gray11" textAlign="center">
                No breach incidents match your current filters.
              </Text>
            </YStack>
          ) : (
            <YStack>
              {breaches.map((breach) => {
                const deadlineStatus = getDeadlineStatus(
                  breach.hoursToDeadline,
                  breach.userNotificationSent
                )
                return (
                  <XStack
                    key={breach.id}
                    backgroundColor={
                      breach.hoursToDeadline !== null &&
                      breach.hoursToDeadline < 0 &&
                      !breach.userNotificationSent
                        ? '$red2'
                        : 'transparent'
                    }
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                    hoverStyle={{ backgroundColor: '$gray2' }}
                    alignItems="center"
                  >
                    {/* ID */}
                    <Text width={120} fontSize="$2" fontWeight="500" color="$blue11">
                      {breach.breachNumber}
                    </Text>

                    {/* Type */}
                    <YStack flex={1}>
                      <Text fontWeight="500" color="$gray12">
                        {BREACH_TYPE_LABELS[breach.breachType] ?? breach.breachType}
                      </Text>
                      <Text fontSize="$1" color="$gray11">
                        {breach.dataTypesExposed?.slice(0, 3).join(', ')}
                        {(breach.dataTypesExposed?.length ?? 0) > 3 ? '...' : ''}
                      </Text>
                    </YStack>

                    {/* Severity */}
                    <XStack width={100} alignItems="center">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={SEVERITY_COLORS[breach.severity]?.bg ?? '$gray2'}
                      >
                        <Text
                          fontSize="$2"
                          fontWeight="500"
                          color={SEVERITY_COLORS[breach.severity]?.text ?? '$gray11'}
                        >
                          {breach.severity.toUpperCase()}
                        </Text>
                      </XStack>
                    </XStack>

                    {/* Affected */}
                    <YStack width={100}>
                      <Text fontSize="$2" fontWeight="500" color="$gray12">
                        {breach.affectedUserCount} users
                      </Text>
                      <Text fontSize="$1" color="$gray11">
                        {breach.affectedCaliforniaResidents} CA
                      </Text>
                    </YStack>

                    {/* 72h Deadline */}
                    <XStack width={150} alignItems="center">
                      {breach.notificationRequired ? (
                        <Text fontSize="$2" fontWeight="500" color={deadlineStatus.color}>
                          {deadlineStatus.text}
                        </Text>
                      ) : (
                        <Text fontSize="$2" color="$gray11">
                          Not required
                        </Text>
                      )}
                    </XStack>

                    {/* Remediation */}
                    <XStack width={120} alignItems="center">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={
                          REMEDIATION_STATUS_COLORS[breach.remediationStatus ?? 'not_started']?.bg ??
                          '$gray2'
                        }
                      >
                        <Text
                          fontSize="$2"
                          color={
                            REMEDIATION_STATUS_COLORS[breach.remediationStatus ?? 'not_started']
                              ?.text ?? '$gray11'
                          }
                        >
                          {(breach.remediationStatus ?? 'not_started').replace(/_/g, ' ')}
                        </Text>
                      </XStack>
                    </XStack>

                    {/* Discovered */}
                    <XStack width={150} alignItems="center">
                      <Text fontSize="$2" color="$gray11">
                        {formatDate(breach.discoveredAt)}
                      </Text>
                    </XStack>

                    {/* Actions */}
                    <XStack width={100} alignItems="center">
                      <Button
                        size="$2"
                        backgroundColor="$blue9"
                        color="white"
                        hoverStyle={{ backgroundColor: '$blue10' }}
                        onPress={() => router.push(`/admin/ccpa/breach/${breach.id}`)}
                      >
                        View
                      </Button>
                    </XStack>
                  </XStack>
                )
              })}
            </YStack>
          )}
        </YStack>
      </Card>

      {/* Help Text */}
      <Card
        padding="$4"
        marginTop="$6"
        backgroundColor="$orange2"
        borderWidth={1}
        borderColor="$orange6"
      >
        <H3 marginBottom="$2" color="$orange11">
          CCPA 72-Hour Notification Requirement
        </H3>
        <Text color="$orange10" fontSize="$2">
          Under CCPA, if a data breach affects more than 500 California residents, you must notify:
        </Text>
        <YStack marginTop="$2" gap="$1">
          <Text color="$orange10" fontSize="$2">
            - Affected users within 72 hours of discovery
          </Text>
          <Text color="$orange10" fontSize="$2">
            - California Attorney General if &gt;500 CA residents affected
          </Text>
          <Text color="$orange10" fontSize="$2">
            - Law enforcement if criminal activity suspected
          </Text>
        </YStack>
      </Card>
    </YStack>
  )
}
