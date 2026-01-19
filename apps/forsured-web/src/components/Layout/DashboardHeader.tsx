/**
 * DashboardHeader - Top header bar for dashboard pages
 * Matches Figma design system comps
 * Includes page title, action buttons, and user avatar
 */
import { Row, Text } from '@unicornlove/beyond-ui'
import { NavIconButton } from '@unicornlove/beyond-ui'
import { Bell } from 'lucide-react'

interface DashboardHeaderProps {
  /**
   * Page title to display
   */
  title?: string
  /**
   * Callback when notifications are pressed
   */
  onNotificationsPress?: () => void
  /**
   * Number of notifications to display as badge
   */
  notificationCount?: number
}

export default function DashboardHeader({
  title = 'Dashboard',
  onNotificationsPress,
  notificationCount = 0,
}: DashboardHeaderProps) {
  const handleNotifications = () => {
    if (onNotificationsPress) {
      onNotificationsPress()
    }
  }

  return (
    <Row
      style={{
        paddingTop: '20px',
        paddingBottom: '20px',
        paddingLeft: 'clamp(24px, 4vw, 48px)', // Responsive: 24-48px based on viewport
        paddingRight: 'clamp(32px, 5vw, 64px)', // Responsive: 32-64px based on viewport
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--color-background)',
        borderBottom: '1px solid var(--color-border)',
        minHeight: 72,
      }}
    >
      {/* Page Title */}
      <Text
        style={{
          fontSize: 'var(--font-size-7)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </Text>

      {/* Action Buttons */}
      <Row style={{ gap: 'var(--space-4)', alignItems: 'center' }}>
        {/* Notifications Icon with Badge */}
        <NavIconButton
          icon={Bell}
          variant="light"
          onPress={handleNotifications}
          badge={notificationCount > 0 ? 'number' : undefined}
          badgeValue={notificationCount > 0 ? notificationCount : undefined}
          showBadge={notificationCount > 0}
          accessibilityLabel="Notifications"
        />
      </Row>
    </Row>
  )
}
