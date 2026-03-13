import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import type { AppRouter } from '@scf/supabase/client-types'
import { Button, DashboardWidget, DashboardWidgetHeader, SkeletonCard, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'

type ApplicationRecord = NonNullable<
  inferRouterOutputs<AppRouter>['applications']['getUserApplications']
>[number]

export function InquiryOverviewWidget() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const { data: response, isLoading } = useUserApplications({
    status: 'inquired',
    limit: 5,
    offset: 0,
  })

  if (isLoading) {
    return <SkeletonCard hasAvatar textLines={2} />
  }

  const data = response?.data ?? []
  if (data.length === 0) {
    return null
  }

  const entries = data.slice(0, 3)

  return (
    <DashboardWidget gap={12}>
      <DashboardWidgetHeader title="Negotiations" />
      <Text style={{ color: colors.text[theme].secondary }}>
        {data.length === 1
          ? 'You have 1 active inquiry.'
          : `You have ${data.length} active inquiries.`}
      </Text>
      {entries.map((application: ApplicationRecord) => (
        <Stack
          key={application.id}
          padding="sm"
          gap={8}
          backgroundColor="$background"
          borderRadius={12}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text style={{ color: colors.text[theme].primary }}>
            {application.job?.title ?? 'Role'}
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            {application.job?.location ?? 'Location TBD'}
          </Text>
          <Button
            size="sm"
            onPress={() =>
              router.push(
                buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.INQUIRY, { applicationId: application.id })
              )
            }
          >
            View Inquiry
          </Button>
        </Stack>
      ))}
      {data.length > entries.length && (
        <Text style={{ color: colors.text[theme].secondary }}>
          {data.length - entries.length} more in progress
        </Text>
      )}
    </DashboardWidget>
  )
}
