/**
 * TaskStatusDropdown - Dropdown component for changing task status.
 * Auto-save on change with optimistic UI updates.
 */

import { Stack, Row, Text } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react-native'
import { useState, useRef, useCallback } from 'react'
import { Pressable, View } from 'react-native'

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked' | 'cancelled'

export interface TaskStatusDropdownProps extends Omit<StackProps, 'children' | 'onValueChange'> {
  /** Current status value */
  value: TaskStatus
  /** Callback when status changes (required for controlled mode) */
  onValueChange: (status: TaskStatus) => void
  /** Available status options (defaults to all) */
  options?: TaskStatus[]
  /** Whether the dropdown is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Task ID - enables auto-save mode when provided */
  taskId?: string
  /**
   * Auto-save handler - called when status changes in auto-save mode.
   * Should return a promise that resolves on success or rejects on failure.
   */
  onSave?: (taskId: string, newStatus: TaskStatus, oldStatus: TaskStatus) => Promise<void>
  /** Callback fired on successful save */
  onSaveSuccess?: (taskId: string, status: TaskStatus) => void
  /** Callback fired on save error with the error */
  onSaveError?: (error: Error, taskId: string, attemptedStatus: TaskStatus) => void
}

const statusConfig: Record<
  TaskStatus,
  { label: string; bgColor: string; textColor: string; icon: typeof CheckCircle }
> = {
  todo: {
    label: 'To Do',
    bgColor: colors.gray[200],
    textColor: colors.gray[700],
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    bgColor: colors.info[100],
    textColor: colors.info[700],
    icon: Clock,
  },
  review: {
    label: 'In Review',
    bgColor: colors.violet[100],
    textColor: colors.violet[700],
    icon: AlertTriangle,
  },
  completed: {
    label: 'Completed',
    bgColor: colors.success[100],
    textColor: colors.success[700],
    icon: CheckCircle,
  },
  blocked: {
    label: 'Blocked',
    bgColor: colors.error[100],
    textColor: colors.error[700],
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: colors.gray[200],
    textColor: colors.gray[500],
    icon: XCircle,
  },
}

const sizePadding = {
  sm: { paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  md: { paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  lg: { paddingHorizontal: spacing[16], paddingVertical: spacing[12] },
} as const

export function TaskStatusDropdown({
  value,
  onValueChange,
  options = ['todo', 'in-progress', 'review', 'completed', 'blocked', 'cancelled'],
  disabled = false,
  size = 'md',
  taskId,
  onSave,
  onSaveSuccess,
  onSaveError,
  ...props
}: TaskStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const previousStatusRef = useRef<TaskStatus | null>(null)
  const saveRequestIdRef = useRef<number>(0)

  const currentStatus = statusConfig[value]
  const StatusIcon = currentStatus.icon

  const handleSelect = useCallback(
    async (newStatus: TaskStatus) => {
      if (disabled || isLoading) return

      const oldStatus = value

      if (newStatus === oldStatus) {
        setIsOpen(false)
        return
      }

      previousStatusRef.current = oldStatus
      setIsOpen(false)
      onValueChange(newStatus)

      if (taskId && onSave) {
        const currentRequestId = ++saveRequestIdRef.current
        setIsLoading(true)

        try {
          await onSave(taskId, newStatus, oldStatus)

          if (currentRequestId === saveRequestIdRef.current) {
            setIsLoading(false)
            previousStatusRef.current = null
            onSaveSuccess?.(taskId, newStatus)
          }
        } catch (error) {
          if (currentRequestId === saveRequestIdRef.current) {
            setIsLoading(false)
            if (previousStatusRef.current !== null) {
              onValueChange(previousStatusRef.current)
            }
            previousStatusRef.current = null
            onSaveError?.(
              error instanceof Error ? error : new Error('Failed to save status'),
              taskId,
              newStatus
            )
          }
        }
      }
    },
    [disabled, isLoading, value, taskId, onSave, onValueChange, onSaveSuccess, onSaveError]
  )

  const isDisabled = disabled || isLoading

  return (
    <Stack style={{ position: 'relative' }} {...props}>
      <Pressable
        onPress={() => !isDisabled && setIsOpen(!isOpen)}
        data-loading={isLoading ? 'true' : undefined}
      >
        <Row
          align="center"
          gap={spacing[8]}
          style={{
            ...sizePadding[size],
            borderRadius: borderRadius.m,
            backgroundColor: currentStatus.bgColor,
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <StatusIcon size={14} color={currentStatus.textColor} />
          <Text size="md" weight="medium" style={{ color: currentStatus.textColor }}>
            {currentStatus.label}
          </Text>
          {isLoading ? (
            <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={14} color={currentStatus.textColor} />
            </View>
          ) : (
            <ChevronDown size={14} color={currentStatus.textColor} />
          )}
        </Row>
      </Pressable>

      {isOpen && !isLoading && (
        <Stack
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: spacing[4],
            backgroundColor: colors.bg?.primary ?? colors.gray[50],
            borderRadius: borderRadius.m,
            borderWidth: 1,
            borderColor: colors.border?.default ?? colors.gray[200],
            overflow: 'hidden',
            zIndex: 100,
            elevation: 4,
            shadowColor: colors.gray[900],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          {options.map((status) => {
            const config = statusConfig[status]
            const Icon = config.icon
            return (
              <Pressable key={status} onPress={() => handleSelect(status)}>
                <Row
                  align="center"
                  gap={spacing[8]}
                  style={{
                    paddingHorizontal: spacing[12],
                    paddingVertical: spacing[8],
                    backgroundColor: status === value ? colors.gray[100] : undefined,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: borderRadius.max,
                      backgroundColor: config.bgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={12} color={config.textColor} />
                  </View>
                  <Text size="md" weight="medium" style={{ color: colors.gray[800] }}>
                    {config.label}
                  </Text>
                </Row>
              </Pressable>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
