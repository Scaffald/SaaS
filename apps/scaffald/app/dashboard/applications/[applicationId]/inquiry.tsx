import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { InquiryViewCandidate } from '@scf/core/features/inquiries/components/InquiryViewCandidate'
import { api } from '@scf/core/utils/api'
import { Text, YStack } from '@unicornlove/ui'
import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'
import { Spinner } from '@unicornlove/ui'

export default function DashboardApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam = typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = api.inquiries.getByApplication.useQuery(
    { applicationId: applicationParam },
    { enabled }
  )

  const breadcrumbs = [
    { route: ROUTES.DASHBOARD.APPLICATIONS },
    { route: ROUTES.DASHBOARD.APPLICATIONS.INQUIRY },
  ]

  let content: ReactElement

  if (!enabled) {
    content = (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$color11">Missing application ID</Text>
      </YStack>
    )
  } else if (isLoading) {
    content = (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Spinner size="large" />
        <Text>Loading inquiry...</Text>
      </YStack>
    )
  } else if (error || !data || !data.inquiry) {
    content = (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Text color="$red10">Unable to load inquiry</Text>
      </YStack>
    )
  } else {
    content = (
      <YStack gap="$4" padding="$4" flex={1}>
        <InquiryViewCandidate applicationId={applicationParam} inquiryId={data.inquiry.id} />
      </YStack>
    )
  }

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={content} />
}
