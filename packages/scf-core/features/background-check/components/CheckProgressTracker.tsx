import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { memo, useMemo } from 'react'
import { Progress, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  const statusColors = getStatusToneColors(statusMeta.tone)
  const progress = getStatusProgress(
    status,
    normalizedComponents.map((component) => ({ status: component.status }))
  )

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text color="$gray11">Overall progress</Text>
          <Text color="$gray11">{progress}%</Text>
        </Row>
        <Progress value={progress} max={100} backgroundColor="$color3" size="xs">
          <Progress.Indicator animation="bouncy" backgroundColor={statusColors.border} />
        </Progress>
        <Text color="$gray11">{statusMeta.description}</Text>
      </Stack>

      {normalizedComponents.length > 0 && (
        <Stack gap={8}>
          <Text color="$gray11">Component status</Text>
          <Stack gap={8}>
            {normalizedComponents.map((component) => {
              const componentStatusMeta =
                typeof component.status === 'string'
                  ? getStatusMetadata(component.status as BackgroundCheckStatus)
                  : null
              const componentColors = componentStatusMeta
                ? getStatusToneColors(componentStatusMeta.tone)
                : getStatusToneColors('neutral')
              return (
                <Row
                  key={component.id}
                  justify="space-between"
                  align="center"
                  padding="sm"
                  backgroundColor="$color2"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Stack gap={4} flex={1}>
                    <Text color="$gray11">{component.label}</Text>
                    {component.completedAt && (
                      <Text color="$gray11">Completed {formatDate(component.completedAt)}</Text>
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
          <Text color="$gray11">Recent activity</Text>
          <Stack gap={8}>
            {normalizedHistory.map((entry, index) => {
              const historyMeta = getStatusMetadata(entry.status as BackgroundCheckStatus)
              const colors = getStatusToneColors(historyMeta.tone)
              return (
                <Row key={`${entry.status}-${index}`} gap={12} align="center">
                  <Stack width={10} align="center">
                    <Stack
                      width={2}
                      flex={1}
                      backgroundColor="$color5"
                      opacity={index === normalizedHistory.length - 1 ? 0 : 1}
                    />
                  </Stack>
                  <Stack
                    flex={1}
                    padding="sm"
                    backgroundColor="$color2"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="$borderColor"
                    gap={4}
                  >
                    <Text color={colors.text}>{historyMeta.label}</Text>
                    <Row gap={8} align="center">
                      {entry.occurredAt && <Text color="$gray11">{formatDate(entry.occurredAt)}</Text>}
                      {entry.actor && (
                        <>
                          <Separator vertical />
                          <Text color="$gray11">{entry.actor}</Text>
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
        <Text color="$gray11">Key dates</Text>
        <Stack gap={4}>
          <Text color="$gray11">Started: {formatDate(createdAt)}</Text>
          {estimatedCompletionDate && (
            <Text color="$gray11">Estimated completion: {formatDate(estimatedCompletionDate)}</Text>
          )}
          {completedAt && <Text color="$gray11">Completed: {formatDate(completedAt)}</Text>}
          {expiresAt && <Text color="$gray11">Expires: {formatDate(expiresAt)}</Text>}
        </Stack>
      </Stack>
    </Stack>
  )
})
