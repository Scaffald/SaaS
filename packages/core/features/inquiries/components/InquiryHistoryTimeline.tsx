import { useMemo } from 'react'
import { YStack, XStack, Text } from '@app/ui'
import { Avatar, type GetThemeValueForKey } from 'tamagui'
import { Check, MessageSquare, Edit3, Send, FileText, AlertCircle } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'

interface InquiryHistoryTimelineProps {
  inquiryId: string
}

type EventType =
  | 'inquiry_created'
  | 'inquiry_sent'
  | 'inquiry_edited'
  | 'comment_added'
  | 'section_accepted'
  | 'capability_answered'
  | 'status_changed'

interface AuditLogEntry {
  id: string
  event_type: EventType
  actor_id: string
  event_data: Record<string, unknown> | null
  created_at: string
  actor: {
    id: string
    display_name: string | null
    username: string | null
    avatar_path: string | null
  } | null
}

const getEventColor = (eventType: EventType): `$${string}` => {
  switch (eventType) {
    case 'inquiry_created':
    case 'inquiry_sent':
      return '$blue9'
    case 'section_accepted':
      return '$green9'
    case 'comment_added':
      return '$purple9'
    case 'inquiry_edited':
      return '$orange9'
    case 'status_changed':
      return '$yellow9'
    case 'capability_answered':
      return '$cyan9'
    default:
      return '$gray9'
  }
}

const getEventIcon = (eventType: EventType) => {
  switch (eventType) {
    case 'inquiry_created':
    case 'inquiry_sent':
      return Send
    case 'section_accepted':
      return Check
    case 'comment_added':
      return MessageSquare
    case 'inquiry_edited':
      return Edit3
    case 'status_changed':
      return AlertCircle
    case 'capability_answered':
      return FileText
    default:
      return FileText
  }
}

const formatEventType = (eventType: EventType): string => {
  const labels: Record<EventType, string> = {
    inquiry_created: 'created inquiry',
    inquiry_sent: 'sent inquiry',
    inquiry_edited: 'edited inquiry',
    comment_added: 'added comment',
    section_accepted: 'accepted section',
    capability_answered: 'answered capability question',
    status_changed: 'changed status',
  }
  return labels[eventType] || eventType
}

const formatEventData = (eventType: EventType, eventData: Record<string, unknown> | null): string | null => {
  if (!eventData) return null

  switch (eventType) {
    case 'status_changed':
      return `Status changed from ${eventData.from_status as string} to ${eventData.to_status as string}`
    case 'section_accepted':
      return `Accepted ${eventData.section_name as string} section`
    case 'comment_added':
      return `Commented on ${eventData.section_name as string} section`
    case 'capability_answered':
      return `Answered ${eventData.capability_name as string}`
    case 'inquiry_edited':
      return 'Updated inquiry terms'
    default:
      return null
  }
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function InquiryHistoryTimeline({ inquiryId }: InquiryHistoryTimelineProps) {
  const { data: history, isLoading, error } = api.inquiries.getHistory.useQuery({
    inquiryId,
  })

  const sortedHistory = useMemo(() => {
    if (!history) return []
    // Already sorted by created_at ascending from the query
    return [...history].reverse() // Show most recent first
  }, [history])

  if (isLoading) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text>Loading history...</Text>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text color="$red10">Failed to load history</Text>
      </YStack>
    )
  }

  if (!sortedHistory || sortedHistory.length === 0) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text color="$color11">No history available</Text>
      </YStack>
    )
  }

  const actorDisplayName = (actor: AuditLogEntry['actor']): string => {
    if (!actor) return 'Unknown'
    return actor.display_name?.trim() || actor.username?.trim() || 'User'
  }

  return (
    <YStack gap="$3" p="$4">
      <Text fontSize="$6" fontWeight="600">
        History
      </Text>

      <YStack gap="$2">
        {sortedHistory.map((event, index) => {
          const EventIcon = getEventIcon(event.event_type as EventType)
          const eventColor = getEventColor(event.event_type as EventType)
          const isLast = index === sortedHistory.length - 1

          return (
            <XStack key={event.id} gap="$3" items="flex-start">
              {/* Timeline dot and line */}
              <YStack items="center" width={24}>
                <YStack
                  width={12}
                  height={12}
                  rounded="$10"
                  bg={eventColor as GetThemeValueForKey<'backgroundColor'>}
                  items="center"
                  justify="center"
                >
                  <EventIcon size={8} color="white" />
                </YStack>
                {!isLast && <YStack flex={1} width={2} bg="$gray5" height={40} />}
              </YStack>

              {/* Event details */}
              <YStack flex={1} gap="$1">
                <XStack gap="$2" items="center">
                  <Avatar size="$2" circular>
                    <Avatar.Image src={event.actor?.avatar_path || undefined} />
                    <Avatar.Fallback bg="$blue9">
                      <Text color="white" fontWeight="600" fontSize="$1">
                        {actorDisplayName(event.actor).charAt(0).toUpperCase()}
                      </Text>
                    </Avatar.Fallback>
                  </Avatar>
                  <Text fontSize="$4" fontWeight="600">
                    {actorDisplayName(event.actor)}
                  </Text>
                  <Text fontSize="$3" color="$color11">
                    {formatEventType(event.event_type as EventType)}
                  </Text>
                </XStack>

                <Text fontSize="$2" color="$color11">
                  {formatTimestamp(event.created_at)}
                </Text>

                {/* Event-specific details */}
                {event.event_data && (
                  <Text fontSize="$3" color="$color11" mt="$1">
                    {formatEventData(event.event_type as EventType, event.event_data)}
                  </Text>
                )}
              </YStack>
            </XStack>
          )
        })}
      </YStack>
    </YStack>
  )
}

