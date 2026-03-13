/**
 * Recent Changes Widget - Activity feed of recent skill movements
 * Shows snapshot deltas and evidence additions.
 */

import {
  DashboardWidget,
  DashboardWidgetHeader,
  Text,
  Row,
  Stack,
  Spinner,
  useThemeContext,
} from '@scaffald/ui'
import { DeltaBadge } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { TrendingUp, TrendingDown, FileCheck, Camera } from 'lucide-react-native'
import { useSkillSnapshots, useSkillEvidence } from '../../../utils/skill-analytics-sdk-hooks'

interface ChangeEntry {
  id: string
  type: 'improvement' | 'decline' | 'evidence' | 'snapshot'
  label: string
  detail?: string
  timestamp: string
  delta?: { current: number; previous: number }
}

export function RecentChangesWidget() {
  const { theme } = useThemeContext()
  const { data: snapshotsData, isLoading: snapshotsLoading, error: snapshotsError } = useSkillSnapshots({ limit: 5 })
  const { data: evidenceData, isLoading: evidenceLoading } = useSkillEvidence()

  const isLoading = snapshotsLoading || evidenceLoading

  if (snapshotsError) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Recent Changes" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
            Unable to load recent changes
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  // Build change entries from snapshots and evidence
  const changes: ChangeEntry[] = []

  // Add snapshot entries
  for (const snap of snapshotsData?.snapshots ?? []) {
    if (snap.summary) {
      const delta = snap.summary.delta_overall
      if (Math.abs(delta) > 0.05) {
        changes.push({
          id: snap.id,
          type: delta > 0 ? 'improvement' : 'decline',
          label:
            delta > 0
              ? 'Skills improved'
              : 'Skills declined',
          detail:
            snap.triggerType === 'review_received'
              ? 'After receiving a review'
              : snap.triggerType === 'self_assessment'
                ? 'Self-assessment update'
                : 'Manual snapshot',
          timestamp: snap.createdAt,
          delta: {
            current: snap.summary.delta_overall + snap.summary.previous_overall,
            previous: snap.summary.previous_overall,
          },
        })
      } else {
        changes.push({
          id: snap.id,
          type: 'snapshot',
          label: 'Snapshot recorded',
          detail:
            snap.triggerType === 'review_received'
              ? 'Review received'
              : 'Assessment update',
          timestamp: snap.createdAt,
        })
      }
    }
  }

  // Add recent evidence
  for (const ev of (evidenceData?.evidence ?? []).slice(0, 3)) {
    changes.push({
      id: ev.id,
      type: 'evidence',
      label: `Evidence added: ${ev.title}`,
      detail: ev.evidenceType.replace('_', ' '),
      timestamp: ev.createdAt,
    })
  }

  // Sort by timestamp descending
  changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const displayChanges = changes.slice(0, 8)

  if (displayChanges.length === 0) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Recent Changes" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center' }}>
            No recent skill changes. Updates will appear here as you receive reviews and add
            evidence.
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Recent Changes" />

      <Stack gap={2}>
        {displayChanges.map((change) => (
          <Row
            key={change.id}
            gap={10}
            align="center"
            style={{
              paddingVertical: 8,
              paddingHorizontal: 6,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border[theme].default,
            }}
          >
            {/* Icon */}
            <Stack
              align="center"
              justify="center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor:
                  change.type === 'improvement'
                    ? colors.green[50]
                    : change.type === 'decline'
                      ? colors.error[50]
                      : change.type === 'evidence'
                        ? colors.blue[50]
                        : colors.gray[100],
              }}
            >
              {change.type === 'improvement' && (
                <TrendingUp size={14} color={colors.green[500]} />
              )}
              {change.type === 'decline' && (
                <TrendingDown size={14} color={colors.error[500]} />
              )}
              {change.type === 'evidence' && (
                <FileCheck size={14} color={colors.blue[500]} />
              )}
              {change.type === 'snapshot' && (
                <Camera size={14} color={colors.gray[500]} />
              )}
            </Stack>

            {/* Text */}
            <Stack style={{ flex: 1 }} gap={1}>
              <Text
                style={{ fontSize: 13, color: colors.text[theme].primary }}
                numberOfLines={1}
              >
                {change.label}
              </Text>
              {change.detail && (
                <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
                  {change.detail}
                </Text>
              )}
            </Stack>

            {/* Delta badge */}
            {change.delta && (
              <DeltaBadge
                current={change.delta.current}
                previous={change.delta.previous}
                format="rating"
                size="sm"
              />
            )}

            {/* Time */}
            <Text style={{ fontSize: 10, color: colors.text[theme].tertiary }}>
              {formatRelativeTime(change.timestamp)}
            </Text>
          </Row>
        ))}
      </Stack>
    </DashboardWidget>
  )
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 30) return `${diffDays}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
