import { RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { Button, DashboardWidget, SkeletonCard, Text, YStack } from '@app/ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'

type ApplicationRecord = NonNullable<
  inferRouterOutputs<AppRouter>['applications']['getUserApplications']
>[number]

export function InquiryOverviewWidget() {
  const router = useRouter()
  const { data, isLoading } = api.applications.getUserApplications.useQuery(
    { status: 'inquired', limit: 5, offset: 0 },
    { refetchOnMount: true }
  )

  if (isLoading) {
    return <SkeletonCard variant="profile" />
  }

  if (!data || data.length === 0) {
    return (
      <DashboardWidget>
        <Text fontWeight="600" fontSize="$5">
          Negotiations
        </Text>
        <Text color="$color11">
          Once an employer opens a negotiation, it will appear here so you can review and respond.
        </Text>
      </DashboardWidget>
    )
  }

  const entries = data.slice(0, 3)

  return (
    <YStack p="$4" bg="$color2" rounded="$4" gap="$3">
      <Text fontWeight="600" fontSize="$5">
        Negotiations
      </Text>
      <Text color="$color11">
        {data.length === 1
          ? 'You have 1 active inquiry.'
          : `You have ${data.length} active inquiries.`}
      </Text>
      {entries.map((application: ApplicationRecord) => (
        <YStack
          key={application.id}
          p="$3"
          gap="$2"
          bg="$background"
          rounded="$3"
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
            onPress={() => router.push(RouteBuilder.dashboardApplicationInquiry(application.id))}
          >
            View Inquiry
          </Button>
        </YStack>
      ))}
      {data.length > entries.length && (
        <Text fontSize="$2" color="$color11">
          {data.length - entries.length} more in progress
        </Text>
      )}
    </YStack>
  )
}
