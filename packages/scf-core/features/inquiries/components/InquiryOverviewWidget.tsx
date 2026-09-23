import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import type { AppRouter } from '@scf/supabase/client-types'
import { Button, Row, SkeletonText, Text, Stack, useThemeContext } from '@scaffald/ui'
import { HomeSection } from '@scf/core/features/dashboard/components/HomeSection'
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
    return <SkeletonText lines={2} />
  }

  const data = response?.data ?? []
  if (data.length === 0) {
    return null
  }

  const entries = data.slice(0, 3)

  return (
    <HomeSection title="Negotiations">
      <Text style={{ color: colors.text[theme].secondary }}>
        {data.length === 1
          ? 'You have 1 active inquiry.'
          : `You have ${data.length} active inquiries.`}
      </Text>
      {entries.map((application: ApplicationRecord) => (
        <Row
          key={application.id}
          gap={12}
          align="center"
          wrap
          paddingVertical={12}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border[theme].default,
          }}
        >
          <Stack gap={2} flex={1} minWidth={180}>
            <Text style={{ color: colors.text[theme].primary }}>
              {application.job?.title ?? 'Role'}
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              {application.job?.location ?? 'Location TBD'}
            </Text>
          </Stack>
          <Button
            size="sm"
            variant="outline"
            onPress={() =>
              router.push(
                buildPath(ROUTES.JOBS.APPLICATIONS.INQUIRY, { applicationId: application.id })
              )
            }
          >
            View inquiry
          </Button>
        </Row>
      ))}
      {data.length > entries.length && (
        <Text style={{ color: colors.text[theme].secondary }}>
          {data.length - entries.length} more in progress
        </Text>
      )}
    </HomeSection>
  )
}
