import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import type { AppRouter } from '@scf/supabase/client-types'
import { Button, SkeletonCard, Text, Stack } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'

type ApplicationRecord = NonNullable<
  inferRouterOutputs<AppRouter>['applications']['getUserApplications']
>[number]

export function InquiryOverviewWidget() {
  const router = useRouter()
  const { data: response, isLoading } = useUserApplications({
    status: 'inquired',
    limit: 5,
    offset: 0,
  })

  if (isLoading) {
    return <SkeletonCard variant="profile" />
  }

  const data = response?.data ?? []
  if (data.length === 0) {
    return null
  }

  const entries = data.slice(0, 3)

  return (
    <Stack padding={16} backgroundColor="$color2" borderRadius={16} gap={12}>
      <Text>Negotiations</Text>
      <Text color="gray">
        {data.length === 1
          ? 'You have 1 active inquiry.'
          : `You have ${data.length} active inquiries.`}
      </Text>
      {entries.map((application: ApplicationRecord) => (
        <Stack
          key={application.id}
          padding={12}
          gap={8}
          backgroundColor="$background"
          borderRadius={12}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text>{application.job?.title ?? 'Role'}</Text>
          <Text color="gray">{application.job?.location ?? 'Location TBD'}</Text>
          <Button
            size={12}
            onPress={() =>
              router.push(
                buildPath(ROUTES.DASHBOARD.APPLICATIONS.INQUIRY, { applicationId: application.id })
              )
            }
          >
            View Inquiry
          </Button>
        </Stack>
      ))}
      {data.length > entries.length && (
        <Text color="gray">{data.length - entries.length} more in progress</Text>
      )}
    </Stack>
  )
}
