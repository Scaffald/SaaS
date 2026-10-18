import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { LoadFailure } from '@scf/core/components/ui'
import { ROUTES } from '@scf/core/constants/routes'
import { CandidateDetailContent } from '@scf/core/features/office/applications/components/CandidateDetailContent'
import { toATSApplication } from '@scf/core/features/office/applications/transform'
import { useEmployerApplication } from '@scf/core/utils/applications-sdk-hooks'
import { Spinner, Stack, Text } from '@scaffald/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

/**
 * Per-application candidate detail (#537).
 *
 * Candidate detail previously existed only as a modal on the kanban board, so
 * it had no URL: a recruiter could not send a colleague a link to a candidate,
 * and the browser back button did nothing. The modal still exists for a quick
 * look without leaving the board — both render `CandidateDetailContent`.
 */
export default function HiringApplicationDetailRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const id = typeof applicationId === 'string' ? applicationId : ''
  const router = useRouter()

  const { data, isLoading, error, refetch } = useEmployerApplication(id, {
    enabled: id.length > 0,
  })

  // The same transform the board uses, so the two cannot drift.
  const application = useMemo(() => (data ? toATSApplication(data) : null), [data])

  const body = () => {
    if (!id) return <Text color="gray">Missing application ID</Text>

    if (isLoading) {
      return (
        <Stack align="center" gap={8}>
          <Spinner size="lg" />
          <Text>Loading candidate…</Text>
        </Stack>
      )
    }

    if (error) {
      // The API returns 404 rather than 403 for an application outside the
      // caller's organisations, so "not found" here covers both and does not
      // confirm that an id exists.
      return (
        <LoadFailure
          error={error}
          noun="candidate"
          retry={() => refetch()}
          back={{ label: 'Applications', href: ROUTES.HIRING.APPLICATIONS.path }}
        />
      )
    }

    if (!application) {
      return <Text color="secondary">Candidate not found.</Text>
    }

    // "← Applications" in the ScreenHeader is the way back (#1200). The
    // breadcrumb that used to sit above ended in the candidate's name, which
    // then appeared again as the title.
    return (
      <CandidateDetailContent
        application={application}
        back={{
          label: 'Applications',
          onPress: () => router.push(ROUTES.HIRING.APPLICATIONS.path),
        }}
      />
    )
  }

  return (
    <OfficeLayout
      leftContent={
        <ScrollView>
          <Stack gap={16} padding={16}>
            {body()}
          </Stack>
        </ScrollView>
      }
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
