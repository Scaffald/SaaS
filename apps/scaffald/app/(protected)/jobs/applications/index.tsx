import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import { Button, DashboardWidget, Text, Stack, Spinner, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'

type ApplicationListItem = {
  id: string
  status?: string
  job?: { title?: string; location?: string } | null
}

export default function DashboardApplicationsListRoute() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const { data: response, isLoading } = useUserApplications({
    limit: 50,
    offset: 0,
  })

  const breadcrumbs = [
    { route: ROUTES.JOBS },
    { route: ROUTES.JOBS.APPLICATIONS },
  ]

  const data: ApplicationListItem[] = Array.isArray(response?.data) ? response.data : []

  const content = isLoading ? (
    <Stack align="center" justify="center" padding={24} gap={12}>
      <Spinner size="lg" />
      <Text style={{ color: colors.text[theme].secondary }}>Loading applications...</Text>
    </Stack>
  ) : data.length === 0 ? (
    <DashboardWidget gap={12}>
      <Text style={{ color: colors.text[theme].primary }}>My Applications</Text>
      <Text style={{ color: colors.text[theme].secondary }}>
        You have not applied to any jobs yet. Search jobs to get started.
      </Text>
      <Button
        size="md"
        onPress={() => router.push(ROUTES.JOBS.path)}
      >
        Search Jobs
      </Button>
    </DashboardWidget>
  ) : (
    <Stack gap={16}>
      <Text style={{ color: colors.text[theme].primary, fontSize: 18 }}>
        My Applications ({data.length})
      </Text>
      {data.map((application) => (
        <DashboardWidget key={application.id} gap={12}>
          <Stack gap={8}>
            <Text style={{ color: colors.text[theme].primary }}>
              {application.job?.title ?? 'Role'}
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              {application.job?.location ?? 'Location TBD'}
            </Text>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
              Status: {application.status ?? '—'}
            </Text>
            {application.status === 'inquired' && (
              <Button
                size="sm"
                onPress={() =>
                  router.push(
                    buildPath(ROUTES.JOBS.APPLICATIONS.INQUIRY, {
                      applicationId: application.id,
                    })
                  )
                }
              >
                View Inquiry
              </Button>
            )}
          </Stack>
        </DashboardWidget>
      ))}
    </Stack>
  )

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={content} />
}
