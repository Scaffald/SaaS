import { ROUTES } from '@scf/core/constants/routes'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import type { Application } from '@scaffald/sdk/resources/applications'
import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, DashboardWidget, Spinner, Text, Stack, useThemeContext } from '@scaffald/ui'
// router is used for the empty state CTA
import { colors } from '@scaffald/ui/tokens'
import { ApplicationCard } from './ApplicationCard'
import {
  ApplicationStatusFilter,
  getStatusesForFilter,
  type FilterGroup,
} from './ApplicationStatusFilter'

export function ApplicationsList() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const [filter, setFilter] = useState<FilterGroup>('all')

  const { data: response, isLoading } = useUserApplications({ limit: 50, offset: 0 })

  const applications: Application[] = useMemo(() => {
    const items = (response?.data ?? []) as Application[]
    const allowedStatuses = getStatusesForFilter(filter)
    if (!allowedStatuses) return items
    return items.filter((app) => allowedStatuses.includes(app.status))
  }, [response?.data, filter])

  const totalCount = (response?.data ?? []).length

  if (isLoading) {
    return (
      <Stack align="center" justify="center" padding="xl" gap={12}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading applications...</Text>
      </Stack>
    )
  }

  if (totalCount === 0) {
    return (
      <DashboardWidget gap={12}>
        <Text style={{ color: colors.text[theme].primary, fontSize: 18, fontWeight: '600' }}>
          My Applications
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          You haven't applied to any jobs yet. Search for jobs to get started.
        </Text>
        <Button size="md" color="primary" onPress={() => router.push(ROUTES.JOBS.path)}>
          Search Jobs
        </Button>
      </DashboardWidget>
    )
  }

  return (
    <Stack gap={16}>
      <Text style={{ color: colors.text[theme].primary, fontSize: 18, fontWeight: '600' }}>
        My Applications ({totalCount})
      </Text>

      <ApplicationStatusFilter selected={filter} onSelect={setFilter} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap={12}>
          {applications.length === 0 ? (
            <DashboardWidget>
              <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
                No applications match this filter.
              </Text>
            </DashboardWidget>
          ) : (
            applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))
          )}
        </Stack>
      </ScrollView>
    </Stack>
  )
}
