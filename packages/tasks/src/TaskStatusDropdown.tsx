/**
 * TaskStatusDropdown - Dropdown component for changing task status
 * REQ-288: Tamagui UI Component Library
 * REQ-259: Auto-save on change with optimistic UI updates
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Loader2,
} from '@tamagui/lucide-icons'
import { useState, useRef, useCallback } from 'react'

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked' | 'cancelled'

export interface TaskStatusDropdownProps extends Omit<YStackProps, 'children' | 'onValueChange'> {
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
   * Auto-save handler - called when status changes in auto-save mode
   * Should return a promise that resolves on success or rejects on failure
   * REQ-259: Auto-save on change with optimistic UI
   */
  onSave?: (taskId: string, newStatus: TaskStatus, oldStatus: TaskStatus) => Promise<void>
  /** Callback fired on successful save (REQ-259) */
  onSaveSuccess?: (taskId: string, status: TaskStatus) => void
  /** Callback fired on save error with the error (REQ-259) */
  onSaveError?: (error: Error, taskId: string, attemptedStatus: TaskStatus) => void
}

const statusConfig: Record<
  TaskStatus,
  { label: string; bgColor: string; textColor: string; icon: typeof CheckCircle }
> = {
  todo: {
    label: 'To Do',
    bgColor: '$gray3',
    textColor: '$gray11',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    bgColor: '$blue3',
    textColor: '$blue11',
    icon: Clock,
  },
  review: {
    label: 'In Review',
    bgColor: '$purple3',
    textColor: '$purple11',
    icon: AlertTriangle,
  },
  completed: {
    label: 'Completed',
    bgColor: '$green3',
    textColor: '$green11',
    icon: CheckCircle,
  },
  blocked: {
    label: 'Blocked',
    bgColor: '$red3',
    textColor: '$red11',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: '$gray3',
    textColor: '$gray9',
    icon: XCircle,
  },
}

const DropdownContainer = styled(YStack, {
  name: 'TaskStatusDropdown',
  position: 'relative',
})

const DropdownTrigger = styled(XStack, {
  name: 'TaskStatusDropdownTrigger',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$md',
  alignItems: 'center',
  gap: '$2',
  cursor: 'pointer',

  variants: {
    size: {
      sm: {
        paddingHorizontal: '$2',
        paddingVertical: '$1',
      },
      md: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
      },
      lg: {
        paddingHorizontal: '$4',
        paddingVertical: '$3',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },

  hoverStyle: {
    opacity: 0.8,
  },

  pressStyle: {
    opacity: 0.7,
  },
})

const DropdownMenu = styled(YStack, {
  name: 'TaskStatusDropdownMenu',
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '$1',
  backgroundColor: '$background',
  borderRadius: '$md',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
  zIndex: 100,
  elevation: 4,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
})

const DropdownItem = styled(XStack, {
  name: 'TaskStatusDropdownItem',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  alignItems: 'center',
  gap: '$2',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$color2',
  },

  pressStyle: {
    backgroundColor: '$color3',
  },
})

const StatusLabel = styled(Text, {
  name: 'TaskStatusLabel',
  fontSize: '$3',
  fontWeight: '500',
})

/**
 * REQ-259: Loading indicator component for auto-save state
 */
const LoadingIndicator = styled(View, {
  name: 'TaskStatusDropdownLoading',
  width: 14,
  height: 14,
  alignItems: 'center',
  justifyContent: 'center',
})

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
  // REQ-259: Track loading state for auto-save
  const [isLoading, setIsLoading] = useState(false)
  // REQ-259: Track previous status for rollback on error
  const previousStatusRef = useRef<TaskStatus | null>(null)
  // REQ-259: Track current save request to handle rapid changes
  const saveRequestIdRef = useRef<number>(0)

  const currentStatus = statusConfig[value]
  const StatusIcon = currentStatus.icon

  /**
   * REQ-259: Handle status selection with optimistic UI and auto-save
   *
   * Flow:
   * 1. Store previous status for potential rollback
   * 2. Immediately update UI (optimistic update)
   * 3. If auto-save enabled (taskId + onSave), save to server
   * 4. On success: keep new status, notify success
   * 5. On failure: rollback to previous status, notify error
   */
  const handleSelect = useCallback(async (newStatus: TaskStatus) => {
    if (disabled || isLoading) return

    const oldStatus = value

    // Don't do anything if selecting the same status
    if (newStatus === oldStatus) {
      setIsOpen(false)
      return
    }

    // Store previous status for potential rollback
    previousStatusRef.current = oldStatus

    // Close dropdown immediately
    setIsOpen(false)

    // REQ-259: Optimistic UI update - call onValueChange immediately
    onValueChange(newStatus)

    // If auto-save is enabled (taskId and onSave provided), perform the save
    if (taskId && onSave) {
      // Increment request ID to track this specific save request
      const currentRequestId = ++saveRequestIdRef.current

      setIsLoading(true)

      try {
        await onSave(taskId, newStatus, oldStatus)

        // Only process if this is still the latest request
        if (currentRequestId === saveRequestIdRef.current) {
          setIsLoading(false)
          previousStatusRef.current = null

          // REQ-259: Notify success
          if (onSaveSuccess) {
            onSaveSuccess(taskId, newStatus)
          }
        }
      } catch (error) {
        // Only process if this is still the latest request
        if (currentRequestId === saveRequestIdRef.current) {
          setIsLoading(false)

          // REQ-259: Rollback to previous status on error
          if (previousStatusRef.current !== null) {
            onValueChange(previousStatusRef.current)
          }
          previousStatusRef.current = null

          // REQ-259: Notify error
          if (onSaveError) {
            onSaveError(
              error instanceof Error ? error : new Error('Failed to save status'),
              taskId,
              newStatus
            )
          }
        }
      }
    }
  }, [disabled, isLoading, value, taskId, onSave, onValueChange, onSaveSuccess, onSaveError])

  // Determine if dropdown should be functionally disabled
  const isDisabled = disabled || isLoading

  return (
    <DropdownContainer {...props}>
      <DropdownTrigger
        backgroundColor={currentStatus.bgColor}
        size={size}
        disabled={isDisabled}
        onPress={() => !isDisabled && setIsOpen(!isOpen)}
        // REQ-259: Add data attribute for testing loading state
        data-loading={isLoading ? 'true' : undefined}
      >
        <StatusIcon size={14} color={currentStatus.textColor} />
        <StatusLabel color={currentStatus.textColor}>
          {currentStatus.label}
        </StatusLabel>
        {/* REQ-259: Show loading spinner or chevron based on loading state */}
        {isLoading ? (
          <LoadingIndicator>
            <Loader2 size={14} color={currentStatus.textColor} />
          </LoadingIndicator>
        ) : (
          <ChevronDown size={14} color={currentStatus.textColor} />
        )}
      </DropdownTrigger>

      {isOpen && !isLoading && (
        <DropdownMenu>
          {options.map((status) => {
            const config = statusConfig[status]
            const Icon = config.icon
            return (
              <DropdownItem
                key={status}
                onPress={() => handleSelect(status)}
                backgroundColor={status === value ? '$color2' : undefined}
              >
                <View
                  width={24}
                  height={24}
                  borderRadius="$full"
                  backgroundColor={config.bgColor}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon size={12} color={config.textColor} />
                </View>
                <StatusLabel color="$color12">{config.label}</StatusLabel>
              </DropdownItem>
            )
          })}
        </DropdownMenu>
      )}
    </DropdownContainer>
  )
}
