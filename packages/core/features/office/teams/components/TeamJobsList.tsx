import { ROUTES, buildPath } from '@app/core/constants/routes'
import type { AppRouter } from '@app/supabase/client-types'
import { AlertTriangle, ArrowRight, RefreshCcw } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from 'tamagui'

type OfficeJobsOutput = inferRouterOutputs<AppRouter>['office']['listJobs']
type TeamJobRecord = NonNullable<OfficeJobsOutput['jobs']>[number]
type TeamAssignment = NonNullable<TeamJobRecord['teamAssignments']>[number]

interface TeamJobsListProps {
  teamId: string
  jobs: TeamJobRecord[]
  isLoading: boolean
  error?: Error | null
  onRefresh?: () => void
  onCreateJob?: () => void
}

export function TeamJobsList({
  teamId,
  jobs,
  isLoading,
  error,
  onRefresh,
  onCreateJob,
}: TeamJobsListProps) {
  const router = useRouter()

  const derivedJobs = useMemo(() => jobs ?? [], [jobs])
  const hasJobs = derivedJobs.length > 0

  return (
    <YStack gap="$3" px="$3" $md={{ px: undefined }}>
      <XStack
        justify="space-between"
        items="flex-start"
        flexWrap="wrap"
        gap="$3"
        flexDirection="column"
        $md={{
          items: 'center',
          flexDirection: 'row',
        }}
      >
        <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
          Team jobs
        </Text>
        <XStack
          gap="$2"
          items="flex-start"
          flexDirection="column"
          width="100%"
          $md={{
            items: 'center',
            flexDirection: 'row',
            width: undefined,
          }}
        >
          <Button
            size="$2"
            variant="outlined"
            icon={RefreshCcw}
            onPress={() => onRefresh?.()}
            disabled={isLoading}
            accessibilityLabel="Refresh assigned jobs list"
            width="100%"
            $md={{ width: undefined }}
          >
            Refresh
          </Button>
          <Button
            size="$2"
            icon={ArrowRight}
            onPress={() => {
              if (onCreateJob) {
                onCreateJob()
                return
              }
              router.push({
                pathname: ROUTES.OFFICE.CMS.JOBS.CREATE.path,
                params: { teamId },
              })
            }}
            accessibilityLabel="Assign a job to this team"
            width="100%"
            $md={{ width: undefined }}
          >
            Assign job
          </Button>
        </XStack>
      </XStack>

      {isLoading ? (
        <YStack items="center" justify="center" py="$6" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading assigned jobs…</Text>
        </YStack>
      ) : error ? (
        <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$3">
          <XStack gap="$2" items="center">
            <AlertTriangle size={18} color="$yellow10" />
            <Text fontSize="$5" fontWeight="700">
              Unable to load jobs
            </Text>
          </XStack>
          <Text color="$color11">
            {error.message || 'Something went wrong while fetching jobs for this team.'}
          </Text>
          <Button size="$3" onPress={() => onRefresh?.()}>
            Try again
          </Button>
        </Card>
      ) : hasJobs ? (
        <YStack gap="$3">
          {derivedJobs.map((job) => (
            <Card
              key={job.id}
              p="$4"
              borderWidth={1}
              borderColor="$borderColor"
              bg="$color2"
              gap="$3"
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`Job ${job.title}. Status ${job.status ?? 'draft'}. Updated ${job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'recently'}`}
              width="100%"
            >
              <XStack
                justify="space-between"
                items="flex-start"
                gap="$3"
                flexWrap="wrap"
                flexDirection="column"
                $md={{ flexDirection: 'row' }}
              >
                <YStack gap="$1" flex={1} width="100%">
                  <Text fontSize="$5" fontWeight="700">
                    {job.title}
                  </Text>
                  <Text color="$color11">{job.organization?.name ?? 'No organization'}</Text>
                </YStack>
                <StatusChip status={job.status ?? 'draft'} />
              </XStack>
              {job.teamAssignments && job.teamAssignments.length > 0 ? (
                <XStack gap="$2" flexWrap="wrap">
                  {job.teamAssignments.map((assignment: TeamAssignment) => (
                    <TeamBadge
                      key={`${job.id}-${assignment.teamId}`}
                      name={assignment.team?.name ?? 'Untitled team'}
                      isPrimary={assignment.isPrimary}
                    />
                  ))}
                </XStack>
              ) : null}
              <XStack
                gap="$2"
                flexDirection="column"
                items="stretch"
                $md={{
                  flexDirection: 'row',
                  items: 'center',
                }}
              >
                <Text fontSize="$3" color="$color10">
                  Updated{' '}
                  {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'recently'}
                </Text>
              </XStack>
              <XStack width="100%">
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))}
                  accessibilityLabel={`View job ${job.title}`}
                  width="100%"
                  $md={{ width: undefined }}
                >
                  View job
                </Button>
              </XStack>
            </Card>
          ))}
        </YStack>
      ) : (
        <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$2" width="100%">
          <Text fontWeight="600">No jobs assigned yet</Text>
          <Text color="$color11">
            Assign this team to a job to keep the hiring workflow organized. Jobs assigned to this
            team will appear here.
          </Text>
          <Button
            mt="$2"
            size="$3"
            onPress={() => {
              if (onCreateJob) {
                onCreateJob()
                return
              }
              router.push({
                pathname: ROUTES.OFFICE.CMS.JOBS.CREATE.path,
                params: { teamId },
              })
            }}
            width="100%"
            $md={{ width: undefined }}
          >
            Create job
          </Button>
        </Card>
      )}
    </YStack>
  )
}

function StatusChip({ status }: { status: string }) {
  const normalized = status.replace(/_/g, ' ')
  const isOpen = status === 'open'
  const background = isOpen ? '$green4' : '$color3'
  const border = isOpen ? '$green8' : '$borderColor'
  const textColor = isOpen ? '$green11' : '$color11'

  return (
    <XStack
      px="$2"
      py="$1"
      borderWidth={1}
      borderColor={border}
      bg={background}
      rounded="$4"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Job status ${normalized}`}
    >
      <Text fontSize="$2" color={textColor}>
        {normalized}
      </Text>
    </XStack>
  )
}

function TeamBadge({ name, isPrimary }: { name: string; isPrimary: boolean }) {
  const background = isPrimary ? '$blue4' : '$color3'
  const border = isPrimary ? '$blue8' : '$borderColor'
  const textColor = isPrimary ? '$blue11' : '$color11'

  return (
    <XStack
      px="$2"
      py="$1"
      borderWidth={1}
      borderColor={border}
      bg={background}
      rounded="$4"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${name}${isPrimary ? ' primary team' : ''}`}
    >
      <Text fontSize="$2" color={textColor}>
        {name}
        {isPrimary ? ' • Primary' : ''}
      </Text>
    </XStack>
  )
}
