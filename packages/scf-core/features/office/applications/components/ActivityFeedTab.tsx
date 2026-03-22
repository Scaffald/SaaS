/**
 * Activity Feed Tab - Shows activity history on a candidate's application record.
 * Supports multi-recruiter activity tracking with audit trail.
 *
 * @see Issue #86
 */

import {
  ArrowRightLeft,
  Clock,
  MessageCircle,
  UserCheck,
  UserPlus,
  FileText,
  Eye,
} from 'lucide-react-native'
import { ScrollView } from 'react-native'
import {
  Card,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { MockApplication } from '../../mock-data/ats-mock-data'

/** Activity event types for the feed */
interface ActivityEvent {
  id: string
  type:
    | 'status_change'
    | 'note_added'
    | 'message_sent'
    | 'assigned'
    | 'viewed'
    | 'attachment_added'
    | 'inquiry_sent'
    | 'interview_scheduled'
  actor: string
  timestamp: string
  details: Record<string, string>
}

/** Build activity events from application data */
function buildActivityFeed(application: MockApplication): ActivityEvent[] {
  const events: ActivityEvent[] = []

  // Stage history → status changes
  for (const entry of application.stageHistory) {
    events.push({
      id: `stage_${entry.changedAt}`,
      type: 'status_change',
      actor: entry.changedBy,
      timestamp: entry.changedAt,
      details: {
        from: entry.fromStage ?? 'none',
        to: entry.toStage,
        ...(entry.reason ? { reason: entry.reason } : {}),
      },
    })
  }

  // Notes → note_added events
  for (const note of application.notes) {
    events.push({
      id: `note_${note.id}`,
      type: 'note_added',
      actor: note.author,
      timestamp: note.createdAt,
      details: {
        preview: note.content.substring(0, 100),
        rating: String(note.rating),
      },
    })
  }

  // Messages → message_sent events
  for (const msg of application.messages) {
    events.push({
      id: `msg_${msg.id}`,
      type: 'message_sent',
      actor: msg.senderName,
      timestamp: msg.sentAt,
      details: {
        direction: msg.sender,
        preview: msg.content.substring(0, 80),
      },
    })
  }

  // Application creation
  events.push({
    id: 'applied',
    type: 'status_change',
    actor: application.candidate.name,
    timestamp: application.appliedAt,
    details: { from: 'none', to: 'new' },
  })

  // Sort by timestamp descending (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return events
}

/** Icon and color for each event type */
function getEventStyle(type: ActivityEvent['type']) {
  switch (type) {
    case 'status_change':
      return { icon: ArrowRightLeft, color: colors.blue[500] }
    case 'note_added':
      return { icon: FileText, color: colors.warning[500] }
    case 'message_sent':
      return { icon: MessageCircle, color: colors.success[500] }
    case 'assigned':
      return { icon: UserPlus, color: colors.purple[500] }
    case 'viewed':
      return { icon: Eye, color: colors.gray[400] }
    case 'attachment_added':
      return { icon: FileText, color: colors.indigo[500] }
    case 'inquiry_sent':
      return { icon: UserCheck, color: colors.cyan[500] }
    case 'interview_scheduled':
      return { icon: Clock, color: colors.orange[500] }
  }
}

/** Format event description */
function getEventDescription(event: ActivityEvent): string {
  switch (event.type) {
    case 'status_change': {
      const from = event.details.from === 'none' ? '' : ` from ${event.details.from}`
      return `Moved${from} to ${event.details.to}${event.details.reason ? ` — ${event.details.reason}` : ''}`
    }
    case 'note_added':
      return `Added a note: "${event.details.preview}"`
    case 'message_sent':
      return `${event.details.direction === 'recruiter' ? 'Sent' : 'Received'} message: "${event.details.preview}"`
    case 'assigned':
      return `Assigned to ${event.details.assignee}`
    case 'viewed':
      return 'Viewed application'
    case 'attachment_added':
      return `Uploaded ${event.details.filename}`
    case 'inquiry_sent':
      return 'Sent employment inquiry'
    case 'interview_scheduled':
      return `Scheduled interview for ${event.details.date}`
    default:
      return 'Activity recorded'
  }
}

interface ActivityFeedTabProps {
  application: MockApplication
  isLoading?: boolean
}

export function ActivityFeedTab({ application, isLoading }: ActivityFeedTabProps) {
  const { theme } = useThemeContext()

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" gap={12}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ opacity: 0.7 }}>Loading activity...</Text>
      </Stack>
    )
  }

  const events = buildActivityFeed(application)

  if (events.length === 0) {
    return (
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
        <Text style={{ textAlign: 'center', color: colors.text[theme].secondary }}>
          No activity recorded yet.
        </Text>
      </Card>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={0}>
        {events.map((event, idx) => {
          const { icon: Icon, color } = getEventStyle(event.type)
          const isLast = idx === events.length - 1

          return (
            <Row key={event.id} gap={12} style={{ minHeight: 60 }}>
              {/* Timeline line + dot */}
              <Stack align="center" style={{ width: 32 }}>
                <Stack
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: `${color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Icon size={14} color={color} />
                </Stack>
                {!isLast && (
                  <Stack
                    style={{
                      width: 2,
                      flex: 1,
                      backgroundColor: colors.border[theme].default,
                      marginTop: -2,
                    }}
                  />
                )}
              </Stack>

              {/* Event content */}
              <Stack style={{ flex: 1, paddingBottom: 16 }}>
                <Row justify="space-between" align="center">
                  <Text style={{ color: colors.text[theme].primary, fontWeight: '500', fontSize: 13 }}>
                    {event.actor}
                  </Text>
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
                    {formatRelativeTime(event.timestamp)}
                  </Text>
                </Row>
                <Text style={{ color: colors.text[theme].secondary, fontSize: 13, marginTop: 2 }}>
                  {getEventDescription(event)}
                </Text>
              </Stack>
            </Row>
          )
        })}
      </Stack>
    </ScrollView>
  )
}

/** Format timestamp to relative time */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
