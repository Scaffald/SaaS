import { ROUTES, buildPath } from '@scf/core/constants/routes'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react-native'
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
    <Stack gap={12} paddingHorizontal={12}>
      <Row
        justify="space-between"
        align="flex-start"
        flexWrap="wrap"
        gap={12}
        flexDirection="column"
      >
        <Text accessibilityRole="header">Team jobs</Text>
        <Row gap={8} align="flex-start" flexDirection="column" width="100%">
          <Button
            size={8}
            variant="outline"
            icon={RefreshCcw}
            onPress={() => onRefresh?.()}
            disabled={isLoading}
            accessibilityLabel="Refresh assigned jobs list"
            width="100%"
          >
            Refresh
          </Button>
          <Button
            size={8}
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
          >
            Assign job
          </Button>
        </Row>
      </Row>

      {isLoading ? (
        <Stack align="center" justify="center" paddingVertical={24} gap={8}>
          <Spinner size="lg" />
          <Text color="gray">Loading assigned jobs…</Text>
        </Stack>
      ) : error ? (
        <Card
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color2"
          padding={16}
          gap={12}
        >
          <Row gap={8} align="center">
            <AlertTriangle size={18} color="$yellow10" />
            <Text>Unable to load jobs</Text>
          </Row>
          <Text color="gray">
            {error.message || 'Something went wrong while fetching jobs for this team.'}
          </Text>
          <Button size={12} onPress={() => onRefresh?.()}>
            Try again
          </Button>
        </Card>
      ) : hasJobs ? (
        <Stack gap={12}>
          {derivedJobs.map((job) => (
            <Card
              key={job.id}
              padding={16}
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              gap={12}
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`Job ${job.title}. Status ${job.status ?? 'draft'}. Updated ${job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'recently'}`}
              width="100%"
            >
              <Row
                justify="space-between"
                align="flex-start"
                gap={12}
                flexWrap="wrap"
                flexDirection="column"
              >
                <Stack gap={4} flex={1} width="100%">
                  <Text>{job.title}</Text>
                  <Text color="gray">{job.organization?.name ?? 'No organization'}</Text>
                </Stack>
                <StatusChip status={job.status ?? 'draft'} />
              </Row>
              {job.teamAssignments && job.teamAssignments.length > 0 ? (
                <Row gap={8} flexWrap="wrap">
                  {job.teamAssignments.map((assignment: TeamAssignment) => (
                    <TeamBadge
                      key={`${job.id}-${assignment.teamId}`}
                      name={assignment.team?.name ?? 'Untitled team'}
                      isPrimary={assignment.isPrimary}
                    />
                  ))}
                </Row>
              ) : null}
              <Row gap={8} flexDirection="column" align="stretch">
                <Text color="gray">
                  Updated{' '}
                  {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'recently'}
                </Text>
              </Row>
              <Row width="100%">
                <Button
                  size={12}
                  variant="outline"
                  onPress={() =>
                    router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))
                  }
                  accessibilityLabel={`View job ${job.title}`}
                  width="100%"
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
          padding={16}
          gap={8}
          width="100%"
        >
          <Text>No jobs assigned yet</Text>
          <Text color="gray">
            Assign this team to a job to keep the hiring workflow organized. Jobs assigned to this
            team will appear here.
          </Text>
          <Button
            marginTop={8}
            size={12}
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
      paddingHorizontal={8}
      paddingVertical={4}
      borderWidth={1}
      borderColor={border}
      backgroundColor={background}
      borderRadius={16}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Job status ${normalized}`}
    >
      <Text color={textColor}>{normalized}</Text>
    </Row>
  )
}

function TeamBadge({ name, isPrimary }: { name: string; isPrimary: boolean }) {
  const background = isPrimary ? '$blue4' : '$color3'
  const border = isPrimary ? '$blue8' : '$borderColor'
  const textColor = isPrimary ? '$blue11' : '$color11'

  return (
    <Row
      paddingHorizontal={8}
      paddingVertical={4}
      borderWidth={1}
      borderColor={border}
      backgroundColor={background}
      borderRadius={16}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${name}${isPrimary ? ' primary team' : ''}`}
    >
      <Text color={textColor}>
        {name}
        {isPrimary ? ' • Primary' : ''}
      </Text>
    </Row>
  )
}
