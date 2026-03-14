import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { memo, useMemo } from 'react'
import { ProgressBarBase, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import {
  type BackgroundCheckDetail,
  type BackgroundCheckStatus,
  getStatusMetadata,
  getStatusProgress,
  getStatusToneColors,
} from './status.utils'

type ComponentStatusRecord = {
  id: string
  label: string
  status?: BackgroundCheckStatus | string
  completedAt?: string
}

type StatusHistoryRecord = {
  status: BackgroundCheckStatus | string
  occurredAt?: string
  actor?: string
}

interface CheckProgressTrackerProps {
  status: BackgroundCheckDetail['status']
  createdAt: BackgroundCheckDetail['created_at']
  componentStatuses?: BackgroundCheckDetail['component_statuses']
  statusHistory?: BackgroundCheckDetail['status_history']
  estimatedCompletionDate?: string | null
  completedAt?: string | null
  expiresAt?: string | null
}

export const CheckProgressTracker = memo(function CheckProgressTracker({
  status,
  createdAt,
  componentStatuses,
  statusHistory,
  estimatedCompletionDate,
  completedAt,
  expiresAt,
}: CheckProgressTrackerProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const normalizedComponents = useMemo<ComponentStatusRecord[]>(() => {
    if (!Array.isArray(componentStatuses)) return []
    const result: ComponentStatusRecord[] = []
    for (const [index, component] of componentStatuses.entries()) {
      if (!component || typeof component !== 'object') continue
      const data = component as Record<string, unknown>
      const label =
        (typeof data.component_name === 'string' && data.component_name) ||
        (typeof data.check_type_name === 'string' && data.check_type_name) ||
        (typeof data.display_name === 'string' && data.display_name) ||
        `Component ${index + 1}`
      const id = (
        typeof data.check_type_id === 'string' && data.check_type_id.length > 0
          ? data.check_type_id
          : `${index}`
      ) as string
      const statusValue =
        typeof data.status === 'string'
          ? (data.status as BackgroundCheckStatus | string)
          : undefined
      const completedAtValue =
        typeof data.completed_at === 'string' ? (data.completed_at as string) : undefined
      result.push({
        id,
        label,
        status: statusValue,
        completedAt: completedAtValue ?? undefined,
      })
    }
    return result
  }, [componentStatuses])

  const normalizedHistory = useMemo<StatusHistoryRecord[]>(() => {
    if (!Array.isArray(statusHistory)) return []
    const timeline: StatusHistoryRecord[] = []
    for (const item of statusHistory) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      if (typeof record.status !== 'string') continue
      const occurredAt =
        typeof record.occurred_at === 'string' ? (record.occurred_at as string) : undefined
      const actor = typeof record.actor === 'string' ? (record.actor as string) : undefined
      timeline.push({
        status: record.status as string,
        occurredAt,
        actor,
      })
    }
    return timeline.slice(-6).reverse()
  }, [statusHistory])

  const statusMeta = getStatusMetadata(status)
  const _statusColors = getStatusToneColors(statusMeta.tone, t)
  const progress = getStatusProgress(
    status,
    normalizedComponents.map((component) => ({ status: component.status }))
  )

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text color={colors.text[t].secondary}>Overall progress</Text>
          <Text color={colors.text[t].secondary}>{progress}%</Text>
        </Row>
        <ProgressBarBase value={progress} color="primary" />
        <Text color={colors.text[t].secondary}>{statusMeta.description}</Text>
      </Stack>

      {normalizedComponents.length > 0 && (
        <Stack gap={8}>
          <Text color={colors.text[t].secondary}>Component status</Text>
          <Stack gap={8}>
            {normalizedComponents.map((component) => {
              const componentStatusMeta =
                typeof component.status === 'string'
                  ? getStatusMetadata(component.status as BackgroundCheckStatus)
                  : null
              const componentColors = componentStatusMeta
                ? getStatusToneColors(componentStatusMeta.tone, t)
                : getStatusToneColors('neutral', t)
              return (
                <Row
                  key={component.id}
                  justify="space-between"
                  align="center"
                  padding="sm"
                  backgroundColor={colors.bg[t].muted}
                  borderRadius={12}
                  borderWidth={1}
                  borderColor={colors.border[t].default}
                >
                  <Stack gap={4} flex={1}>
                    <Text color={colors.text[t].secondary}>{component.label}</Text>
                    {component.completedAt && (
                      <Text color={colors.text[t].secondary}>Completed {formatDate(component.completedAt)}</Text>
                    )}
                  </Stack>
                  {componentStatusMeta && (
                    <Row
                      paddingHorizontal={8}
                      paddingVertical={4}
                      backgroundColor={componentColors.background}
                      borderWidth={1}
                      borderColor={componentColors.border}
                      borderRadius={12}
                    >
                      <Text color={componentColors.text}>{componentStatusMeta.label}</Text>
                    </Row>
                  )}
                </Row>
              )
            })}
          </Stack>
        </Stack>
      )}

      {normalizedHistory.length > 0 && (
        <Stack gap={8}>
          <Text color={colors.text[t].secondary}>Recent activity</Text>
          <Stack gap={8}>
            {normalizedHistory.map((entry, index) => {
              const historyMeta = getStatusMetadata(entry.status as BackgroundCheckStatus)
              const toneColors = getStatusToneColors(historyMeta.tone, t)
              return (
                <Row key={`${entry.status}-${index}`} gap={12} align="center">
                  <Stack width={10} align="center">
                  <Stack
                    width={2}
                    flex={1}
                    backgroundColor={colors.border[t].default}
                    style={{ opacity: index === normalizedHistory.length - 1 ? 0 : 1 }}
                  />
                  </Stack>
                  <Stack
                    flex={1}
                    padding="sm"
                    backgroundColor={toneColors.background}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor={toneColors.border}
                    gap={4}
                  >
                    <Text color={toneColors.text}>{historyMeta.label}</Text>
                    <Row gap={8} align="center">
                      {entry.occurredAt && (
                        <Text color={colors.text[t].secondary}>{formatDate(entry.occurredAt)}</Text>
                      )}
                      {entry.actor && (
                        <>
                          <Separator orientation="vertical" />
                          <Text color={colors.text[t].secondary}>{entry.actor}</Text>
                        </>
                      )}
                    </Row>
                  </Stack>
                </Row>
              )
            })}
          </Stack>
        </Stack>
      )}

      <Stack gap={8}>
        <Text color={colors.text[t].secondary}>Key dates</Text>
        <Stack gap={4}>
          <Text color={colors.text[t].secondary}>Started: {formatDate(createdAt)}</Text>
          {estimatedCompletionDate && (
            <Text color={colors.text[t].secondary}>Estimated completion: {formatDate(estimatedCompletionDate)}</Text>
          )}
          {completedAt && <Text color={colors.text[t].secondary}>Completed: {formatDate(completedAt)}</Text>}
          {expiresAt && <Text color={colors.text[t].secondary}>Expires: {formatDate(expiresAt)}</Text>}
        </Stack>
      </Stack>
    </Stack>
  )
})
