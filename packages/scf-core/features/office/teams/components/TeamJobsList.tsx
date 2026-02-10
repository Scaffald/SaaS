import { ROUTES, buildPath } from '@scf/core/constants/routes'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle, ArrowRight, RefreshCcw } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <Stack gap="$3" paddingHorizontal="$3" $md={{ paddingHorizontal: undefined }}>
      <Row
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap="$3"
        flexDirection="column"
        $md={{
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
          Team jobs
        </Text>
        <Row
          gap="$2"
          alignItems="flex-start"
          flexDirection="column"
          width="100%"
          $md={{
            alignItems: 'center',
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
        </Row>
      </Row>

      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" paddingVertical="$6" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading assigned jobs…</Text>
        </Stack>
      ) : error ? (
        <Card
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color2"
          padding="$4"
          gap="$3"
        >
          <Row gap="$2" alignItems="center">
            <AlertTriangle size={18} color="$yellow10" />
            <Text fontSize="$5" fontWeight="700">
              Unable to load jobs
            </Text>
          </Row>
          <Text color="$color11">
            {error.message || 'Something went wrong while fetching jobs for this team.'}
          </Text>
          <Button size="$3" onPress={() => onRefresh?.()}>
            Try again
          </Button>
        </Card>
      ) : hasJobs ? (
        <Stack gap="$3">
          {derivedJobs.map((job) => (
            <Card
              key={job.id}
              padding="$4"
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              gap="$3"
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`Job ${job.title}. Status ${job.status ?? 'draft'}. Updated ${job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'recently'}`}
              width="100%"
            >
              <Row
                justifyContent="space-between"
                alignItems="flex-start"
                gap="$3"
                flexWrap="wrap"
                flexDirection="column"
                $md={{ flexDirection: 'row' }}
              >
                <Stack gap="$1" flex={1} width="100%">
                  <Text fontSize="$5" fontWeight="700">
                    {job.title}
                  </Text>
                  <Text color="$color11">{job.organization?.name ?? 'No organization'}</Text>
                </Stack>
                <StatusChip status={job.status ?? 'draft'} />
              </Row>
              {job.teamAssignments && job.teamAssignments.length > 0 ? (
                <Row gap="$2" flexWrap="wrap">
                  {job.teamAssignments.map((assignment: TeamAssignment) => (
                    <TeamBadge
                      key={`${job.id}-${assignment.teamId}`}
                      name={assignment.team?.name ?? 'Untitled team'}
                      isPrimary={assignment.isPrimary}
                    />
                  ))}
                </Row>
              ) : null}
              <Row
                gap="$2"
                flexDirection="column"
                alignItems="stretch"
                $md={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text fontSize="$3" color="$color10">
                  Updated{' '}
                  {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'recently'}
                </Text>
              </Row>
              <Row width="100%">
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() =>
                    router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))
                  }
                  accessibilityLabel={`View job ${job.title}`}
                  width="100%"
                  $md={{ width: undefined }}
                >
                  View job
                </Button>
              </Row>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color2"
          padding="$4"
          gap="$2"
          width="100%"
        >
          <Text fontWeight="600">No jobs assigned yet</Text>
          <Text color="$color11">
            Assign this team to a job to keep the hiring workflow organized. Jobs assigned to this
            team will appear here.
          </Text>
          <Button
            marginTop="$2"
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
    </Stack>
  )
}

function StatusChip({ status }: { status: string }) {
  const normalized = status.replace(/_/g, ' ')
  const isOpen = status === 'open'
  const background = isOpen ? '$green4' : '$color3'
  const border = isOpen ? '$green8' : '$borderColor'
  const textColor = isOpen ? '$green11' : '$color11'

  return (
    <Row
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderWidth={1}
      borderColor={border}
      backgroundColor={background}
      borderRadius="$4"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Job status ${normalized}`}
    >
      <Text fontSize="$2" color={textColor}>
        {normalized}
      </Text>
    </Row>
  )
}

function TeamBadge({ name, isPrimary }: { name: string; isPrimary: boolean }) {
  const background = isPrimary ? '$blue4' : '$color3'
  const border = isPrimary ? '$blue8' : '$borderColor'
  const textColor = isPrimary ? '$blue11' : '$color11'

  return (
    <Row
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderWidth={1}
      borderColor={border}
      backgroundColor={background}
      borderRadius="$4"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${name}${isPrimary ? ' primary team' : ''}`}
    >
      <Text fontSize="$2" color={textColor}>
        {name}
        {isPrimary ? ' • Primary' : ''}
      </Text>
    </Row>
  )
}
