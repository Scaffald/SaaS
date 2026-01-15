/**
 * DashboardHeader - Top header bar for dashboard pages
 * Matches Figma design system comps
 * Includes page title, action buttons, and user avatar
 */
import { Row, Stack, Text, Button, Avatar } from '@unicornlove/beyond-ui'
import { Search, MessageCircle, Bell, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface DashboardHeaderProps {
  /**
   * Page title to display
   */
  title?: string
  /**
   * Callback when upgrade plan button is pressed
   */
  onUpgradePress?: () => void
  /**
   * Callback when search is pressed
   */
  onSearchPress?: () => void
  /**
   * Callback when chat is pressed
   */
  onChatPress?: () => void
  /**
   * Callback when notifications are pressed
   */
  onNotificationsPress?: () => void
  /**
   * Number of notifications to display as badge
   */
  notificationCount?: number
}

// Helper to get initials from name
const getInitials = (name: string | undefined | null): string => {
  if (!name) return 'U'
  return (
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  )
}

export default function DashboardHeader({
  title = 'Dashboard',
  onUpgradePress,
  onSearchPress,
  onChatPress,
  onNotificationsPress,
  notificationCount = 0,
}: DashboardHeaderProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress()
    } else {
      // Default behavior - navigate to upgrade page
      navigate('/upgrade')
    }
  }

  const handleSearch = () => {
    if (onSearchPress) {
      onSearchPress()
    }
  }

  const handleChat = () => {
    if (onChatPress) {
      onChatPress()
    }
  }

  const handleNotifications = () => {
    if (onNotificationsPress) {
      onNotificationsPress()
    }
  }

  return (
    <Row
      style={{
        padding: '20px 32px',
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
        {/* Upgrade Plan Button */}
        <Button
          variant="primary"
          size="md"
          iconStart={Sparkles}
          onPress={handleUpgrade}
          style={{
            backgroundColor: 'var(--color-primary-500)',
          }}
        >
          Upgrade plan
        </Button>

        {/* Search Icon */}
        <Button
          variant="ghost"
          size="md"
          iconStart={Search}
          onPress={handleSearch}
          style={{
            minWidth: 40,
            padding: 'var(--space-2)',
          }}
        />

        {/* Chat Icon */}
        <Button
          variant="ghost"
          size="md"
          iconStart={MessageCircle}
          onPress={handleChat}
          style={{
            minWidth: 40,
            padding: 'var(--space-2)',
          }}
        />

        {/* Notifications Icon with Badge */}
        <Stack style={{ position: 'relative' }}>
          <Button
            variant="ghost"
            size="md"
            iconStart={Bell}
            onPress={handleNotifications}
            style={{
              minWidth: 40,
              padding: 'var(--space-2)',
            }}
          />
          {notificationCount > 0 && (
            <Stack
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: 'var(--color-error-500)',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--color-white)',
                }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </Stack>
          )}
        </Stack>

        {/* User Avatar */}
        <Avatar
          initials={getInitials(user?.email)}
          size={40}
          onPress={() => {
            // Could open user menu
          }}
        />
      </Row>
    </Row>
  )
}
