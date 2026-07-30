import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { InquiryViewCandidate } from '@scf/core/features/inquiries/components/InquiryViewCandidate'
import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { Text, Stack, Spinner } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'

export default function DashboardApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam =
    typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = useInquiryByApplication(applicationParam, {
    enabled,
  })

  const breadcrumbs = [
    { route: ROUTES.JOBS },
    { route: ROUTES.JOBS.APPLICATIONS },
    { route: ROUTES.JOBS.APPLICATIONS.INQUIRY },
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
  } else if (error) {
    content = (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Text color="red">Unable to load inquiry</Text>
        <Text color="secondary">{error.message}</Text>
      </Stack>
    )
  } else if (!data || !data.inquiry) {
    // No inquiry raised against this application yet. This used to share the
    // red error branch above, so the ordinary case — most applications never
    // have one — was reported to the candidate as a failure.
    content = (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Text>No inquiry yet</Text>
        <Text color="secondary">
          The employer has not sent an inquiry about this application.
        </Text>
      </Stack>
    )
  } else {
    content = (
      <Stack gap={16} padding={16}>
        <InquiryViewCandidate
          applicationId={applicationParam}
          inquiryId={data.inquiry.id as string}
        />
      </Stack>
    )
  }

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={content} />
}
