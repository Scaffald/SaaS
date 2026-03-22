import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useOfficeListJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { Button, DashboardWidget, Text, Stack, Spinner, Row, useThemeContext } from '@scaffald/ui'
import { Pressable } from 'react-native'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'

const STATUS_COLORS: Record<string, string> = {
  draft: '#9e9790',
  open: '#3a7d4c',
  published: '#3a7d4c',
  paused: '#9a6614',
  closed: '#b84f3b',
}

export default function MyListingsRoute() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const { data: memberships } = useOrganizations()

  const orgIds = useMemo(() => {
    if (!memberships?.length) return []
    const seen = new Set<string>()
    return memberships.filter((m) => {
      if (seen.has(m.organization_id)) return false
      seen.add(m.organization_id)
      return true
    }).map((m) => m.organization_id)
  }, [memberships])

  // Fetch jobs for the first org (SDK supports one org_id at a time)
  // TODO: Support multi-org filtering when SDK supports it
  const { data: response, isLoading } = useOfficeListJobs(
    orgIds.length ? { organization_id: orgIds[0] } : undefined,
    { enabled: orgIds.length > 0 }
  )

  const jobs = response?.jobs ?? []

  const breadcrumbs = [
    { route: ROUTES.JOBS },
    { route: ROUTES.JOBS.MY_LISTINGS },
  ]

  const content = isLoading ? (
    <Stack align="center" justify="center" padding={24} gap={12}>
      <Spinner size="lg" />
      <Text style={{ color: colors.text[resolvedTheme].secondary }}>Loading listings...</Text>
    </Stack>
  ) : jobs.length === 0 ? (
    <DashboardWidget gap={12}>
      <Text style={{ color: colors.text[resolvedTheme].primary, fontWeight: '600', fontSize: 16 }}>
        My Listings
      </Text>
      <Text style={{ color: colors.text[resolvedTheme].secondary }}>
        Your organizations have not posted any jobs yet.
      </Text>
      <Button
        size="md"
        onPress={() => router.push(ROUTES.JOBS.path)}
      >
        Browse Jobs
      </Button>
    </DashboardWidget>
  ) : (
    <Stack gap={16}>
      <Text style={{ color: colors.text[resolvedTheme].primary, fontSize: 18, fontWeight: '600' }}>
        My Listings ({jobs.length})
      </Text>
      {jobs.map((job) => (
        <Pressable key={job.id} onPress={() => router.push(`/dashboard/jobs/${job.id}`)}>
          <DashboardWidget gap={8}>
            <Row justify="space-between" align="center">
              <Text
                style={{
                  color: colors.text[resolvedTheme].primary,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {job.title}
              </Text>
              <Text
                style={{
                  color: STATUS_COLORS[job.status] ?? colors.text[resolvedTheme].secondary,
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                {job.status}
              </Text>
            </Row>
            {job.organization?.name && (
              <Text style={{ color: colors.text[resolvedTheme].secondary, fontSize: 13 }}>
                {job.organization.name}
              </Text>
            )}
            {job.location && (
              <Text style={{ color: colors.text[resolvedTheme].tertiary, fontSize: 13 }}>
                {job.location}
              </Text>
            )}
            <Text style={{ color: colors.text[resolvedTheme].tertiary, fontSize: 12 }}>
              Posted {new Date(job.created_at).toLocaleDateString()}
            </Text>
          </DashboardWidget>
        </Pressable>
      ))}
    </Stack>
  )

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={content} />
}
