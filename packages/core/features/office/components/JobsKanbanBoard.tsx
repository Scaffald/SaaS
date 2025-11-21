import { ROUTES, buildPath } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { DraggableCard, DroppableColumn } from '@app/ui'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { type GetThemeValueForKey, Text, XStack, YStack } from 'tamagui'
import { JobCard } from './JobCard'

type JobListOutput = inferRouterOutputs<AppRouter>['office']['listJobs']
type Job = JobListOutput['jobs'][number]

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed'

const STATUSES: JobStatus[] = ['draft', 'open', 'paused', 'closed']

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  paused: 'Paused',
  closed: 'Closed',
}

const STATUS_COLORS: Record<JobStatus, GetThemeValueForKey<'backgroundColor'>> = {
  draft: '$gray9',
  open: '$green9',
  paused: '$yellow9',
  closed: '$red9',
}

interface JobsKanbanBoardProps {
  jobs: Job[]
  onJobUpdate?: () => void
}

export function JobsKanbanBoard({ jobs, onJobUpdate }: JobsKanbanBoardProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)

  const updateJobMutation = api.office.updateJob.useMutation({
    onSuccess: () => {
      setUpdatingJobId(null)
      onJobUpdate?.()
    },
    onError: (error: unknown) => {
      console.error('Failed to update job status:', error)
      setUpdatingJobId(null)
      // TODO: Show error toast
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
      status: newStatus,
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
        <XStack gap="$3" pb="$4" px="$4">
          {STATUSES.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              color={STATUS_COLORS[status]}
              jobs={groupedJobs[status]}
              onJobPress={handleJobPress}
              isUpdating={updatingJobId !== null}
            />
          ))}
        </XStack>
      </ScrollView>

      <DragOverlay>
        {activeJob ? (
          <YStack width={300} opacity={0.9}>
            <JobCard job={activeJob} onPress={() => {}} />
          </YStack>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface StatusColumnProps {
  status: JobStatus
  label: string
  color: GetThemeValueForKey<'backgroundColor'>
  jobs: Job[]
  onJobPress: (job: Job) => void
  isUpdating: boolean
}

function StatusColumn({ status, label, color, jobs, onJobPress, isUpdating }: StatusColumnProps) {
  return (
    <DroppableColumn id={status} items={jobs.map((job) => job.id)}>
      <YStack
        data-testid={`kanban-column-${status}`}
        width={320}
        bg="$color2"
        rounded="$4"
        p="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        {/* Column Header */}
        <XStack justify="space-between" items="center" mb="$3">
          <XStack gap="$2" items="center">
            <YStack width={8} height={8} rounded="$10" bg={color} />
            <Text fontWeight="600" fontSize="$4">
              {label}
            </Text>
          </XStack>
          <YStack bg="$color5" px="$2" py="$1" rounded="$2">
            <Text fontSize="$2" fontWeight="600">
              {jobs.length}
            </Text>
          </YStack>
        </XStack>

        {/* Job Cards */}
        <YStack gap="$3" flex={1}>
          {jobs.length === 0 ? (
            <YStack
              p="$4"
              bg="$color3"
              rounded="$3"
              items="center"
              justify="center"
              style={{ minHeight: 100 }}
            >
              <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
                No jobs
              </Text>
            </YStack>
          ) : (
            jobs.map((job) => (
              <DraggableCard key={job.id} id={job.id} disabled={isUpdating}>
                <YStack opacity={isUpdating ? 0.5 : 1}>
                  <JobCard job={job} onPress={() => onJobPress(job)} />
                </YStack>
              </DraggableCard>
            ))
          )}
        </YStack>
      </YStack>
    </DroppableColumn>
  )
}
