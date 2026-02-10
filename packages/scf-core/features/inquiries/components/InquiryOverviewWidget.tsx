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
  const { data: response, isLoading } = useUserApplications(
    { status: 'inquired', limit: 5, offset: 0 }
  )

  if (isLoading) {
    return <SkeletonCard variant="profile" />
  }

  const data = response?.data ?? []
  if (data.length === 0) {
    return null
  }

  const entries = data.slice(0, 3)

  return (
    <Stack padding="$4" backgroundColor="$color2" borderRadius="$4" gap="$3">
      <Text fontWeight="600" fontSize="$5">
        Negotiations
      </Text>
      <Text color="$color11">
        {data.length === 1
          ? 'You have 1 active inquiry.'
          : `You have ${data.length} active inquiries.`}
      </Text>
      {entries.map((application: ApplicationRecord) => (
        <Stack
          key={application.id}
          padding="$3"
          gap="$2"
          backgroundColor="$background"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontWeight="600" fontSize="$4">
            {application.job?.title ?? 'Role'}
          </Text>
          <Text fontSize="$2" color="$color11">
            {application.job?.location ?? 'Location TBD'}
          </Text>
          <Button
            size="$3"
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
        <Text fontSize="$2" color="$color11">
          {data.length - entries.length} more in progress
        </Text>
      )}
    </Stack>
  )
}
