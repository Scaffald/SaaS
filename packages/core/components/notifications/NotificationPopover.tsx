import { Popover } from './popovers/Popover'
import { AlertCircle, Bell, Info, ShieldAlert, X } from '@tamagui/lucide-icons'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import { type ElementRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  ScrollView,
  Separator,
  Spinner,
  type StackProps,
  Text,
  type TextProps,
  XStack,
  YStack,
} from 'tamagui'

export interface NotificationItem {
  id: string
  type: string
  severity: 'info' | 'important' | 'critical'
  title: string
  preview: string
  createdAt: string
  read: boolean
  ctaUrl?: string | null
  ctaLabel?: string | null
  channels: string[]
  metadata?: {
    notification_type?: string
    site_id?: string
    overlapping_site_id?: string
    overlap_percent?: number
    threshold?: number
    [key: string]: unknown
  } | null
}

type ButtonRef = ElementRef<typeof Button>

const SEVERITY_PILL_STYLES = {
  critical: { bg: '$red4', color: '$red11' },
  important: { bg: '$yellow4', color: '$yellow11' },
  info: { bg: '$blue4', color: '$blue11' },
} as const satisfies Record<
  NotificationItem['severity'],
  { bg: StackProps['bg']; color: TextProps['color'] }
>

interface PillProps {
  label: string
  bg: StackProps['bg']
  color: TextProps['color']
}

const CHANNEL_PILL_STYLE = {
  bg: '$color3',
  color: '$color11',
} as const satisfies Pick<PillProps, 'bg' | 'color'>

function Pill({ label, bg, color }: PillProps) {
  return (
    <XStack bg={bg} px="$2" py="$1" rounded="$3" items="center">
      <Text fontSize="$1" fontWeight="600" color={color}>
        {label}
      </Text>
    </XStack>
  )
}

interface NotificationPopoverProps {
  /**
   * Array of notifications to display
   */
  notifications: NotificationItem[]
  /**
   * Unread count to display on badge
   */
  unreadCount: number
  /**
   * Loading state
   */
  isLoading?: boolean
  /**
   * Callback when notification is clicked
   */
  onNotificationClick?: (notification: NotificationItem) => void
  /**
   * Callback to mark notification as read
   */
  onMarkAsRead?: (notificationId: string) => void
}

/**
 * Format relative time (e.g., "2 hours ago", "1 day ago")
 */
function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  const years = Math.floor(diffDays / 365)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(severity: NotificationItem['severity']) {
  switch (severity) {
    case 'critical':
      return ShieldAlert
    case 'important':
      return AlertCircle
    default:
      return Info
  }
}

/**
 * Get notification color based on type
 */
function getNotificationColor(severity: NotificationItem['severity']) {
  switch (severity) {
    case 'critical':
      return '$red10'
    case 'important':
      return '$orange10'
    default:
      return '$blue10'
  }
}

/**
 * NotificationPopover component
 * Displays notifications in a popover from the header bell icon
 * Replaces the previous NotificationsActionSheet component
 */
export function NotificationPopover({
  notifications,
  unreadCount,
  isLoading = false,
  onNotificationClick,
  onMarkAsRead,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const triggerRef = useRef<ButtonRef>(null)

  // Separate notifications into unread and read
  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: NotificationItem) => {
      // Mark as read if unread
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification.id)
      }

      // Call custom handler if provided
      if (onNotificationClick) {
        onNotificationClick(notification)
      }

      // Navigate to destination if provided
      if (notification.ctaUrl) {
        router.push(notification.ctaUrl as Href)
      }

      // Close popover
      setOpen(false)
    },
    [onNotificationClick, onMarkAsRead, router]
  )

  // Handle escape key to close
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        // Return focus to trigger
        triggerRef.current?.focus?.()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  // Handle click outside to close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && triggerRef.current) {
      // Return focus to trigger when closing
      setTimeout(() => {
        triggerRef.current?.focus?.()
      }, 100)
    }
  }, [])

  return (
    <Popover placement="bottom-end" open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <Button
          ref={triggerRef}
          borderStyle="unset"
          borderWidth={0}
          bg="transparent"
          height={30}
          position="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          onPress={() => setOpen(!open)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <YStack
              position="absolute"
              t={-4}
              r={-4}
              bg="$red9"
              rounded="$10"
              px="$2"
              py="$1"
              minW={20}
              items="center"
              justify="center"
              style={{ zIndex: 1 }}
            >
              <Text fontSize="$1" fontWeight="600" color="white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </YStack>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Content
        role="menu"
        aria-labelledby="notifications-title"
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
        exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
      >
        {/* Header */}
        <XStack
          justify="space-between"
          items="center"
          p="$4"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <XStack items="center" gap="$3">
            <Bell size={20} color="$color11" />
            <Text id="notifications-title" fontSize="$5" fontWeight="700" color="$color12">
              Notifications
            </Text>
          </XStack>
          <XStack>
            <Button
              size="$2"
              circular
              icon={X}
              onPress={() => handleOpenChange(false)}
              bg="transparent"
              borderWidth={0}
              aria-label="Close notifications"
            />
          </XStack>
        </XStack>

        {/* Content */}
        {isLoading ? (
          <YStack p="$4" items="center" gap="$3">
            <Spinner size="small" color="$color10" />
            <Text color="$color11">Loading notifications...</Text>
          </YStack>
        ) : notifications.length === 0 ? (
          <YStack p="$4" items="center" gap="$3">
            <Bell size={32} color="$color8" opacity={0.5} />
            <Text color="$color11" style={{ textAlign: 'center' }}>
              No notifications
            </Text>
            <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
              You're all caught up!
            </Text>
          </YStack>
        ) : (
          <ScrollView maxH={320} showsVerticalScrollIndicator={false}>
            <YStack>
              {/* Unread Section */}
              {unreadNotifications.length > 0 && (
                <>
                  <XStack
                    p="$3"
                    px="$4"
                    bg="$color2"
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                  >
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      Unread ({unreadNotifications.length})
                    </Text>
                  </XStack>
                  <YStack>
                    {unreadNotifications.map((notification, index) => {
                      const IconComponent = getNotificationIcon(notification.severity)
                      const iconColor = getNotificationColor(notification.severity)

                      return (
                        <YStack key={notification.id}>
                          <Card
                            role="menuitem"
                            tabIndex={0}
                            p="$3"
                            bg="$color3"
                            borderWidth={1}
                            borderColor="$color5"
                            rounded={0}
                            pressStyle={{ bg: '$color4' }}
                            hoverStyle={{ bg: '$color4' }}
                            onPress={() => handleNotificationClick(notification)}
                            cursor="pointer"
                            aria-label={`${notification.title}. ${notification.preview}. ${formatRelativeTime(notification.createdAt)}`}
                          >
                            <XStack gap="$3" items="flex-start">
                              <IconComponent size={18} color={iconColor} />
                              <YStack flex={1} gap="$2">
                                <XStack justify="space-between" items="flex-start" gap="$2">
                                  <Text
                                    fontSize="$3"
                                    fontWeight="600"
                                    color="$color12"
                                    flex={1}
                                    numberOfLines={1}
                                  >
                                    {notification.title}
                                  </Text>
                                  <YStack width={6} height={6} bg="$blue9" rounded="$10" mt="$1" />
                                </XStack>
                                <Text
                                  fontSize="$2"
                                  color="$color11"
                                  lineHeight="$3"
                                  numberOfLines={2}
                                >
                                  {notification.preview}
                                </Text>
                                <XStack gap="$2" items="center" mt="$1">
                                  <Text fontSize="$1" color="$color10">
                                    {formatRelativeTime(notification.createdAt)}
                                  </Text>
                                  <Pill
                                    label={notification.severity.toUpperCase()}
                                    bg={SEVERITY_PILL_STYLES[notification.severity].bg}
                                    color={SEVERITY_PILL_STYLES[notification.severity].color}
                                  />
                                  {notification.channels?.length > 0 && (
                                    <Pill
                                      label={notification.channels.join(', ')}
                                      bg={CHANNEL_PILL_STYLE.bg}
                                      color={CHANNEL_PILL_STYLE.color}
                                    />
                                  )}
                                </XStack>
                                {notification.ctaLabel && (
                                  <Button
                                    size="$2"
                                    mt="$2"
                                    theme="info"
                                    onPress={() => handleNotificationClick(notification)}
                                  >
                                    {notification.ctaLabel}
                                  </Button>
                                )}
                              </YStack>
                            </XStack>
                          </Card>
                          {index < unreadNotifications.length - 1 && (
                            <Separator bg="$borderColor" />
                          )}
                        </YStack>
                      )
                    })}
                  </YStack>
                </>
              )}

              {/* Separator between sections */}
              {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                <Separator bg="$borderColor" />
              )}

              {/* Read Section */}
              {readNotifications.length > 0 && (
                <>
                  <XStack
                    p="$3"
                    px="$4"
                    bg="$color2"
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                  >
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      Read
                    </Text>
                  </XStack>
                  <YStack>
                    {readNotifications.map((notification, index) => {
                      const IconComponent = getNotificationIcon(notification.severity)
                      const iconColor = getNotificationColor(notification.severity)

                      return (
                        <YStack key={notification.id}>
                          <Card
                            role="menuitem"
                            tabIndex={0}
                            p="$3"
                            bg="$color2"
                            borderWidth={0}
                            rounded={0}
                            opacity={0.7}
                            pressStyle={{ bg: '$color3', opacity: 1 }}
                            hoverStyle={{ bg: '$color3', opacity: 1 }}
                            onPress={() => handleNotificationClick(notification)}
                            cursor="pointer"
                            aria-label={`${notification.title}. ${notification.preview}. ${formatRelativeTime(notification.createdAt)}`}
                          >
                            <XStack gap="$3" items="flex-start">
                              <IconComponent size={18} color={iconColor} />
                              <YStack flex={1} gap="$2">
                                <Text
                                  fontSize="$3"
                                  fontWeight="normal"
                                  color="$color12"
                                  numberOfLines={1}
                                >
                                  {notification.title}
                                </Text>
                                <Text
                                  fontSize="$2"
                                  color="$color11"
                                  lineHeight="$3"
                                  numberOfLines={2}
                                >
                                  {notification.preview}
                                </Text>
                                <XStack gap="$2" items="center" mt="$1">
                                  <Text fontSize="$1" color="$color10">
                                    {formatRelativeTime(notification.createdAt)}
                                  </Text>
                                  <Pill
                                    label={notification.severity.toUpperCase()}
                                    bg={SEVERITY_PILL_STYLES[notification.severity].bg}
                                    color={SEVERITY_PILL_STYLES[notification.severity].color}
                                  />
                                  {notification.channels?.length > 0 && (
                                    <Pill
                                      label={notification.channels.join(', ')}
                                      bg={CHANNEL_PILL_STYLE.bg}
                                      color={CHANNEL_PILL_STYLE.color}
                                    />
                                  )}
                                </XStack>
                                {notification.ctaLabel && (
                                  <Button
                                    size="$2"
                                    mt="$2"
                                    theme="info"
                                    onPress={() => handleNotificationClick(notification)}
                                  >
                                    {notification.ctaLabel}
                                  </Button>
                                )}
                              </YStack>
                            </XStack>
                          </Card>
                          {index < readNotifications.length - 1 && <Separator bg="$borderColor" />}
                        </YStack>
                      )
                    })}
                  </YStack>
                </>
              )}
            </YStack>
          </ScrollView>
        )}
      </Popover.Content>
    </Popover>
  )
}
