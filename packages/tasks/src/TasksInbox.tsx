/**
 * TasksInbox - Task inbox/list view with filtering
 */

import { Stack, Row, Box, Text } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
import { Inbox, Clock, CheckCircle, AlertTriangle } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Pressable } from 'react-native'
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

export interface TasksInboxProps extends Omit<StackProps, 'children'> {
  tasks: Task[]
  title?: string
  filter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  onFilterChange?: (filter: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed') => void
  onTaskPress?: (task: Task) => void
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
  showFilters?: boolean
  maxHeight?: number
}

const filterConfig = {
  all: { label: 'All', icon: Inbox },
  today: { label: 'Today', icon: Clock },
  upcoming: { label: 'Upcoming', icon: Clock },
  overdue: { label: 'Overdue', icon: AlertTriangle },
  completed: { label: 'Completed', icon: CheckCircle },
} as const

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isOverdue(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

function isUpcoming(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  return date.getTime() >= today.getTime() && date.getTime() <= nextWeek.getTime()
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

  const counts = {
    all: tasks.length,
    today: tasks.filter((t) => t.dueDate && isToday(t.dueDate) && t.status !== 'completed').length,
    upcoming: tasks.filter(
      (t) => t.dueDate && isUpcoming(t.dueDate) && t.status !== 'completed'
    ).length,
    overdue: tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed')
      .length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  const groupedTasks = {
    overdue: filteredTasks.filter(
      (t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    ),
    today: filteredTasks.filter(
      (t) =>
        t.dueDate &&
        isToday(t.dueDate) &&
        !isOverdue(t.dueDate) &&
        t.status !== 'completed'
    ),
    upcoming: filteredTasks.filter(
      (t) =>
        t.status !== 'completed' &&
        (!t.dueDate || (!isToday(t.dueDate) && !isOverdue(t.dueDate)))
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
    <Stack
      style={{
        backgroundColor: colors.bg?.primary ?? colors.gray[50],
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border?.default ?? colors.gray[200],
        overflow: 'hidden',
      }}
      {...props}
    >
      <Row
        align="center"
        justify="space-between"
        style={{
          padding: spacing[12],
          backgroundColor: colors.gray[100],
          borderBottomWidth: 1,
          borderBottomColor: colors.border?.default ?? colors.gray[200],
        }}
      >
        <Row align="center" gap={spacing[8]}>
          <Inbox size={18} color={colors.gray[700]} />
          <Text size="lg" weight="semibold" style={{ color: colors.gray[800] }}>
            {title}
          </Text>
        </Row>
        <Box
          style={{
            backgroundColor: colors.gray[200],
            paddingHorizontal: spacing[8],
            paddingVertical: spacing[4],
            borderRadius: borderRadius.max,
          }}
        >
          <Text size="sm" style={{ color: colors.gray[500] }}>
            {filteredTasks.length}
          </Text>
        </Box>
      </Row>

      {showFilters && (
        <Row
          gap={spacing[4]}
          style={{
            padding: spacing[8],
            borderBottomWidth: 1,
            borderBottomColor: colors.border?.default ?? colors.gray[200],
            backgroundColor: colors.gray[50],
          }}
        >
          {(Object.keys(filterConfig) as Array<keyof typeof filterConfig>).map((key) => {
            const config = filterConfig[key]
            const FilterIcon = config.icon
            const isActive = activeFilter === key
            return (
              <Pressable key={key} onPress={() => handleFilterChange(key)}>
                <Row
                  align="center"
                  gap={spacing[4]}
                  style={{
                    paddingHorizontal: spacing[12],
                    paddingVertical: spacing[8],
                    borderRadius: borderRadius.m,
                    backgroundColor: isActive ? colors.info[100] : 'transparent',
                  }}
                >
                  <FilterIcon size={14} color={isActive ? colors.info[700] : colors.gray[500]} />
                  <Text
                    size="sm"
                    weight="medium"
                    style={{ color: isActive ? colors.info[700] : colors.gray[500] }}
                  >
                    {config.label}
                  </Text>
                  {counts[key] > 0 && (
                    <Box
                      style={{
                        paddingHorizontal: spacing[4],
                        borderRadius: borderRadius.max,
                        backgroundColor: isActive ? colors.info[200] : colors.gray[200],
                      }}
                    >
                      <Text
                        size="xs"
                        weight="medium"
                        style={{ color: isActive ? colors.info[700] : colors.gray[500] }}
                      >
                        {counts[key]}
                      </Text>
                    </Box>
                  )}
                </Row>
              </Pressable>
            )
          })}
        </Row>
      )}

      <ScrollView style={{ maxHeight }} contentContainerStyle={{ padding: spacing[8] }}>
        {filteredTasks.length === 0 ? (
          <Stack
            align="center"
            gap={spacing[12]}
            style={{ padding: spacing[32] }}
          >
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: borderRadius.max,
                backgroundColor: colors.gray[200],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Inbox size={32} color={colors.gray[400]} />
            </Box>
            <Text size="lg" weight="semibold" style={{ color: colors.gray[700] }}>
              {emptyMessages[activeFilter]}
            </Text>
            <Text size="md" style={{ color: colors.gray[500], textAlign: 'center' }}>
              Tasks will appear here when they match this filter
            </Text>
          </Stack>
        ) : (
          <Stack gap={spacing[8]}>
            {activeFilter === 'all' && groupedTasks.overdue.length > 0 && (
              <>
                <Row
                  align="center"
                  gap={spacing[8]}
                  style={{
                    paddingHorizontal: spacing[8],
                    paddingVertical: spacing[4],
                  }}
                >
                  <AlertTriangle size={12} color={colors.error[600]} />
                  <Text size="sm" weight="semibold" style={{ color: colors.gray[500] }}>
                    Overdue
                  </Text>
                  <Box style={{ flex: 1, height: 1, backgroundColor: colors.border?.default }} />
                </Row>
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
                <Row
                  align="center"
                  gap={spacing[8]}
                  style={{
                    paddingHorizontal: spacing[8],
                    paddingVertical: spacing[4],
                  }}
                >
                  <Clock size={12} color={colors.info[600]} />
                  <Text size="sm" weight="semibold" style={{ color: colors.gray[500] }}>
                    Today
                  </Text>
                  <Box style={{ flex: 1, height: 1, backgroundColor: colors.border?.default }} />
                </Row>
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
                <Row
                  align="center"
                  gap={spacing[8]}
                  style={{
                    paddingHorizontal: spacing[8],
                    paddingVertical: spacing[4],
                  }}
                >
                  <CheckCircle size={12} color={colors.success[600]} />
                  <Text size="sm" weight="semibold" style={{ color: colors.gray[500] }}>
                    Completed
                  </Text>
                  <Box style={{ flex: 1, height: 1, backgroundColor: colors.border?.default }} />
                </Row>
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
          </Stack>
        )}
      </ScrollView>
    </Stack>
  )
}
