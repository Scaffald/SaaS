/**
 * TaskHistoryTimeline - Timeline showing task history/activity
 * REQ-288: Tamagui UI Component Library
 */

import { useState } from 'react'
import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import {
  CheckCircle,
  Circle,
  Clock,
  MessageSquare,
  FileText,
  User,
  Edit3,
  ArrowRight,
} from '@tamagui/lucide-icons'

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

export interface TaskHistoryTimelineProps extends Omit<YStackProps, 'children'> {
  /** Array of history events */
  events: HistoryEvent[]
  /** Maximum events to show initially */
  maxVisible?: number
  /** Show timestamps as relative (e.g., "2 hours ago") or absolute */
  relativeTime?: boolean
  /** Click handler for event */
  onEventPress?: (event: HistoryEvent) => void
}

const eventConfig: Record<
  HistoryEventType,
  { icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  created: {
    icon: Circle,
    color: '$green11',
    bgColor: '$green3',
  },
  status_change: {
    icon: ArrowRight,
    color: '$blue11',
    bgColor: '$blue3',
  },
  assigned: {
    icon: User,
    color: '$purple11',
    bgColor: '$purple3',
  },
  comment: {
    icon: MessageSquare,
    color: '$orange11',
    bgColor: '$orange3',
  },
  attachment: {
    icon: FileText,
    color: '$gray11',
    bgColor: '$gray3',
  },
  edited: {
    icon: Edit3,
    color: '$yellow11',
    bgColor: '$yellow3',
  },
  due_date_change: {
    icon: Clock,
    color: '$red11',
    bgColor: '$red3',
  },
}

const TimelineContainer = styled(YStack, {
  name: 'TaskHistoryTimeline',
  gap: 0,
})

const TimelineItem = styled(XStack, {
  name: 'TaskHistoryTimelineItem',
  gap: '$3',
  position: 'relative',
})

const TimelineLine = styled(View, {
  name: 'TaskHistoryTimelineLine',
  position: 'absolute',
  left: 15,
  top: 32,
  bottom: 0,
  width: 2,
  backgroundColor: '$borderColor',
})

const IconContainer = styled(View, {
  name: 'TaskHistoryTimelineIcon',
  width: 32,
  height: 32,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  zIndex: 1,
})

const EventContent = styled(YStack, {
  name: 'TaskHistoryEventContent',
  flex: 1,
  paddingBottom: '$4',
  gap: '$1',
})

const EventHeader = styled(XStack, {
  name: 'TaskHistoryEventHeader',
  alignItems: 'center',
  gap: '$2',
})

const UserName = styled(Text, {
  name: 'TaskHistoryUserName',
  fontSize: '$3',
  fontWeight: '600',
  color: '$color12',
})

const EventDescription = styled(Text, {
  name: 'TaskHistoryEventDescription',
  fontSize: '$3',
  color: '$color11',
})

const Timestamp = styled(Text, {
  name: 'TaskHistoryTimestamp',
  fontSize: '$2',
  color: '$color9',
})

const MetadataContainer = styled(XStack, {
  name: 'TaskHistoryMetadata',
  alignItems: 'center',
  gap: '$2',
  paddingTop: '$1',
})

const MetadataValue = styled(Text, {
  name: 'TaskHistoryMetadataValue',
  fontSize: '$2',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$sm',
})

const ShowMoreButton = styled(XStack, {
  name: 'TaskHistoryShowMore',
  paddingVertical: '$2',
  paddingHorizontal: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',

  hoverStyle: {
    opacity: 0.8,
  },
})

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
    <TimelineContainer {...props}>
      {visibleEvents.map((event, index) => {
        const config = eventConfig[event.type]
        const Icon = config.icon
        const isLast = index === visibleEvents.length - 1

        return (
          <TimelineItem
            key={event.id}
            onPress={() => onEventPress?.(event)}
            cursor={onEventPress ? 'pointer' : undefined}
          >
            {!isLast && <TimelineLine />}
            <IconContainer backgroundColor={config.bgColor}>
              <Icon size={14} color={config.color} />
            </IconContainer>
            <EventContent>
              <EventHeader>
                <UserName>{event.user.name}</UserName>
                <Timestamp>
                  {relativeTime
                    ? formatRelativeTime(event.timestamp)
                    : formatAbsoluteTime(event.timestamp)}
                </Timestamp>
              </EventHeader>
              <EventDescription>{event.description}</EventDescription>
              {event.metadata && (event.metadata.oldValue || event.metadata.newValue) && (
                <MetadataContainer>
                  {event.metadata.oldValue && (
                    <MetadataValue backgroundColor="$red3" color="$red11">
                      {event.metadata.oldValue}
                    </MetadataValue>
                  )}
                  {event.metadata.oldValue && event.metadata.newValue && (
                    <ArrowRight size={12} color="$color9" />
                  )}
                  {event.metadata.newValue && (
                    <MetadataValue backgroundColor="$green3" color="$green11">
                      {event.metadata.newValue}
                    </MetadataValue>
                  )}
                </MetadataContainer>
              )}
            </EventContent>
          </TimelineItem>
        )
      })}

      {hasMore && !showAll && (
        <ShowMoreButton onPress={() => setShowAll(true)}>
          <Text fontSize="$2" color="$blue10" fontWeight="500">
            Show {events.length - maxVisible} more events
          </Text>
        </ShowMoreButton>
      )}
    </TimelineContainer>
  )
}
