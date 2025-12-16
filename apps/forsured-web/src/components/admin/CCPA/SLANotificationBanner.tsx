/**
 * SLA Notification Banner Component
 * REQ-6, TASK-12: SLA Notification System for CCPA Deadlines
 *
 * Displays a prominent banner on the CCPA dashboard when there are
 * overdue or approaching deadline requests.
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { YStack, XStack, Text, Button, Card } from '@unicornlove/ui'
import { trpc } from '../../../lib/trpc'
import {
  generateSLASummary,
  checkRequestsForAlerts,
  type CCPASLARequest,
  type SLASummary,
} from '../../../lib/ccpa/slaNotifications'

/**
 * Color scheme based on warning level
 */
const ALERT_COLORS = {
  critical: {
    bg: '$red3',
    border: '$red8',
    text: '$red11',
    badge: '$red9',
  },
  warning: {
    bg: '$orange3',
    border: '$orange8',
    text: '$orange11',
    badge: '$orange9',
  },
  info: {
    bg: '$yellow3',
    border: '$yellow8',
    text: '$yellow11',
    badge: '$yellow9',
  },
}

/**
 * Props for SLANotificationBanner
 */
export interface SLANotificationBannerProps {
  /** Optional callback when the banner is dismissed */
  onDismiss?: () => void
  /** Whether to show compact mode (for smaller spaces) */
  compact?: boolean
}

/**
 * SLA Notification Banner
 *
 * Fetches active CCPA requests and displays an alert banner if there are
 * any approaching deadlines or overdue requests.
 */
export function SLANotificationBanner({ onDismiss, compact = false }: SLANotificationBannerProps) {
  const navigate = useNavigate()
  const [isDismissed, setIsDismissed] = useState(false)

  // Fetch active requests to check for SLA alerts
  const { data: requestsData, isLoading } = trpc.ccpaAdmin.listRequests.useQuery(
    {
      // Only get pending and in_progress requests
      status: undefined, // We'll filter client-side
      sortBy: 'deadline_at',
      sortOrder: 'asc',
      limit: 100,
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    }
  )

  // Calculate SLA summary
  const slaSummary: SLASummary | null = useCallback(() => {
    if (!requestsData?.items) return null

    const activeRequests = requestsData.items.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    )

    const slaRequests: CCPASLARequest[] = activeRequests.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      userName: r.user_name,
      type: r.type,
      status: r.status,
      submittedAt: r.created_at,
      deadlineAt: r.deadline_at,
      assignedTo: r.assigned_to,
      assignedEmail: undefined,
    }))

    const alerts = checkRequestsForAlerts(slaRequests)
    return generateSLASummary(alerts)
  }, [requestsData])()

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    onDismiss?.()
  }, [onDismiss])

  const handleViewOverdue = useCallback(() => {
    navigate('/admin/ccpa/requests?status=pending')
  }, [navigate])

  // Don't render if dismissed, loading, or no alerts
  if (isDismissed || isLoading || !slaSummary || slaSummary.totalAlerts === 0) {
    return null
  }

  // Determine alert level and colors
  const hasEscalated = slaSummary.escalatedCount > 0
  const hasOverdue = slaSummary.overdueCount > 0
  const hasUrgent = slaSummary.urgentCount > 0

  const alertLevel = hasEscalated || hasOverdue ? 'critical' : hasUrgent ? 'warning' : 'info'
  const colors = ALERT_COLORS[alertLevel]

  // Build alert message
  const getAlertMessage = (): string => {
    const parts: string[] = []

    if (slaSummary.escalatedCount > 0) {
      parts.push(`${slaSummary.escalatedCount} escalated (5+ days overdue)`)
    }
    if (slaSummary.overdueCount > 0) {
      parts.push(`${slaSummary.overdueCount} overdue`)
    }
    if (slaSummary.urgentCount > 0) {
      parts.push(`${slaSummary.urgentCount} due in 3 days`)
    }
    if (slaSummary.approachingCount > 0) {
      parts.push(`${slaSummary.approachingCount} due in 7 days`)
    }

    return parts.join(' • ')
  }

  if (compact) {
    return (
      <XStack
        backgroundColor={colors.bg}
        borderWidth={1}
        borderColor={colors.border}
        borderRadius="$3"
        paddingHorizontal="$3"
        paddingVertical="$2"
        alignItems="center"
        justifyContent="space-between"
        gap="$2"
      >
        <XStack alignItems="center" gap="$2" flex={1}>
          <XStack
            backgroundColor={colors.badge}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            <Text fontSize="$2" fontWeight="700" color="white">
              {slaSummary.escalatedCount + slaSummary.overdueCount}
            </Text>
          </XStack>
          <Text fontSize="$2" color={colors.text} fontWeight="500">
            {hasEscalated || hasOverdue ? 'Overdue' : 'Approaching deadline'}
          </Text>
        </XStack>
        <Button
          size="$2"
          backgroundColor="transparent"
          color={colors.text}
          hoverStyle={{ backgroundColor: colors.border }}
          onPress={handleViewOverdue}
        >
          View
        </Button>
      </XStack>
    )
  }

  return (
    <Card
      backgroundColor={colors.bg}
      borderWidth={1}
      borderColor={colors.border}
      padding="$4"
      marginBottom="$4"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$4">
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <XStack
              backgroundColor={colors.badge}
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$3"
            >
              <Text fontSize="$4" fontWeight="700" color="white">
                {slaSummary.totalAlerts}
              </Text>
            </XStack>
            <Text fontSize="$5" fontWeight="600" color={colors.text}>
              {hasEscalated
                ? 'CCPA Requests Require Immediate Action'
                : hasOverdue
                  ? 'CCPA Requests Are Overdue'
                  : 'CCPA Deadlines Approaching'}
            </Text>
          </XStack>

          <Text fontSize="$3" color={colors.text}>
            {getAlertMessage()}
          </Text>
        </YStack>

        <XStack gap="$2">
          <Button
            backgroundColor={colors.badge}
            color="white"
            hoverStyle={{ opacity: 0.9 }}
            onPress={handleViewOverdue}
          >
            View Requests
          </Button>
          <Button
            backgroundColor="transparent"
            color={colors.text}
            borderWidth={1}
            borderColor={colors.border}
            hoverStyle={{ backgroundColor: colors.border }}
            onPress={handleDismiss}
          >
            Dismiss
          </Button>
        </XStack>
      </XStack>
    </Card>
  )
}

export default SLANotificationBanner
