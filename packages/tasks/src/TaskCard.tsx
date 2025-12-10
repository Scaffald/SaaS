/**
 * TaskCard - Individual task display card
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ChevronRight,
  MessageSquare,
} from '@tamagui/lucide-icons'

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskCardProps extends Omit<YStackProps, 'children'> {
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
    label: 'Review',
    bgColor: '$purple3',
    textColor: '$purple11',
    icon: Clock,
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
    icon: AlertTriangle,
  },
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  low: { color: '$gray9', label: 'Low' },
  medium: { color: '$blue9', label: 'Medium' },
  high: { color: '$orange9', label: 'High' },
  urgent: { color: '$red9', label: 'Urgent' },
}

const CardContainer = styled(YStack, {
  name: 'TaskCard',
  padding: '$3',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  gap: '$2',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$color2',
    borderColor: '$color6',
  },

  pressStyle: {
    scale: 0.99,
    backgroundColor: '$color3',
  },
})

const CardHeader = styled(XStack, {
  name: 'TaskCardHeader',
  alignItems: 'flex-start',
  gap: '$2',
})

const StatusIndicator = styled(XStack, {
  name: 'TaskStatusIndicator',
  width: 24,
  height: 24,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',

  pressStyle: {
    scale: 0.9,
  },
})

const TaskContent = styled(YStack, {
  name: 'TaskContent',
  flex: 1,
  gap: '$1',
})

const TaskTitle = styled(Text, {
  name: 'TaskTitle',
  fontSize: '$3',
  fontWeight: '500',
  color: '$color12',

  variants: {
    completed: {
      true: {
        textDecorationLine: 'line-through',
        color: '$color9',
      },
    },
  } as const,
})

const TaskDescription = styled(Text, {
  name: 'TaskDescription',
  fontSize: '$2',
  color: '$color9',
  numberOfLines: 2,
})

const PriorityIndicator = styled(View, {
  name: 'TaskPriorityIndicator',
  width: 4,
  height: '100%',
  borderRadius: 2,
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
})

const MetaRow = styled(XStack, {
  name: 'TaskMetaRow',
  gap: '$3',
  flexWrap: 'wrap',
  alignItems: 'center',
})

const MetaItem = styled(XStack, {
  name: 'TaskMetaItem',
  alignItems: 'center',
  gap: '$1',
})

const MetaText = styled(Text, {
  name: 'TaskMetaText',
  fontSize: '$2',
  color: '$color9',
})

const DueText = styled(Text, {
  name: 'TaskDueText',
  fontSize: '$2',

  variants: {
    overdue: {
      true: {
        color: '$red11',
        fontWeight: '500',
      },
      false: {
        color: '$color9',
      },
    },
  } as const,
})

const TagsRow = styled(XStack, {
  name: 'TaskTagsRow',
  gap: '$1',
  flexWrap: 'wrap',
})

const TagBadge = styled(XStack, {
  name: 'TaskTagBadge',
  paddingHorizontal: '$2',
  paddingVertical: 2,
  borderRadius: '$full',
  backgroundColor: '$color4',
})

const TagText = styled(Text, {
  name: 'TaskTagText',
  fontSize: '$1',
  color: '$color10',
})

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

  return (
    <CardContainer onPress={onPress} {...props}>
      {priority === 'urgent' || priority === 'high' ? (
        <PriorityIndicator backgroundColor={priorityConf.color} />
      ) : null}

      <CardHeader>
        <StatusIndicator backgroundColor={config.bgColor} onPress={handleStatusToggle}>
          <StatusIcon size={14} color={config.textColor} />
        </StatusIndicator>

        <TaskContent>
          <TaskTitle completed={status === 'completed'}>{title}</TaskTitle>
          {description && <TaskDescription>{description}</TaskDescription>}
        </TaskContent>

        <ChevronRight size={16} color="$color7" />
      </CardHeader>

      <MetaRow>
        {dueDate && (
          <MetaItem>
            <Calendar size={12} color={overdue ? '$red11' : '$color9'} />
            <DueText overdue={overdue}>{formatDate(dueDate)}</DueText>
          </MetaItem>
        )}
        {assignee && (
          <MetaItem>
            <User size={12} color="$color9" />
            <MetaText>{assignee}</MetaText>
          </MetaItem>
        )}
        {commentCount !== undefined && commentCount > 0 && (
          <MetaItem>
            <MessageSquare size={12} color="$color9" />
            <MetaText>{commentCount}</MetaText>
          </MetaItem>
        )}
      </MetaRow>

      {tags && tags.length > 0 && (
        <TagsRow>
          {tags.map((tag) => (
            <TagBadge key={tag}>
              <TagText>{tag}</TagText>
            </TagBadge>
          ))}
        </TagsRow>
      )}
    </CardContainer>
  )
}
