import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { InquiryViewCandidate } from '@scf/core/features/inquiries/components/InquiryViewCandidate'
import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { Text, Stack, Spinner } from '@unicornlove/beyond-ui'
import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'

export default function DashboardApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam = typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = useInquiryByApplication(applicationParam, { enabled })

  const breadcrumbs = [
    { route: ROUTES.DASHBOARD.APPLICATIONS },
    { route: ROUTES.DASHBOARD.APPLICATIONS.INQUIRY },
  ]

  let content: ReactElement

  if (!enabled) {
    content = (
      <Stack align="center" justify="center" padding={16}>
        <Text color="gray">Missing application ID</Text>
      </Stack>
    )
  } else if (isLoading) {
    content = (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Spinner size="lg" />
        <Text>Loading inquiry...</Text>
      </Stack>
    )
  } else if (error || !data || !data.inquiry) {
    content = (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Text color="red">Unable to load inquiry</Text>
      </Stack>
    )
  } else {
    content = (
      <Stack gap={16} padding={16}>
        <InquiryViewCandidate applicationId={applicationParam} inquiryId={data.inquiry.id} />
      </Stack>
    )
  }

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={content} />
}
