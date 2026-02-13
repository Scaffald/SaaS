/**
 * TaskCard - Individual task display card
 */

import { Stack, Row, Box, Text } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ChevronRight,
  MessageSquare,
} from 'lucide-react-native'
import { Pressable } from 'react-native'

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskCardProps extends Omit<StackProps, 'children'> {
  /** Task title */
  title: string
  /** Task description */
  description?: string
  /** Task status */
  status: TaskStatus
  /** Task priority */
  priority?: TaskPriority
  /** Due date */
  dueDate?: string
  /** Assignee name */
  assignee?: string
  /** Tags/labels */
  tags?: string[]
  /** Number of comments */
  commentCount?: number
  /** Whether the task is overdue */
  overdue?: boolean
  /** Click handler */
  onPress?: () => void
  /** Status change handler */
  onStatusChange?: (status: TaskStatus) => void
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
    label: 'Review',
    bgColor: colors.violet[100],
    textColor: colors.violet[700],
    icon: Clock,
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
    icon: AlertTriangle,
  },
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  low: { color: colors.gray[500], label: 'Low' },
  medium: { color: colors.info[600], label: 'Medium' },
  high: { color: colors.orange[600], label: 'High' },
  urgent: { color: colors.error[600], label: 'Urgent' },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function TaskCard({
  title,
  description,
  status,
  priority = 'medium',
  dueDate,
  assignee,
  tags,
  commentCount,
  overdue = false,
  onPress,
  onStatusChange,
  ...props
}: TaskCardProps) {
  const config = statusConfig[status]
  const priorityConf = priorityConfig[priority]
  const StatusIcon = config.icon

  const handleStatusToggle = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (onStatusChange) {
      const newStatus = status === 'completed' ? 'todo' : 'completed'
      onStatusChange(newStatus)
    }
  }

  const isPriorityHighlight = priority === 'urgent' || priority === 'high'

  return (
    <Pressable onPress={onPress}>
      <Stack
        style={{
          padding: spacing[12],
          backgroundColor: colors.bg?.primary ?? colors.gray[50],
          borderRadius: borderRadius.l,
          borderWidth: 1,
          borderColor: colors.border?.default ?? colors.gray[200],
          borderLeftWidth: isPriorityHighlight ? 4 : undefined,
          borderLeftColor: isPriorityHighlight ? priorityConf.color : undefined,
          gap: spacing[8],
        }}
        {...props}
      >
        <Row align="flex-start" gap={spacing[8]}>
          <Pressable onPress={handleStatusToggle}>
            <Box
              style={{
                width: 24,
                height: 24,
                borderRadius: borderRadius.max,
                backgroundColor: config.bgColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StatusIcon size={14} color={config.textColor} />
            </Box>
          </Pressable>

          <Stack flex={1} gap={spacing[4]}>
            <Text
              size="md"
              weight="medium"
              style={{
                color: status === 'completed' ? colors.gray[500] : colors.gray[800],
                textDecorationLine: status === 'completed' ? 'line-through' : undefined,
              }}
            >
              {title}
            </Text>
            {description && (
              <Text size="sm" style={{ color: colors.gray[500], maxWidth: '100%' }} numberOfLines={2}>
                {description}
              </Text>
            )}
          </Stack>

          <ChevronRight size={16} color={colors.gray[400]} />
        </Row>

        <Row gap={spacing[12]} wrap align="center">
          {dueDate && (
            <Row align="center" gap={spacing[4]}>
              <Calendar size={12} color={overdue ? colors.error[700] : colors.gray[500]} />
              <Text
                size="sm"
                style={{
                  color: overdue ? colors.error[700] : colors.gray[500],
                  fontWeight: overdue ? '500' : undefined,
                }}
              >
                {formatDate(dueDate)}
              </Text>
            </Row>
          )}
          {assignee && (
            <Row align="center" gap={spacing[4]}>
              <User size={12} color={colors.gray[500]} />
              <Text size="sm" style={{ color: colors.gray[500] }}>
                {assignee}
              </Text>
            </Row>
          )}
          {commentCount !== undefined && commentCount > 0 && (
            <Row align="center" gap={spacing[4]}>
              <MessageSquare size={12} color={colors.gray[500]} />
              <Text size="sm" style={{ color: colors.gray[500] }}>
                {commentCount}
              </Text>
            </Row>
          )}
        </Row>

        {tags && tags.length > 0 && (
          <Row gap={spacing[4]} wrap>
            {tags.map((tag) => (
              <Box
                key={tag}
                style={{
                  paddingHorizontal: spacing[8],
                  paddingVertical: 2,
                  borderRadius: borderRadius.max,
                  backgroundColor: colors.gray[200],
                }}
              >
                <Text size="xs" style={{ color: colors.gray[600] }}>
                  {tag}
                </Text>
              </Box>
            ))}
          </Row>
        )}
      </Stack>
    </Pressable>
  )
}
