import { useState } from 'react'
import { YStack, XStack, Text, ScrollView, Button } from 'tamagui'
import { Sheet, Card } from '@app/ui'
import { Bell, CheckCircle, AlertCircle, Info, X } from '@tamagui/lucide-icons'

export interface NotificationItem {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface NotificationsActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * NotificationsActionSheet component
 * Displays notifications in a mobile-friendly action sheet overlay
 * Uses Tamagui Sheet component with snap points for optimal mobile UX
 */
export const NotificationsActionSheet = ({ open, onOpenChange }: NotificationsActionSheetProps) => {
  // Mock notification data - in a real app this would come from an API
  const notifications: NotificationItem[] = [
    {
      id: '1',
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile has been successfully updated.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'New Worker Available',
      message: 'A new worker matching your criteria is now available in your area.',
      timestamp: '5 hours ago',
      read: true,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Payment Required',
      message: 'Your subscription will expire in 3 days. Please update your payment method.',
      timestamp: '1 day ago',
      read: false,
    },
    {
      id: '4',
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2-4 AM EST.',
      timestamp: '2 days ago',
      read: true,
    },
    {
      id: '5',
      type: 'success',
      title: 'Application Approved',
      message: 'Your worker application has been approved and is now live.',
      timestamp: '3 days ago',
      read: true,
    },
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertCircle
      case 'info':
      default:
        return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '$green10'
      case 'warning':
        return '$orange10'
      case 'info':
      default:
        return '$blue10'
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[85]} dismissOnSnapToBottom>
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" gap="$4">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack alignItems="center" gap="$3">
            <Bell size={20} color="$color11" />
            <Text fontSize="$5" fontWeight="700" color="$color12">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <YStack
                backgroundColor="$red9"
                borderRadius="$10"
                paddingHorizontal="$2"
                paddingVertical="$1"
                minWidth={20}
                alignItems="center"
              >
                <Text fontSize="$2" fontWeight="600" color="white">
                  {unreadCount}
                </Text>
              </YStack>
            )}
          </XStack>
          <Button
            size="$2"
            circular
            icon={X}
            onPress={() => onOpenChange(false)}
            backgroundColor="transparent"
            borderWidth={0}
          />
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack gap="$3">
            {notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type)
              const iconColor = getNotificationColor(notification.type)

              return (
                <Card
                  key={notification.id}
                  padding="$3"
                  backgroundColor={notification.read ? '$color2' : '$color3'}
                  borderWidth={notification.read ? 0 : 1}
                  borderColor="$color5"
                  borderRadius="$3"
                  opacity={notification.read ? 0.7 : 1}
                >
                  <XStack gap="$3" alignItems="flex-start">
                    <IconComponent size={18} color={iconColor} />
                    <YStack flex={1} gap="$2">
                      <XStack justifyContent="space-between" alignItems="flex-start">
                        <Text
                          fontSize="$3"
                          fontWeight={notification.read ? 'normal' : '600'}
                          color="$color12"
                          flex={1}
                        >
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <YStack
                            width={6}
                            height={6}
                            backgroundColor="$blue9"
                            borderRadius="$10"
                          />
                        )}
                      </XStack>
                      <Text fontSize="$2" color="$color11" lineHeight="$3">
                        {notification.message}
                      </Text>
                      <Text fontSize="$1" color="$color10" marginTop="$1">
                        {notification.timestamp}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}
