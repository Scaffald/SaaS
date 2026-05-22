import { ROUTES } from '@scf/core/constants/routes'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import type { Application } from '@scaffald/sdk/resources/applications'
import { Share2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, DashboardWidget, Row, Spinner, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ApplicationCard } from './ApplicationCard'
import {
  ApplicationStatusFilter,
  getStatusesForFilter,
  type FilterGroup,
} from './ApplicationStatusFilter'
import { RecentApplicationUpdates } from './RecentApplicationUpdates'

const FILTER_KEYS: FilterGroup[] = ['all', 'active', 'interview', 'offers', 'closed']

function buildFilterCounts(applications: Application[]): Record<FilterGroup, number> {
  const counts = {
    all: applications.length,
    active: 0,
    interview: 0,
    offers: 0,
    closed: 0,
  } as Record<FilterGroup, number>

  for (const key of FILTER_KEYS) {
    if (key === 'all') continue
    const allowed = getStatusesForFilter(key)
    if (!allowed) continue
    counts[key] = applications.filter((app) => allowed.includes(app.status)).length
  }

  return counts
}

export function ApplicationsList() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const [filter, setFilter] = useState<FilterGroup>('all')

  const { data: response, isLoading } = useUserApplications({ limit: 50, offset: 0 })

  const allApplications: Application[] = useMemo(
    () => (response?.data ?? []) as Application[],
    [response?.data]
  )

  const counts = useMemo(() => buildFilterCounts(allApplications), [allApplications])

  const applications: Application[] = useMemo(() => {
    const allowedStatuses = getStatusesForFilter(filter)
    if (!allowedStatuses) return allApplications
    return allApplications.filter((app) => allowedStatuses.includes(app.status))
  }, [allApplications, filter])

  const totalCount = allApplications.length

  if (isLoading) {
    return (
      <Stack align="center" justify="center" padding="xl" gap={12}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading applications...</Text>
      </Stack>
    )
  }

  // SC-37: stronger empty-state with two pathways forward.
  // Highlights the share-profile feature (SC-40) so workers without any
  // applications still leave the screen with something to do.
  if (totalCount === 0) {
    return (
      <Stack gap={16}>
        <Text style={{ color: colors.text[theme].primary, fontSize: 22, fontWeight: '700' }}>
          My Applications
        </Text>

        <DashboardWidget gap={12}>
          <Stack gap={6}>
            <Text style={{ color: colors.text[theme].primary, fontSize: 16, fontWeight: '600' }}>
              No applications yet
            </Text>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 14, lineHeight: 20 }}>
              When you apply to a job, you'll see its status here — from Applied
              to Hired — plus next-step nudges as the employer reviews you.
            </Text>
          </Stack>
          <Row gap={8} wrap>
            <Button
              size="md"
              color="primary"
              variant="filled"
              onPress={() => router.push(ROUTES.JOBS.path)}
            >
              Browse jobs
            </Button>
            <Button
              size="md"
              variant="outline"
              onPress={() => router.push(ROUTES.PROFILE.path)}
            >
              Polish my profile
            </Button>
          </Row>
        </DashboardWidget>

        <DashboardWidget gap={8}>
          <Row gap={8} align="center">
            <Share2 size={16} color={colors.primary[600]} />
            <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '600' }}>
              Tip — share your profile while you search
            </Text>
          </Row>
          <Text style={{ color: colors.text[theme].secondary, fontSize: 13, lineHeight: 19 }}>
            Tap "Share profile" on your Profile screen to get a QR code +
            shareable URL. Employers and instructors can review you without
            even creating an account.
          </Text>
        </DashboardWidget>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <Text style={{ color: colors.text[theme].primary, fontSize: 22, fontWeight: '700' }}>
        My Applications ({totalCount})
      </Text>

      {/* SC-37: surface the most recently-moved applications first so the
          screen feels like an active dashboard, not a log. Hidden when no
          status transitions have happened yet. */}
      <RecentApplicationUpdates applications={allApplications} />

      <ApplicationStatusFilter selected={filter} onSelect={setFilter} counts={counts} />

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
