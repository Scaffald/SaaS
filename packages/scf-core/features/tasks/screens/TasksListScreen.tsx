/**
 * TasksListScreen
 *
 * Tasks page grouped by Punchlist. Status segmented filter, title +
 * description search, and inline status toggle (todo ↔ done). Task title
 * links to the detail page; "+ New task" button links to the create form.
 *
 * Used by `apps/scaffald/app/(protected)/employers/org/[slug]/tasks/index.tsx`.
 */

import { useCallback, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import {
  Box,
  Button,
  Caption,
  Card,
  CardContent,
  Heading,
  Input,
  Paragraph,
  Row,
  SegmentedControl,
  Separator,
  Skeleton,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { CheckCircle2, Circle, Inbox, Plus, Search } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'

import {
  useCompleteTaskMutation,
  usePunchlists,
  useTasks,
  useUpdateTaskMutation,
} from '@scf/core/utils/tasks-sdk-hooks'
import type { Punchlist, Task, TaskPriority, TaskStatus } from '@scaffald/sdk'

type StatusFilter = 'all' | TaskStatus
type Theme = 'light' | 'dark'

const STATUS_FILTERS: readonly StatusFilter[] = ['all', 'todo', 'in_progress', 'done', 'cancelled']
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
  urgent: 'Urgent',
}

function priorityBg(p: TaskPriority): string {
  switch (p) {
    case 'urgent': return colors.error[100]
    case 'high':   return colors.warning[100]
    case 'medium': return colors.info[100]
    case 'low':
    default:       return colors.gray[100]
  }
}

function statusBg(s: TaskStatus, theme: Theme): string {
  switch (s) {
    case 'done':         return colors.success[100]
    case 'in_progress':  return colors.info[100]
    case 'cancelled':    return colors.bg[theme].muted
    case 'todo':
    default:             return colors.bg[theme].subtle
  }
}

function formatDueDate(d: string | null): string | null {
  if (!d) return null
  try {
    const dt = new Date(`${d}T00:00:00Z`)
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

interface TasksListScreenProps {
  organizationId: string | undefined
  orgSlug?: string
}

export function TasksListScreen({ organizationId, orgSlug }: TasksListScreenProps) {
  const themeCtx = useThemeContext()
  const theme: Theme = themeCtx?.theme === 'dark' ? 'dark' : 'light'
  const queryClient = useQueryClient()
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const punchlistsQuery = usePunchlists(
    organizationId ? { organizationId } : undefined,
    { enabled: !!organizationId },
  )

  const tasksParams = useMemo(() => {
    if (!organizationId) return undefined
    return {
      organizationId,
      pageSize: 200,
      sortField: 'created_at' as const,
      sortDirection: 'desc' as const,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(search.trim().length >= 2 ? { search: search.trim() } : {}),
    }
  }, [organizationId, statusFilter, search])

  const tasksQuery = useTasks(tasksParams, { enabled: !!organizationId })

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [queryClient])

  const completeMutation = useCompleteTaskMutation({ onSuccess: invalidateAll })
  const updateMutation = useUpdateTaskMutation({ onSuccess: invalidateAll })

  const toggleStatus = useCallback(
    (task: Task) => {
      if (task.status === 'done') {
        updateMutation.mutate({ taskId: task.id, status: 'todo' })
      } else {
        completeMutation.mutate({ taskId: task.id })
      }
    },
    [completeMutation, updateMutation],
  )

  const grouped = useMemo(() => {
    const punchlists = punchlistsQuery.data?.punchlists ?? []
    const tasks = tasksQuery.data?.tasks ?? []
    const byPunchlist = new Map<string, Task[]>()
    const noPunchlist: Task[] = []
    for (const t of tasks) {
      if (t.punchlist_id) {
        const arr = byPunchlist.get(t.punchlist_id) ?? []
        arr.push(t)
        byPunchlist.set(t.punchlist_id, arr)
      } else {
        noPunchlist.push(t)
      }
    }
    const sections: { punchlist: Punchlist | null; tasks: Task[] }[] = []
    for (const p of punchlists) {
      const ts = byPunchlist.get(p.id) ?? []
      if (ts.length > 0) sections.push({ punchlist: p, tasks: ts })
    }
    if (noPunchlist.length > 0) sections.push({ punchlist: null, tasks: noPunchlist })
    return sections
  }, [punchlistsQuery.data, tasksQuery.data])

  if (!organizationId) {
    return (
      <Stack padding={16} gap={12}>
        <Text color="tertiary">Loading organization…</Text>
      </Stack>
    )
  }

  const isLoading = tasksQuery.isLoading || punchlistsQuery.isLoading
  const totalCount = tasksQuery.data?.totalCount ?? 0

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Stack padding={16} gap={16}>
        <Row align="center" gap={12}>
          <Stack flex={1} gap={4}>
            <Heading level={2}>Tasks</Heading>
            <Caption color="tertiary">
              {isLoading ? 'Loading…' : `${totalCount} task${totalCount === 1 ? '' : 's'}`}
            </Caption>
          </Stack>
          {orgSlug ? (
            <Button
              variant="filled"
              onPress={() => router.push(`/employers/org/${orgSlug}/tasks/create`)}
            >
              <Row align="center" gap={6}>
                <Plus size={14} color="#ffffff" />
                <Text style={{ color: '#ffffff' }}>New task</Text>
              </Row>
            </Button>
          ) : null}
        </Row>

        <Stack gap={12}>
          <SegmentedControl
            segments={STATUS_FILTERS.map((s) => STATUS_LABELS[s])}
            selectedIndex={STATUS_FILTERS.indexOf(statusFilter)}
            onSelectionChange={(i) => setStatusFilter(STATUS_FILTERS[i] ?? 'all')}
          />
          <Row gap={8} align="center">
            <Search size={16} color={colors.icon[theme].muted} />
            <Box flex={1}>
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search title or description"
              />
            </Box>
          </Row>
        </Stack>

        {isLoading ? (
          <Stack gap={12}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={96} shape="rectangle" />
            ))}
          </Stack>
        ) : grouped.length === 0 ? (
          <Stack align="center" gap={8} padding={32}>
            <Inbox size={32} color={colors.icon[theme].muted} />
            <Heading level={4}>No tasks match these filters</Heading>
            <Paragraph color="tertiary">
              {statusFilter !== 'all' || search
                ? 'Try clearing the filters above.'
                : 'Use the + New task button to file the first one.'}
            </Paragraph>
            {(statusFilter !== 'all' || search) && (
              <Button
                variant="outline"
                onPress={() => {
                  setStatusFilter('all')
                  setSearch('')
                }}
              >
                Clear filters
              </Button>
            )}
            {orgSlug && statusFilter === 'all' && !search && (
              <Button
                variant="filled"
                onPress={() => router.push(`/employers/org/${orgSlug}/tasks/create`)}
              >
                <Row align="center" gap={6}>
                  <Plus size={14} color="#ffffff" />
                  <Text style={{ color: '#ffffff' }}>New task</Text>
                </Row>
              </Button>
            )}
          </Stack>
        ) : (
          <Stack gap={20}>
            {grouped.map(({ punchlist, tasks }) => (
              <Stack key={punchlist?.id ?? 'no-punchlist'} gap={8}>
                <Row align="baseline" gap={8}>
                  <Heading level={4}>
                    {punchlist ? punchlist.name : 'No punchlist'}
                  </Heading>
                  <Caption color="tertiary">
                    {tasks.length} · {punchlist?.status ?? '—'}
                  </Caption>
                </Row>
                {punchlist?.description ? (
                  <Caption color="tertiary">{punchlist.description}</Caption>
                ) : null}
                <Separator />
                <Stack gap={8}>
                  {tasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      theme={theme}
                      onToggle={() => toggleStatus(t)}
                      onOpen={
                        orgSlug
                          ? () => router.push(`/employers/org/${orgSlug}/tasks/${t.id}`)
                          : undefined
                      }
                      isToggling={
                        (completeMutation.isPending && completeMutation.variables?.taskId === t.id) ||
                        (updateMutation.isPending && updateMutation.variables?.taskId === t.id)
                      }
                    />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </ScrollView>
  )
}

interface TaskCardProps {
  task: Task
  theme: Theme
  onToggle: () => void
  onOpen?: () => void
  isToggling: boolean
}

function TaskCard({ task, theme, onToggle, onOpen, isToggling }: TaskCardProps) {
  const due = formatDueDate(task.due_date)
  const isDone = task.status === 'done'
  return (
    <Card>
      <CardContent>
        <Row gap={12} align="flex-start">
          <Button
            variant="text"
            size="sm"
            onPress={onToggle}
            disabled={isToggling}
            aria-label={isDone ? 'Reopen task' : 'Mark task done'}
          >
            {isDone ? (
              <CheckCircle2 size={20} color={colors.icon[theme].success} />
            ) : (
              <Circle size={20} color={colors.icon[theme].muted} />
            )}
          </Button>
          <Stack flex={1} gap={4}>
            <Button
              variant="text"
              size="sm"
              onPress={() => onOpen?.()}
              disabled={!onOpen}
              aria-label={`Open task ${task.title}`}
            >
              <Paragraph
                weight="semibold"
                style={isDone ? { textDecorationLine: 'line-through', opacity: 0.65 } : undefined}
              >
                {task.title}
              </Paragraph>
            </Button>
            {task.description ? (
              <Caption color="tertiary" numberOfLines={2}>
                {task.description}
              </Caption>
            ) : null}
            <Row gap={6} align="center" wrap>
              <Box
                paddingHorizontal={8}
                paddingVertical={2}
                borderRadius={999}
                backgroundColor={statusBg(task.status, theme)}
              >
                <Caption>{STATUS_LABELS[task.status as StatusFilter]}</Caption>
              </Box>
              <Box
                paddingHorizontal={8}
                paddingVertical={2}
                borderRadius={999}
                backgroundColor={priorityBg(task.priority)}
              >
                <Caption>{PRIORITY_LABELS[task.priority]}</Caption>
              </Box>
              {task.team_slug ? (
                <Caption color="tertiary">· {task.team_slug}</Caption>
              ) : null}
              {due ? (
                <Caption color="tertiary">· due {due}</Caption>
              ) : null}
            </Row>
          </Stack>
        </Row>
      </CardContent>
    </Card>
  )
}
