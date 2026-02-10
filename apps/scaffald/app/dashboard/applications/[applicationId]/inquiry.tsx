import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { InquiryViewCandidate } from '@scf/core/features/inquiries/components/InquiryViewCandidate'
import { api } from '@scf/core/utils/api'
import { Text, Stack, Spinner } from '@unicornlove/beyond-ui'
import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'

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
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$color11">Missing application ID</Text>
      </Stack>
    )
  } else if (isLoading) {
    content = (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Spinner size="large" />
        <Text>Loading inquiry...</Text>
      </Stack>
    )
  } else if (error || !data || !data.inquiry) {
    content = (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Text color="$red10">Unable to load inquiry</Text>
      </Stack>
    )
  } else {
    content = (
      <Stack gap="$4" padding="$4" flex={1}>
        <InquiryViewCandidate applicationId={applicationParam} inquiryId={data.inquiry.id} />
      </Stack>
    )
  }

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={content} />
}
