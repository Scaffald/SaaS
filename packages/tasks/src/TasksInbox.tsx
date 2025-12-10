/**
 * TasksInbox - Task inbox/list view with filtering
 */

import { styled, YStack, XStack, Text, View, type YStackProps, ScrollView } from 'tamagui'
import {
  Inbox,
  Clock,
  CheckCircle,
  AlertTriangle,
} from '@tamagui/lucide-icons'
import { useState } from 'react'
import { TaskCard, type TaskStatus, type TaskPriority } from './TaskCard'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  assignee?: string
  tags?: string[]
  commentCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface TasksInboxProps extends Omit<YStackProps, 'children'> {
  /** Array of tasks */
  tasks: Task[]
  /** Title for the inbox */
  title?: string
  /** Current filter */
  filter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  /** Callback when filter changes */
  onFilterChange?: (filter: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed') => void
  /** Callback when task is clicked */
  onTaskPress?: (task: Task) => void
  /** Callback when task status changes */
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
  /** Whether to show filter tabs */
  showFilters?: boolean
  /** Maximum height before scrolling */
  maxHeight?: number
}

const filterConfig = {
  all: { label: 'All', icon: Inbox },
  today: { label: 'Today', icon: Clock },
  upcoming: { label: 'Upcoming', icon: Clock },
  overdue: { label: 'Overdue', icon: AlertTriangle },
  completed: { label: 'Completed', icon: CheckCircle },
} as const

const InboxContainer = styled(YStack, {
  name: 'TasksInbox',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const InboxHeader = styled(XStack, {
  name: 'TasksInboxHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const InboxTitle = styled(Text, {
  name: 'TasksInboxTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const TaskCount = styled(Text, {
  name: 'TasksInboxCount',
  fontSize: '$2',
  color: '$color9',
  backgroundColor: '$color4',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
})

const FilterTabs = styled(XStack, {
  name: 'TasksInboxFilterTabs',
  padding: '$2',
  gap: '$1',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  backgroundColor: '$color1',
})

const FilterTab = styled(XStack, {
  name: 'TasksInboxFilterTab',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$md',
  alignItems: 'center',
  gap: '$1',
  cursor: 'pointer',

  variants: {
    active: {
      true: {
        backgroundColor: '$blue3',
      },
      false: {
        backgroundColor: 'transparent',
      },
    },
  } as const,

  hoverStyle: {
    backgroundColor: '$color3',
  },
})

const FilterTabText = styled(Text, {
  name: 'FilterTabText',
  fontSize: '$2',
  fontWeight: '500',

  variants: {
    active: {
      true: {
        color: '$blue11',
      },
      false: {
        color: '$color9',
      },
    },
  } as const,
})

const FilterTabCount = styled(Text, {
  name: 'FilterTabCount',
  fontSize: '$1',
  fontWeight: '500',
  paddingHorizontal: '$1',
  borderRadius: '$full',

  variants: {
    active: {
      true: {
        backgroundColor: '$blue5',
        color: '$blue11',
      },
      false: {
        backgroundColor: '$color4',
        color: '$color9',
      },
    },
  } as const,
})

const TasksList = styled(YStack, {
  name: 'TasksInboxList',
  padding: '$2',
  gap: '$2',
})

const EmptyState = styled(YStack, {
  name: 'TasksInboxEmptyState',
  padding: '$8',
  alignItems: 'center',
  gap: '$3',
})

const EmptyIcon = styled(View, {
  name: 'TasksInboxEmptyIcon',
  width: 64,
  height: 64,
  borderRadius: '$full',
  backgroundColor: '$color3',
  alignItems: 'center',
  justifyContent: 'center',
})

const EmptyTitle = styled(Text, {
  name: 'TasksInboxEmptyTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color11',
})

const EmptyText = styled(Text, {
  name: 'TasksInboxEmptyText',
  fontSize: '$3',
  color: '$color9',
  textAlign: 'center',
})

const SectionHeader = styled(XStack, {
  name: 'TasksSectionHeader',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  alignItems: 'center',
  gap: '$2',
})

const SectionTitle = styled(Text, {
  name: 'TasksSectionTitle',
  fontSize: '$2',
  fontWeight: '600',
  color: '$color9',
  textTransform: 'uppercase',
})

const SectionLine = styled(View, {
  name: 'TasksSectionLine',
  flex: 1,
  height: 1,
  backgroundColor: '$borderColor',
})

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isOverdue(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function isUpcoming(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  return date >= today && date <= nextWeek
}

export function TasksInbox({
  tasks,
  title = 'Tasks',
  filter = 'all',
  onFilterChange,
  onTaskPress,
  onTaskStatusChange,
  showFilters = true,
  maxHeight,
  ...props
}: TasksInboxProps) {
  const [activeFilter, setActiveFilter] = useState(filter)

  const handleFilterChange = (newFilter: typeof filter) => {
    setActiveFilter(newFilter)
    onFilterChange?.(newFilter)
  }

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((task) => {
    switch (activeFilter) {
      case 'today':
        return task.dueDate && isToday(task.dueDate) && task.status !== 'completed'
      case 'upcoming':
        return task.dueDate && isUpcoming(task.dueDate) && task.status !== 'completed'
      case 'overdue':
        return task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed'
      case 'completed':
        return task.status === 'completed'
      default:
        return true
    }
  })

  // Count tasks for each filter
  const counts = {
    all: tasks.length,
    today: tasks.filter((t) => t.dueDate && isToday(t.dueDate) && t.status !== 'completed').length,
    upcoming: tasks.filter((t) => t.dueDate && isUpcoming(t.dueDate) && t.status !== 'completed').length,
    overdue: tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  // Group tasks by status for display
  const groupedTasks = {
    overdue: filteredTasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'),
    today: filteredTasks.filter(
      (t) => t.dueDate && isToday(t.dueDate) && !isOverdue(t.dueDate) && t.status !== 'completed'
    ),
    upcoming: filteredTasks.filter(
      (t) => t.status !== 'completed' && (!t.dueDate || (!isToday(t.dueDate) && !isOverdue(t.dueDate)))
    ),
    completed: filteredTasks.filter((t) => t.status === 'completed'),
  }

  const emptyMessages = {
    all: 'No tasks yet',
    today: 'No tasks due today',
    upcoming: 'No upcoming tasks',
    overdue: 'No overdue tasks',
    completed: 'No completed tasks',
  }

  return (
    <InboxContainer {...props}>
      <InboxHeader>
        <XStack alignItems="center" gap="$2">
          <Inbox size={18} color="$color11" />
          <InboxTitle>{title}</InboxTitle>
        </XStack>
        <TaskCount>{filteredTasks.length}</TaskCount>
      </InboxHeader>

      {showFilters && (
        <FilterTabs>
          {(Object.keys(filterConfig) as Array<keyof typeof filterConfig>).map((key) => {
            const config = filterConfig[key]
            const FilterIcon = config.icon
            const isActive = activeFilter === key
            return (
              <FilterTab key={key} active={isActive} onPress={() => handleFilterChange(key)}>
                <FilterIcon size={14} color={isActive ? '$blue11' : '$color9'} />
                <FilterTabText active={isActive}>{config.label}</FilterTabText>
                {counts[key] > 0 && <FilterTabCount active={isActive}>{counts[key]}</FilterTabCount>}
              </FilterTab>
            )
          })}
        </FilterTabs>
      )}

      <ScrollView maxHeight={maxHeight}>
        {filteredTasks.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <Inbox size={32} color="$color7" />
            </EmptyIcon>
            <EmptyTitle>{emptyMessages[activeFilter]}</EmptyTitle>
            <EmptyText>Tasks will appear here when they match this filter</EmptyText>
          </EmptyState>
        ) : (
          <TasksList>
            {activeFilter === 'all' && groupedTasks.overdue.length > 0 && (
              <>
                <SectionHeader>
                  <AlertTriangle size={12} color="$red9" />
                  <SectionTitle>Overdue</SectionTitle>
                  <SectionLine />
                </SectionHeader>
                {groupedTasks.overdue.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    overdue
                    onPress={() => onTaskPress?.(task)}
                    onStatusChange={(status) => onTaskStatusChange?.(task.id, status)}
                  />
                ))}
              </>
            )}

            {activeFilter === 'all' && groupedTasks.today.length > 0 && (
              <>
                <SectionHeader>
                  <Clock size={12} color="$blue9" />
                  <SectionTitle>Today</SectionTitle>
                  <SectionLine />
                </SectionHeader>
                {groupedTasks.today.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onPress={() => onTaskPress?.(task)}
                    onStatusChange={(status) => onTaskStatusChange?.(task.id, status)}
                  />
                ))}
              </>
            )}

            {activeFilter !== 'all'
              ? filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    overdue={task.dueDate ? isOverdue(task.dueDate) : false}
                    onPress={() => onTaskPress?.(task)}
                    onStatusChange={(status) => onTaskStatusChange?.(task.id, status)}
                  />
                ))
              : groupedTasks.upcoming.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onPress={() => onTaskPress?.(task)}
                    onStatusChange={(status) => onTaskStatusChange?.(task.id, status)}
                  />
                ))}

            {activeFilter === 'all' && groupedTasks.completed.length > 0 && (
              <>
                <SectionHeader>
                  <CheckCircle size={12} color="$green9" />
                  <SectionTitle>Completed</SectionTitle>
                  <SectionLine />
                </SectionHeader>
                {groupedTasks.completed.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onPress={() => onTaskPress?.(task)}
                    onStatusChange={(status) => onTaskStatusChange?.(task.id, status)}
                  />
                ))}
              </>
            )}
          </TasksList>
        )}
      </ScrollView>
    </InboxContainer>
  )
}
