import { formatDate } from '@app/core/features/profile/utils/date-formatting'
import { memo, useMemo } from 'react'
import { Progress, Separator, Text, XStack, YStack } from '@unicornlove/ui'

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
    <YStack gap="$4">
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Overall progress
          </Text>
          <Text fontSize="$2" color="$color10">
            {progress}%
          </Text>
        </XStack>
        <Progress value={progress} max={100} backgroundColor="$color3" size="$2">
          <Progress.Indicator animation="bouncy" backgroundColor={statusColors.border} />
        </Progress>
        <Text fontSize="$2" color="$color10">
          {statusMeta.description}
        </Text>
      </YStack>

      {normalizedComponents.length > 0 && (
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Component status
          </Text>
          <YStack gap="$2">
            {normalizedComponents.map((component) => {
              const componentStatusMeta =
                typeof component.status === 'string'
                  ? getStatusMetadata(component.status as BackgroundCheckStatus)
                  : null
              const componentColors = componentStatusMeta
                ? getStatusToneColors(componentStatusMeta.tone)
                : getStatusToneColors('neutral')
              return (
                <XStack
                  key={component.id}
                  justifyContent="space-between"
                  alignItems="center"
                  padding="$3"
                  backgroundColor="$color2"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <YStack gap="$1" flex={1}>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {component.label}
                    </Text>
                    {component.completedAt && (
                      <Text fontSize="$2" color="$color10">
                        Completed {formatDate(component.completedAt)}
                      </Text>
                    )}
                  </YStack>
                  {componentStatusMeta && (
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      backgroundColor={componentColors.background}
                      borderWidth={1}
                      borderColor={componentColors.border}
                      borderRadius="$3"
                    >
                      <Text fontSize="$2" fontWeight="500" color={componentColors.text}>
                        {componentStatusMeta.label}
                      </Text>
                    </XStack>
                  )}
                </XStack>
              )
            })}
          </YStack>
        </YStack>
      )}

      {normalizedHistory.length > 0 && (
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Recent activity
          </Text>
          <YStack gap="$2">
            {normalizedHistory.map((entry, index) => {
              const historyMeta = getStatusMetadata(entry.status as BackgroundCheckStatus)
              const colors = getStatusToneColors(historyMeta.tone)
              return (
                <XStack key={`${entry.status}-${index}`} gap="$3" alignItems="center">
                  <YStack width={10} alignItems="center">
                    <YStack
                      width={2}
                      flex={1}
                      backgroundColor="$color5"
                      opacity={index === normalizedHistory.length - 1 ? 0 : 1}
                    />
                  </YStack>
                  <YStack
                    flex={1}
                    padding="$3"
                    backgroundColor="$color2"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    gap="$1"
                  >
                    <Text fontSize="$3" fontWeight="500" color={colors.text}>
                      {historyMeta.label}
                    </Text>
                    <XStack gap="$2" alignItems="center">
                      {entry.occurredAt && (
                        <Text fontSize="$2" color="$color10">
                          {formatDate(entry.occurredAt)}
                        </Text>
                      )}
                      {entry.actor && (
                        <>
                          <Separator vertical />
                          <Text fontSize="$2" color="$color10">
                            {entry.actor}
                          </Text>
                        </>
                      )}
                    </XStack>
                  </YStack>
                </XStack>
              )
            })}
          </YStack>
        </YStack>
      )}

      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Key dates
        </Text>
        <YStack gap="$1">
          <Text fontSize="$2" color="$color10">
            Started: {formatDate(createdAt)}
          </Text>
          {estimatedCompletionDate && (
            <Text fontSize="$2" color="$color10">
              Estimated completion: {formatDate(estimatedCompletionDate)}
            </Text>
          )}
          {completedAt && (
            <Text fontSize="$2" color="$color10">
              Completed: {formatDate(completedAt)}
            </Text>
          )}
          {expiresAt && (
            <Text fontSize="$2" color="$color10">
              Expires: {formatDate(expiresAt)}
            </Text>
          )}
        </YStack>
      </YStack>
    </YStack>
  )
})
