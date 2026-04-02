import { formatDistanceToNow } from 'date-fns'
import type { ReactNode } from 'react'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ActivityEntry {
  id: string
  event_type: string
  details?: Record<string, unknown> | null
  created_at: string
}

const EVENT_LABELS: Record<string, string> = {
  application_submitted: 'Application Submitted',
  status_changed: 'Status Updated',
  application_viewed: 'Application Viewed',
  application_shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  offer_extended: 'Offer Extended',
  application_rejected: 'Not Selected',
  application_withdrawn: 'Withdrawn',
  message_sent: 'Message Sent',
  message_received: 'New Message',
  score_calculated: 'Application Scored',
}

const EVENT_DOT_COLORS: Record<string, string> = {
  application_submitted: colors.blue[500],
  status_changed: colors.warning[500],
  application_viewed: colors.blue[400],
  application_shortlisted: colors.success[500],
  interview_scheduled: colors.success[500],
  offer_extended: colors.success[600],
  application_rejected: colors.error[500],
  application_withdrawn: colors.gray[400],
}

interface ActivityTimelineProps {
  entries: ActivityEntry[]
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  const { theme } = useThemeContext()

  if (entries.length === 0) {
    return (
      <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, fontStyle: 'italic' }}>
        No activity recorded yet.
      </Text>
    )
  }

  return (
    <Stack gap={0}>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1
        const label = EVENT_LABELS[entry.event_type] ?? entry.event_type.replace(/_/g, ' ')
        const dotColor = EVENT_DOT_COLORS[entry.event_type] ?? colors.gray[400]
        const detail =
          entry.details && typeof entry.details === 'object'
            ? (entry.details as Record<string, unknown>).description ??
              (entry.details as Record<string, unknown>).new_status
            : null

        return (
          <Row key={entry.id} gap={12} align="stretch">
            {/* Timeline line + dot */}
            <Stack align="center" width={20}>
              <Stack
                width={10}
                height={10}
                borderRadius={5}
                style={{ backgroundColor: dotColor, marginTop: 4 }}
              />
              {!isLast && (
                <Stack
                  width={2}
                  style={{
                    backgroundColor: colors.border[theme].default,
                    flex: 1,
                    minHeight: 24,
                  }}
                />
              )}
            </Stack>

            {/* Event content */}
            <Stack gap={2} style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
              <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>
                {label}
              </Text>
              {detail != null && (
                <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                  {String(detail) as ReactNode}
                </Text>
              )}
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                {entry.created_at && !Number.isNaN(new Date(entry.created_at).getTime())
                  ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                  : '—'}
              </Text>
            </Stack>
          </Row>
        )
      })}
    </Stack>
  )
}
