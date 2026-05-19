/**
 * TaskDetailScreen
 *
 * Editable detail view for a single Task. Read-mostly metadata at the
 * bottom (created_by, created_at, completed_at, source). Editable fields
 * up top with Save / Cancel / Delete controls.
 *
 * Linked work-logs (via core.work_log_tasks) deferred to Phase 3.4 — the
 * SDK/API doesn't expose that join yet.
 */

import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import {
  Box,
  Button,
  Caption,
  Heading,
  Input,
  Paragraph,
  Row,
  SegmentedControl,
  Separator,
  Skeleton,
  Stack,
  TextArea,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ArrowLeft, Trash2 } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { confirmDialog } from '@scf/core/utils/platform'
import type { Task, TaskPriority, TaskStatus } from '@scaffald/sdk'

import {
  useDeleteTaskMutation,
  useTask,
  useUpdateTaskMutation,
} from '@scf/core/utils/tasks-sdk-hooks'

type Theme = 'light' | 'dark'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch { return iso }
}

interface TaskDetailScreenProps {
  taskId: string
  orgSlug?: string
}

export function TaskDetailScreen({ taskId, orgSlug }: TaskDetailScreenProps) {
  const router = useRouter()
  const themeCtx = useThemeContext()
  const theme: Theme = themeCtx?.theme === 'dark' ? 'dark' : 'light'
  const queryClient = useQueryClient()

  const taskQuery = useTask(taskId)
  const task = taskQuery.data

  // Local edit state — initialized from the loaded task and reset when it reloads.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [teamSlug, setTeamSlug] = useState('')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setStatus(task.status)
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setTeamSlug(task.team_slug ?? '')
  }, [task])

  const isDirty = useMemo(() => {
    if (!task) return false
    return (
      title !== task.title ||
      description !== (task.description ?? '') ||
      status !== task.status ||
      priority !== task.priority ||
      dueDate !== (task.due_date ?? '') ||
      teamSlug !== (task.team_slug ?? '')
    )
  }, [task, title, description, status, priority, dueDate, teamSlug])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  const updateMutation = useUpdateTaskMutation({
    onSuccess: () => {
      invalidate()
    },
  })

  const deleteMutation = useDeleteTaskMutation({
    onSuccess: () => {
      invalidate()
      if (orgSlug) router.replace(`/employers/org/${orgSlug}/tasks`)
    },
  })

  const handleSave = () => {
    if (!task) return
    if (title.trim().length === 0) return
    updateMutation.mutate({
      taskId: task.id,
      title: title.trim(),
      description: description.trim().length > 0 ? description.trim() : null,
      status,
      priority,
      dueDate: dueDate.trim().length > 0 ? dueDate.trim() : null,
      teamSlug: teamSlug.trim().length > 0 ? teamSlug.trim() : null,
    })
  }

  const handleCancel = () => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setStatus(task.status)
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setTeamSlug(task.team_slug ?? '')
  }

  const handleDelete = async () => {
    if (!task) return
    const ok = await confirmDialog({
      title: 'Delete task?',
      message: `Delete task "${task.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    deleteMutation.mutate(task.id)
  }

  if (taskQuery.isLoading || !task) {
    return (
      <Stack padding={16} gap={12}>
        <Skeleton height={32} width="60%" />
        <Skeleton height={20} width="40%" />
        <Skeleton height={120} />
      </Stack>
    )
  }

  if (taskQuery.error) {
    return (
      <Stack padding={16} gap={12}>
        <Heading level={3}>Task not found</Heading>
        <Paragraph color="tertiary">
          {String(taskQuery.error.message ?? taskQuery.error)}
        </Paragraph>
        {orgSlug ? (
          <Button variant="outline" onPress={() => router.replace(`/employers/org/${orgSlug}/tasks`)}>
            Back to Tasks
          </Button>
        ) : null}
      </Stack>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
      <Stack padding={16} gap={16}>
        {orgSlug ? (
          <Row align="center" gap={8}>
            <Button
              variant="text"
              size="sm"
              onPress={() => router.replace(`/employers/org/${orgSlug}/tasks`)}
              aria-label="Back to tasks"
            >
              <ArrowLeft size={16} color={colors.icon[theme].muted} />
            </Button>
            <Caption color="tertiary">Back to Tasks</Caption>
          </Row>
        ) : null}

        <Stack gap={8}>
          <Caption color="tertiary">Title</Caption>
          <Input value={title} onChangeText={setTitle} placeholder="What needs doing?" />
        </Stack>

        <Stack gap={8}>
          <Caption color="tertiary">Description</Caption>
          <TextArea
            value={description}
            onChangeText={setDescription}
            placeholder="More context, repro steps, links…"
            numberOfLines={6}
          />
        </Stack>

        <Stack gap={8}>
          <Caption color="tertiary">Status</Caption>
          <SegmentedControl
            segments={STATUSES.map((s) => STATUS_LABELS[s])}
            selectedIndex={STATUSES.indexOf(status)}
            onSelectionChange={(i) => setStatus(STATUSES[i] ?? 'todo')}
          />
        </Stack>

        <Stack gap={8}>
          <Caption color="tertiary">Priority</Caption>
          <SegmentedControl
            segments={PRIORITIES.map((p) => PRIORITY_LABELS[p])}
            selectedIndex={PRIORITIES.indexOf(priority)}
            onSelectionChange={(i) => setPriority(PRIORITIES[i] ?? 'medium')}
          />
        </Stack>

        <Row gap={12} align="flex-start" wrap>
          <Box flex={1} minWidth={180}>
            <Stack gap={8}>
              <Caption color="tertiary">Due date (YYYY-MM-DD)</Caption>
              <Input value={dueDate} onChangeText={setDueDate} placeholder="2026-06-01" />
            </Stack>
          </Box>
          <Box flex={1} minWidth={180}>
            <Stack gap={8}>
              <Caption color="tertiary">Team slug</Caption>
              <Input value={teamSlug} onChangeText={setTeamSlug} placeholder="frontend / backend / design / infra" />
            </Stack>
          </Box>
        </Row>

        <Row gap={8} align="center" wrap>
          <Button
            variant="filled"
            onPress={handleSave}
            disabled={!isDirty || updateMutation.isPending || title.trim().length === 0}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={!isDirty || updateMutation.isPending}
          >
            Cancel
          </Button>
          <Box flex={1} />
          <Button
            variant="outline"
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Row align="center" gap={6}>
              <Trash2 size={14} color={colors.icon[theme].error} />
              <Caption color="error">{deleteMutation.isPending ? 'Deleting…' : 'Delete'}</Caption>
            </Row>
          </Button>
        </Row>

        {updateMutation.error ? (
          <Caption color="error">Save failed: {String(updateMutation.error.message)}</Caption>
        ) : null}
        {deleteMutation.error ? (
          <Caption color="error">Delete failed: {String(deleteMutation.error.message)}</Caption>
        ) : null}

        <Separator />

        <Stack gap={4}>
          <Caption color="tertiary">Metadata</Caption>
          <MetadataRow label="Punchlist" value={task.punchlist_id ?? '—'} />
          <MetadataRow label="Project" value={task.project_id ?? '—'} />
          <MetadataRow label="Assignee" value={task.assignee_user_id ?? 'Unassigned'} />
          <MetadataRow label="Created by" value={task.created_by_user_id} />
          <MetadataRow label="Created at" value={formatDateTime(task.created_at)} />
          <MetadataRow label="Updated at" value={formatDateTime(task.updated_at)} />
          <MetadataRow label="Completed at" value={formatDateTime(task.completed_at)} />
          <MetadataRow label="Source" value={task.source ?? '—'} />
          <MetadataRow label="ID" value={task.id} />
        </Stack>
      </Stack>
    </ScrollView>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <Row gap={8} align="baseline">
      <Box width={110}>
        <Caption color="tertiary">{label}</Caption>
      </Box>
      <Box flex={1}>
        <Caption>{value}</Caption>
      </Box>
    </Row>
  )
}

// Re-export Task type for the route page convenience.
export type { Task }
