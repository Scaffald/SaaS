/**
 * TaskHistoryTimeline - Timeline showing task history/activity.
 * Beyond UI component.
 */

import { useState } from 'react'
import { Stack, Row, Box, Text } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
import {
  CheckCircle,
  Circle,
  Clock,
  MessageSquare,
  FileText,
  User,
  Edit3,
  ArrowRight,
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export type HistoryEventType =
  | 'created'
  | 'status_change'
  | 'assigned'
  | 'comment'
  | 'attachment'
  | 'edited'
  | 'due_date_change'

export interface HistoryEvent {
  id: string
  type: HistoryEventType
  timestamp: string
  user: {
    name: string
    avatar?: string
  }
  description: string
  metadata?: {
    oldValue?: string
    newValue?: string
  }
}

export interface TaskHistoryTimelineProps extends Omit<StackProps, 'children'> {
  events: HistoryEvent[]
  maxVisible?: number
  relativeTime?: boolean
  onEventPress?: (event: HistoryEvent) => void
}

const eventConfig: Record<
  HistoryEventType,
  { icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  created: {
    icon: Circle,
    color: colors.success[700],
    bgColor: colors.success[100],
  },
  status_change: {
    icon: ArrowRight,
    color: colors.info[700],
    bgColor: colors.info[100],
  },
  assigned: {
    icon: User,
    color: colors.violet[700],
    bgColor: colors.violet[100],
  },
  comment: {
    icon: MessageSquare,
    color: colors.orange[700],
    bgColor: colors.orange[100],
  },
  attachment: {
    icon: FileText,
    color: colors.gray[700],
    bgColor: colors.gray[200],
  },
  edited: {
    icon: Edit3,
    color: colors.warning[700],
    bgColor: colors.warning[100],
  },
  due_date_change: {
    icon: Clock,
    color: colors.error[700],
    bgColor: colors.error[100],
  },
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatAbsoluteTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TaskHistoryTimeline({
  events,
  maxVisible = 5,
  relativeTime = true,
  onEventPress,
  ...props
}: TaskHistoryTimelineProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleEvents = showAll ? events : events.slice(0, maxVisible)
  const hasMore = events.length > maxVisible

  return (
    <Stack gap={0} {...props}>
      {visibleEvents.map((event, index) => {
        const config = eventConfig[event.type]
        const Icon = config.icon
        const isLast = index === visibleEvents.length - 1

        return (
          <Pressable
            key={event.id}
            onPress={() => onEventPress?.(event)}
            style={{ opacity: onEventPress ? 1 : 1 }}
          >
            <Row
              gap={spacing[12]}
              style={{ position: 'relative' }}
            >
              {!isLast && (
                <View
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: 32,
                    bottom: 0,
                    width: 2,
                    backgroundColor: colors.border?.default ?? colors.gray[200],
                  }}
                />
              )}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: borderRadius.max,
                  backgroundColor: config.bgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                <Icon size={14} color={config.color} />
              </View>
              <Stack flex={1} gap={spacing[4]} style={{ paddingBottom: spacing[16] }}>
                <Row align="center" gap={spacing[8]}>
                  <Text size="md" weight="semibold" style={{ color: colors.gray[800] }}>
                    {event.user.name}
                  </Text>
                  <Text size="sm" style={{ color: colors.gray[500] }}>
                    {relativeTime
                      ? formatRelativeTime(event.timestamp)
                      : formatAbsoluteTime(event.timestamp)}
                  </Text>
                </Row>
                <Text size="md" style={{ color: colors.gray[700] }}>
                  {event.description}
                </Text>
                {event.metadata &&
                  (event.metadata.oldValue || event.metadata.newValue) && (
                    <Row align="center" gap={spacing[8]} style={{ paddingTop: spacing[4] }}>
                      {event.metadata.oldValue && (
                        <Box
                          style={{
                            paddingHorizontal: spacing[8],
                            paddingVertical: spacing[4],
                            borderRadius: borderRadius.xs,
                            backgroundColor: colors.error[100],
                          }}
                        >
                          <Text size="sm" style={{ color: colors.error[700] }}>
                            {event.metadata.oldValue}
                          </Text>
                        </Box>
                      )}
                      {event.metadata.oldValue && event.metadata.newValue && (
                        <ArrowRight size={12} color={colors.gray[500]} />
                      )}
                      {event.metadata.newValue && (
                        <Box
                          style={{
                            paddingHorizontal: spacing[8],
                            paddingVertical: spacing[4],
                            borderRadius: borderRadius.xs,
                            backgroundColor: colors.success[100],
                          }}
                        >
                          <Text size="sm" style={{ color: colors.success[700] }}>
                            {event.metadata.newValue}
                          </Text>
                        </Box>
                      )}
                    </Row>
                  )}
              </Stack>
            </Row>
          </Pressable>
        )
      })}

      {hasMore && !showAll && (
        <Pressable
          onPress={() => setShowAll(true)}
          style={{
            paddingVertical: spacing[8],
            paddingHorizontal: spacing[12],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size="sm" weight="medium" style={{ color: colors.info[600] }}>
            Show {events.length - maxVisible} more events
          </Text>
        </Pressable>
      )}
    </Stack>
  )
}
