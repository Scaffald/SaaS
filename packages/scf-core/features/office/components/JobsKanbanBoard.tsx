import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useOfficeUpdateJobMutation } from '@scf/core/utils/jobs-sdk-hooks'
import { useThemeContext } from '@scaffald/ui'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Text, Row, Stack, useToast } from '@scaffald/ui'
import { logger } from '@scf/core'
import { JobCard } from './JobCard'
import { colors } from '@scaffald/ui/tokens'
import type { Job } from '@scaffald/sdk/resources/jobs'

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed'

const STATUSES: JobStatus[] = ['draft', 'open', 'paused', 'closed']

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  paused: 'Paused',
  closed: 'Closed',
}

const getStatusColors = (theme: 'light' | 'dark'): Record<JobStatus, string> => ({
  draft: colors.bg[theme].muted,
  open: theme === 'light' ? colors.green[50] : colors.green[900],
  paused: theme === 'light' ? colors.yellow[50] : colors.yellow[900],
  closed: theme === 'light' ? colors.error[50] : colors.error[900],
})

/** Local droppable column using @dnd-kit (scaffald does not export DroppableColumn) */
function DroppableColumn({
  id,
  children,
}: {
  id: string
  align?: string[]
  children?: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { type: 'column' } })
  return (
    <View ref={(el) => setNodeRef(el as unknown as HTMLElement | null)} style={isOver ? { opacity: 0.9 } : undefined}>
      {children}
    </View>
  )
}

/** Local draggable card using @dnd-kit (scaffald does not export DraggableCard) */
function DraggableCard({
  id,
  disabled,
  children,
}: {
  id: string
  disabled?: boolean
  children?: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: { type: 'card' },
    disabled,
  })
  const { tabIndex: _tabIndex, role: _role, ...restAttributes } = attributes
  return (
    <View ref={(el) => setNodeRef(el as unknown as HTMLElement | null)} {...(restAttributes as object)} {...listeners}>
      {children}
    </View>
  )
}

interface JobsKanbanBoardProps {
  jobs: Job[]
  onJobUpdate?: () => void
}

export function JobsKanbanBoard({ jobs, onJobUpdate }: JobsKanbanBoardProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const toast = useToast()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)

  const updateJobMutation = useOfficeUpdateJobMutation({
    onSuccess: () => {
      setUpdatingJobId(null)
      onJobUpdate?.()
    },
    onError: (error: unknown) => {
      logger.error('Failed to update job status', error, { context: 'JobsKanbanBoard' })
      setUpdatingJobId(null)
      toast.show({
        title: 'Failed to update job status',
        message: 'Please try again.',
        variant: 'error',
        duration: 5000,
      })
    },
  })

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    })
  )

  // Group jobs by status
  const groupedJobs = useMemo(() => {
    return STATUSES.reduce(
      (acc, status) => {
        acc[status] = jobs.filter((job) => job.status === status)
        return acc
      },
      {} as Record<JobStatus, Job[]>
    )
  }, [jobs])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const jobId = active.id as string
    const newStatus = over.id as JobStatus

    // Find the job being moved
    const job = jobs.find((j) => j.id === jobId)
    if (!job || job.status === newStatus) return

    // Update job status
    setUpdatingJobId(jobId)
    await updateJobMutation.mutateAsync({
      id: jobId,
      params: { status: newStatus },
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handleJobPress = (job: Job) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))
  }

  // Find active job for drag overlay
  const activeJob = activeId ? jobs.find((job) => job.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row gap={12} paddingBottom={16} paddingHorizontal={16}>
          {STATUSES.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              color={getStatusColors(theme)[status]}
              jobs={groupedJobs[status]}
              onJobPress={handleJobPress}
              isUpdating={updatingJobId !== null}
            />
          ))}
        </Row>
      </ScrollView>

      <DragOverlay>
        {activeJob ? (
          <Stack width={300} style={{ opacity: 0.9 }}>
            <JobCard job={activeJob} onPress={() => {}} />
          </Stack>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface StatusColumnProps {
  status: JobStatus
  label: string
  color: string
  jobs: Job[]
  onJobPress: (job: Job) => void
  isUpdating: boolean
}

function StatusColumn({ status, label, color, jobs, onJobPress, isUpdating }: StatusColumnProps) {
  const { theme } = useThemeContext()
  return (
    <DroppableColumn id={status} align={jobs.map((job) => job.id)}>
      <Stack
        data-testid={`kanban-column-${status}`}
        width={320}
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderWidth: 1,
          borderColor: colors.border[theme].default,
        }}
        borderRadius={16}
        padding="sm"
      >
        {/* Column Header */}
        <Row justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Row gap={8} align="center">
            <Stack width={8} height={8} borderRadius={10} style={{ backgroundColor: color }} />
            <Text>{label}</Text>
          </Row>
          <Stack
            style={{ backgroundColor: colors.bg[theme].muted }}
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
          >
            <Text>{jobs.length}</Text>
          </Stack>
        </Row>

        {/* Job Cards */}
        <Stack gap={12} flex={1}>
          {jobs.length === 0 ? (
            <Stack
              padding="md"
              style={{ backgroundColor: colors.bg[theme].muted, minHeight: 100 }}
              borderRadius={12}
              align="center"
              justify="center"
            >
              <Text style={{ color: colors.text[theme].secondary }} align="center">
                No jobs
              </Text>
            </Stack>
          ) : (
            jobs.map((job) => (
              <DraggableCard key={job.id} id={job.id} disabled={isUpdating}>
                <Stack style={{ opacity: isUpdating ? 0.5 : 1 }}>
                  <JobCard job={job} onPress={() => onJobPress(job)} />
                </Stack>
              </DraggableCard>
            ))
          )}
        </Stack>
      </Stack>
    </DroppableColumn>
  )
}
