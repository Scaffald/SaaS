/**
 * SLA Notification Banner Component
 * SLA notification system for CCPA deadlines
 *
 * Displays a prominent banner on the CCPA dashboard when there are
 * overdue or approaching deadline requests.
 */

import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Row, Text, Button, Card } from '@scaffald/ui'
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
function getAlertColors(level: 'critical' | 'warning' | 'info'): {
  bg: React.CSSProperties
  border: React.CSSProperties
  text: React.CSSProperties
  badge: React.CSSProperties
} {
  const colors = {
    critical: {
      bg: { backgroundColor: 'var(--color-red-3)' },
      border: { borderColor: 'var(--color-red-8)' },
      text: { color: 'var(--color-red-11)' },
      badge: { backgroundColor: 'var(--color-red-9)' },
    },
    warning: {
      bg: { backgroundColor: 'var(--color-orange-3)' },
      border: { borderColor: 'var(--color-orange-8)' },
      text: { color: 'var(--color-orange-11)' },
      badge: { backgroundColor: 'var(--color-orange-9)' },
    },
    info: {
      bg: { backgroundColor: 'var(--color-yellow-3)' },
      border: { borderColor: 'var(--color-yellow-8)' },
      text: { color: 'var(--color-yellow-11)' },
      badge: { backgroundColor: 'var(--color-yellow-9)' },
    },
  }
  return colors[level]
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
  const colors = getAlertColors(alertLevel)

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
      <Row
        style={{
          ...colors.bg,
          borderWidth: 1,
          ...colors.border,
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Row style={{ alignItems: 'center', gap: 8, flex: 1 }}>
          <Row
            style={{
              ...colors.badge,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>
              {slaSummary.escalatedCount + slaSummary.overdueCount}
            </Text>
          </Row>
          <Text style={{ fontSize: 12, ...colors.text, fontWeight: 500 }}>
            {hasEscalated || hasOverdue ? 'Overdue' : 'Approaching deadline'}
          </Text>
        </Row>
        <Button
          size="sm"
          style={{ backgroundColor: 'transparent', ...colors.text }}
          onPress={handleViewOverdue}
        >
          View
        </Button>
      </Row>
    )
  }

  return (
    <Card
      style={{
        ...colors.bg,
        borderWidth: 1,
        ...colors.border,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Stack style={{ flex: 1, gap: 4 }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Row
              style={{
                ...colors.badge,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
                {slaSummary.totalAlerts}
              </Text>
            </Row>
            <Text style={{ fontSize: 16, fontWeight: 600, ...colors.text }}>
              {hasEscalated
                ? 'CCPA Requests Require Immediate Action'
                : hasOverdue
                  ? 'CCPA Requests Are Overdue'
                  : 'CCPA Deadlines Approaching'}
            </Text>
          </Row>

          <Text style={{ fontSize: 14, ...colors.text }}>
            {getAlertMessage()}
          </Text>
        </Stack>

        <Row style={{ gap: 8 }}>
          <Button
            style={{ ...colors.badge, color: 'white' }}
            onPress={handleViewOverdue}
          >
            View Requests
          </Button>
          <Button
            style={{
              backgroundColor: 'transparent',
              ...colors.text,
              borderWidth: 1,
              ...colors.border,
            }}
            onPress={handleDismiss}
          >
            Dismiss
          </Button>
        </Row>
      </Row>
    </Card>
  )
}

export default SLANotificationBanner
