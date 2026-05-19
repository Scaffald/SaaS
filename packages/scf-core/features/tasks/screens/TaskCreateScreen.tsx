/**
 * TaskCreateScreen
 *
 * Form to file a new Task in an org. Punchlist picker is sourced from
 * usePunchlists (only `active` ones shown). Project picker reuses the
 * work-logs project options endpoint (same construction_projects
 * underneath). Team slug is a free-text input for now — matches the
 * `[team:slug]` convention used elsewhere; a proper picker arrives once
 * `core.work_logs.team_id` lands (tracked as a Dogfood Idea task).
 *
 * Submits via useCreateTaskMutation; navigates to the newly-created
 * task's detail page on success.
 */

import { useMemo, useState } from 'react'
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
  Skeleton,
  Stack,
  TextArea,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ArrowLeft } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import type { TaskPriority, TaskStatus } from '@scaffald/sdk'

import {
  useCreateTaskMutation,
  usePunchlists,
} from '@scf/core/utils/tasks-sdk-hooks'
import { useWorkLogProjectOptions } from '@scf/core/utils/work-logs-sdk-hooks'

type Theme = 'light' | 'dark'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do', in_progress: 'In progress', done: 'Done', cancelled: 'Cancelled',
}
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
}

interface TaskCreateScreenProps {
  organizationId: string | undefined
  orgSlug?: string
}

export function TaskCreateScreen({ organizationId, orgSlug }: TaskCreateScreenProps) {
  const router = useRouter()
  const themeCtx = useThemeContext()
  const theme: Theme = themeCtx?.theme === 'dark' ? 'dark' : 'light'
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [teamSlug, setTeamSlug] = useState('')
  const [punchlistId, setPunchlistId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  const punchlistsQuery = usePunchlists(
    organizationId ? { organizationId, status: 'active' } : undefined,
    { enabled: !!organizationId },
  )
  const projectsQuery = useWorkLogProjectOptions(
    organizationId ? { organizationId } : undefined,
    { enabled: !!organizationId },
  )

  const createMutation = useCreateTaskMutation({
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (orgSlug) {
        router.replace(`/employers/org/${orgSlug}/tasks/${task.id}`)
      }
    },
  })

  const canSubmit = useMemo(
    () => !!organizationId && title.trim().length > 0 && !createMutation.isPending,
    [organizationId, title, createMutation.isPending],
  )

  const handleSubmit = () => {
    if (!canSubmit || !organizationId) return
    createMutation.mutate({
      organizationId,
      title: title.trim(),
      description: description.trim().length > 0 ? description.trim() : undefined,
      status,
      priority,
      dueDate: dueDate.trim().length > 0 ? dueDate.trim() : undefined,
      teamSlug: teamSlug.trim().length > 0 ? teamSlug.trim() : null,
      punchlistId: punchlistId ?? null,
      projectId: projectId ?? null,
    })
  }

  const handleCancel = () => {
    if (orgSlug) router.replace(`/employers/org/${orgSlug}/tasks`)
  }

  if (!organizationId) {
    return (
      <Stack padding={16} gap={12}>
        <Skeleton height={32} width="60%" />
        <Skeleton height={120} />
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
              onPress={handleCancel}
              aria-label="Back to tasks"
            >
              <ArrowLeft size={16} color={colors.icon[theme].muted} />
            </Button>
            <Caption color="tertiary">Back to Tasks</Caption>
          </Row>
        ) : null}

        <Heading level={2}>New task</Heading>

        <Stack gap={8}>
          <Caption color="tertiary">Title</Caption>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="What needs doing?"
            autoFocus
          />
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
              <Input
                value={teamSlug}
                onChangeText={setTeamSlug}
                placeholder="frontend / backend / design / infra"
              />
            </Stack>
          </Box>
        </Row>

        <PickerSection
          label="Punchlist"
          items={(punchlistsQuery.data?.punchlists ?? []).map((p) => ({ id: p.id, label: p.name }))}
          isLoading={punchlistsQuery.isLoading}
          value={punchlistId}
          onChange={setPunchlistId}
          emptyHint="No active punchlists yet."
        />

        <PickerSection
          label="Project"
          items={(projectsQuery.data ?? []).map((p) => ({
            id: p.id,
            label: p.projectNumber ? `${p.name} · ${p.projectNumber}` : p.name,
          }))}
          isLoading={projectsQuery.isLoading}
          value={projectId}
          onChange={setProjectId}
          emptyHint="No projects available."
        />

        <Row gap={8} align="center" wrap>
          <Button variant="filled" onPress={handleSubmit} disabled={!canSubmit}>
            {createMutation.isPending ? 'Creating…' : 'Create task'}
          </Button>
          <Button variant="outline" onPress={handleCancel} disabled={createMutation.isPending}>
            Cancel
          </Button>
        </Row>

        {createMutation.error ? (
          <Caption color="error">
            Create failed: {String(createMutation.error.message)}
          </Caption>
        ) : null}

        <Paragraph color="tertiary">
          A new task lands as <b>To do</b> by default. After creating, you'll
          jump to its detail page where you can refine status, assignee, and
          links to logs.
        </Paragraph>
      </Stack>
    </ScrollView>
  )
}

interface PickerItem { id: string; label: string }

interface PickerSectionProps {
  label: string
  items: PickerItem[]
  isLoading: boolean
  value: string | null
  onChange: (id: string | null) => void
  emptyHint: string
}

function PickerSection({ label, items, isLoading, value, onChange, emptyHint }: PickerSectionProps) {
  return (
    <Stack gap={8}>
      <Caption color="tertiary">{label}</Caption>
      {isLoading ? (
        <Skeleton height={36} />
      ) : items.length === 0 ? (
        <Caption color="tertiary">{emptyHint}</Caption>
      ) : (
        <Row gap={6} wrap>
          <PickerChip selected={value === null} onPress={() => onChange(null)}>None</PickerChip>
          {items.map((item) => (
            <PickerChip
              key={item.id}
              selected={value === item.id}
              onPress={() => onChange(item.id)}
            >
              {item.label}
            </PickerChip>
          ))}
        </Row>
      )}
    </Stack>
  )
}

function PickerChip({
  selected, onPress, children,
}: { selected: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Button variant={selected ? 'filled' : 'outline'} size="sm" onPress={onPress}>
          {children}
        </Button>
      </CardContent>
    </Card>
  )
}
