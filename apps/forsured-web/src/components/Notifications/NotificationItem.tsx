/**
 * NotificationItem Component
 * 
 * Individual notification item using beyond-ui Card and components
 * Displays notification with actions (mark as read, archive, delete)
 */

import { Row, Stack, Text, Card, Button, Chip } from '@unicornlove/beyond-ui'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Archive,
  Trash2,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from '../../utils/dateHelpers'
import type { Database } from '../../../packages/supabase/types'

type Notification = Database['core']['Tables']['notifications']['Row']

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onMarkAsUnread?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  isMarkingAsRead?: boolean
  isArchiving?: boolean
  isDeleting?: boolean
}

/**
 * Get icon based on notification severity
 */
function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <AlertCircle size={20} color="#DC2626" /> // error-600
    case 'important':
      return <AlertCircle size={20} color="#F59E0B" /> // warning-500
    case 'info':
    default:
      return <Info size={20} color="#3B82F6" /> // blue-500
  }
}

/**
 * Get chip color based on severity
 */
function getSeverityChipType(severity: string): 'default' | 'success' | 'warning' | 'error' {
  switch (severity) {
    case 'critical':
      return 'error'
    case 'important':
      return 'warning'
    case 'info':
    default:
      return 'default'
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  isMarkingAsRead = false,
  isArchiving = false,
  isDeleting = false,
}: NotificationItemProps) {
  const isRead = notification.read ?? false
  const timestamp = notification.created_at
    ? formatDistanceToNow(notification.created_at)
    : 'Unknown time'

  return (
    <Card
      padding="md"
      variant="outlined"
      style={{
        opacity: isRead ? 0.7 : 1,
        borderLeftWidth: isRead ? 0 : 3,
        borderLeftColor: isRead ? undefined : '#3B82F6', // blue-500
      }}
    >
      <Stack style={{ gap: 12 }}>
        {/* Header Row: Icon, Title, Timestamp */}
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Row style={{ alignItems: 'flex-start', gap: 12, flex: 1 }}>
            {/* Severity Icon */}
            <Stack style={{ marginTop: 2 }}>
              {getSeverityIcon(notification.severity)}
            </Stack>

            {/* Title and Metadata */}
            <Stack style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isRead ? 400 : 600,
                  color: '#1A232D', // gray-800
                }}
              >
                {notification.title}
              </Text>
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color="#637083" />
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#637083', // gray-500
                    }}
                  >
                    {timestamp}
                  </Text>
                </Row>
                {notification.severity && (
                  <Chip
                    type={getSeverityChipType(notification.severity)}
                    size="sm"
                  >
                    {notification.severity}
                  </Chip>
                )}
              </Row>
            </Stack>
          </Row>
        </Row>

        {/* Message */}
        {notification.message && (
          <Text
            style={{
              fontSize: 14,
              color: '#4A5568', // gray-600
              lineHeight: 20,
            }}
          >
            {notification.message}
          </Text>
        )}

        {/* Preview (if available) */}
        {notification.preview && (
          <Text
            style={{
              fontSize: 13,
              color: '#637083', // gray-500
              lineHeight: 18,
            }}
          >
            {notification.preview}
          </Text>
        )}

        {/* Actions Row */}
        <Row style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
          {!isRead ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onMarkAsRead?.(notification.id)}
              disabled={isMarkingAsRead}
              style={{ paddingHorizontal: 8 }}
            >
              <Row style={{ alignItems: 'center', gap: 4 }}>
                <CheckCircle size={14} />
                <Text style={{ fontSize: 12 }}>Mark as read</Text>
              </Row>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onMarkAsUnread?.(notification.id)}
              disabled={isMarkingAsRead}
              style={{ paddingHorizontal: 8 }}
            >
              <Row style={{ alignItems: 'center', gap: 4 }}>
                <Bell size={14} />
                <Text style={{ fontSize: 12 }}>Mark as unread</Text>
              </Row>
            </Button>
          )}

          {!notification.archived_at ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onArchive?.(notification.id)}
              disabled={isArchiving}
              style={{ paddingHorizontal: 8 }}
            >
              <Row style={{ alignItems: 'center', gap: 4 }}>
                <Archive size={14} />
                <Text style={{ fontSize: 12 }}>Archive</Text>
              </Row>
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            onPress={() => onDelete?.(notification.id)}
            disabled={isDeleting}
            style={{ paddingHorizontal: 8 }}
          >
            <Row style={{ alignItems: 'center', gap: 4 }}>
              <Trash2 size={14} />
              <Text style={{ fontSize: 12 }}>Delete</Text>
            </Row>
          </Button>

          {/* CTA Button (if available) */}
          {notification.cta_url && notification.cta_label && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                if (typeof window !== 'undefined' && notification.cta_url) {
                  window.location.href = notification.cta_url
                }
              }}
              style={{ marginLeft: 'auto' }}
            >
              {notification.cta_label}
            </Button>
          )}
        </Row>
      </Stack>
    </Card>
  )
}
