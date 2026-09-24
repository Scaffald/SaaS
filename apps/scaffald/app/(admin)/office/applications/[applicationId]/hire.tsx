import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { HireScreen } from '@scf/core/features/office/applications/hire/HireScreen'
import { toATSApplication } from '@scf/core/features/office/applications/transform'
import { useEmployerApplication } from '@scf/core/utils/applications-sdk-hooks'
import { Spinner, Stack, Text } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

/**
 * Hiring a candidate (#836). The fee, the acknowledgement and the card were a
 * branch inside the status-change modal; they need the room.
 */
export default function OfficeApplicationHireRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const id = typeof applicationId === 'string' ? applicationId : ''

  const { data, isLoading, error } = useEmployerApplication(id, { enabled: id.length > 0 })

  // The same transform the board and candidate detail use, so the three cannot
  // disagree about what this application is.
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
      return (
        <Stack align="center" gap={8}>
          <Text color="red">Unable to load this candidate</Text>
          <Text color="secondary">{error.message}</Text>
        </Stack>
      )
    }

    if (!application) {
      return <Text color="secondary">Candidate not found.</Text>
    }

    return <HireScreen application={application} />
  }

  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Applications', href: ROUTES.OFFICE.APPLICATIONS.path },
        {
          label: application?.candidate.name ?? 'Candidate',
          href: id ? buildPath(ROUTES.OFFICE.APPLICATIONS.DETAIL, { applicationId: id }) : '',
        },
        { label: 'Hire', href: '' },
      ]}
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
