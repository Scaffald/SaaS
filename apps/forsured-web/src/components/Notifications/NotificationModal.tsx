/**
 * NotificationModal Component
 * 
 * Modal for displaying and managing notifications using beyond-ui Modal
 * Includes filter tabs (All, Unread, Archived) and notification list
 */

import { useState, useCallback } from 'react'
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  Stack,
  Text,
  Button,
  ButtonGroup,
  Spinner,
} from '@unicornlove/beyond-ui'
import { Bell } from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import { useNotifications, type NotificationStatus } from '../../hooks/useNotifications'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [filter, setFilter] = useState<NotificationStatus>('all')

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAsUnread,
    archiveMany,
    deleteMany,
    markAllAsRead,
    isMarkingAsRead,
    isArchiving,
    isDeleting,
    isMarkingAllAsRead,
  } = useNotifications({
    status: filter,
    limit: 50,
    enabled: isOpen, // Only fetch when modal is open
  })

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead({ id })
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },
    [markAsRead]
  )

  const handleMarkAsUnread = useCallback(
    async (id: string) => {
      try {
        await markAsUnread({ id })
      } catch (error) {
        console.error('Failed to mark notification as unread:', error)
      }
    },
    [markAsUnread]
  )

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await archiveMany({ ids: [id] })
      } catch (error) {
        console.error('Failed to archive notification:', error)
      }
    },
    [archiveMany]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMany({ ids: [id] })
      } catch (error) {
        console.error('Failed to delete notification:', error)
      }
    },
    [deleteMany]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [markAllAsRead])

  const filterTabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'unread' as const, label: 'Unread' },
    { id: 'archived' as const, label: 'Archived' },
  ]

  const hasUnreadNotifications = notifications.some((n) => !n.read)

  return (
    <Modal visible={isOpen} onClose={onClose} width={600}>
      <ModalHeader
        title="Notifications"
        description={
          unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : undefined
        }
        onClose={onClose}
      />

      <ModalContent>
        <Stack style={{ gap: 16 }}>
          {/* Filter Tabs */}
          <ButtonGroup
            items={filterTabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
            }))}
            selectedId={filter}
            onSelectionChange={(id) => setFilter(id as NotificationStatus)}
            mode="single"
            size="sm"
          />

          {/* Loading State */}
          {isLoading && (
            <Stack
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}
            >
              <Spinner size="large" />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 14,
                  color: '#637083', // gray-500
                }}
              >
                Loading notifications...
              </Text>
            </Stack>
          )}

          {/* Error State */}
          {error && (
            <Stack
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: '#DC2626', // error-600
                }}
              >
                Failed to load notifications. Please try again.
              </Text>
            </Stack>
          )}

          {/* Empty State */}
          {!isLoading && !error && notifications.length === 0 && (
            <Stack
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}
            >
              <Bell size={48} color="#9CA3AF" />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#1A232D', // gray-800
                }}
              >
                No notifications
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: '#637083', // gray-500
                }}
              >
                {filter === 'archived'
                  ? 'No archived notifications'
                  : filter === 'unread'
                    ? 'All caught up!'
                    : "You're all caught up!"}
              </Text>
            </Stack>
          )}

          {/* Notification List */}
          {!isLoading && !error && notifications.length > 0 && (
            <Stack style={{ gap: 12 }}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  isMarkingAsRead={isMarkingAsRead}
                  isArchiving={isArchiving}
                  isDeleting={isDeleting}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </ModalContent>

      {/* Footer Actions */}
      {!isLoading && !error && notifications.length > 0 && hasUnreadNotifications && (
        <ModalActions
          orientation="right"
          primaryAction={{
            label: 'Mark all as read',
            onPress: handleMarkAllAsRead,
            loading: isMarkingAllAsRead,
            disabled: isMarkingAllAsRead,
          }}
        />
      )}
    </Modal>
  )
}
