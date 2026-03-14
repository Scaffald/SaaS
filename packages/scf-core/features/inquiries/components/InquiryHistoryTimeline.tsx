import { useInquiryHistory } from '@scf/core/utils/inquiries-sdk-hooks'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ReactNode } from 'react'
import { AlertCircle, Check, Edit3, FileText, MessageSquare, Send } from 'lucide-react-native'
import { useMemo } from 'react'
import { Avatar } from '@scaffald/ui'

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

const getEventColor = (eventType: EventType, t: 'light' | 'dark'): string => {
  switch (eventType) {
    case 'inquiry_created':
    case 'inquiry_sent':
      return t === 'dark' ? colors.blue[300] : colors.blue[600]
    case 'section_accepted':
      return t === 'dark' ? colors.green[300] : colors.green[600]
    case 'comment_added':
      return t === 'dark' ? colors.purple[300] : colors.purple[600]
    case 'inquiry_edited':
      return t === 'dark' ? colors.orange[300] : colors.orange[600]
    case 'status_changed':
      return t === 'dark' ? colors.yellow[300] : colors.yellow[600]
    case 'capability_answered':
      return t === 'dark' ? colors.cyan[300] : colors.cyan[600]
    default:
      return colors.text[t].tertiary
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

const formatEventData = (
  eventType: EventType,
  eventData: Record<string, unknown> | null
): string | null => {
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
  const { data: history, isLoading, error } = useInquiryHistory(inquiryId)
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const sortedHistory = useMemo(() => {
    if (!history) return []
    // Already sorted by created_at ascending from the query
    return [...(history as unknown as AuditLogEntry[])].reverse() // Show most recent first
  }, [history])

  if (isLoading) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text>Loading history...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text color={t === 'dark' ? colors.error[300] : colors.error[600]}>Failed to load history</Text>
      </Stack>
    )
  }

  if (!sortedHistory || sortedHistory.length === 0) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text color={colors.text[t].secondary}>No history available</Text>
      </Stack>
    )
  }

  const actorDisplayName = (actor: AuditLogEntry['actor']): string => {
    if (!actor) return 'Unknown'
    return actor.display_name?.trim() || actor.username?.trim() || 'User'
  }

  return (
    <Stack gap={12} padding="md">
      <Text>History</Text>

      <Stack gap={8}>
        {sortedHistory.map((event, index) => {
          const EventIcon = getEventIcon(event.event_type as EventType)
          const eventColor = getEventColor(event.event_type as EventType, t)
          const isLast = index === sortedHistory.length - 1

          return (
            <Row key={event.id} gap={12} align="flex-start">
              {/* Timeline dot and line */}
              <Stack align="center" width={24}>
                <Stack
                  width={12}
                  height={12}
                  borderRadius={10}
                  style={{ backgroundColor: eventColor }}
                  align="center"
                  justify="center"
                >
                  <EventIcon size={16} color="white" />
                </Stack>
                {!isLast && <Stack flex={1} width={2} backgroundColor={colors.border[t].default} height={40} />}
              </Stack>

              {/* Event details */}
              <Stack flex={1} gap={4}>
                <Row gap={8} align="center">
                  <Avatar
                    size={32}
                    src={(event.actor as AuditLogEntry['actor'])?.avatar_path ?? undefined}
                    initials={actorDisplayName(event.actor as AuditLogEntry['actor']).charAt(0).toUpperCase()}
                  />
                  <Text>{actorDisplayName(event.actor as AuditLogEntry['actor'])}</Text>
                  <Text color={colors.text[t].secondary}>{formatEventType(event.event_type as EventType)}</Text>
                </Row>

                <Text color={colors.text[t].secondary}>{formatTimestamp(event.created_at as string)}</Text>

                {/* Event-specific details */}
                {event.event_data
                  ? ((): ReactNode => {
                      const msg = formatEventData(event.event_type as EventType, event.event_data as Record<string, unknown>)
                      return msg != null ? <Text color={colors.text[t].secondary} style={{ marginTop: 4 }}>{msg}</Text> : null
                    })()
                  : null}
              </Stack>
            </Row>
          )
        })}
      </Stack>
    </Stack>
  )
}
