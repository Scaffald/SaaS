import { InquiryHistoryTimeline } from '@scf/core/features/inquiries/components/InquiryHistoryTimeline'
import { InquiryViewOrganization } from '@scf/core/features/inquiries/components/InquiryViewOrganization'
import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { Text, Stack, Spinner } from '@unicornlove/beyond-ui'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native'

export default function OfficeApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam = typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = useInquiryByApplication(applicationParam, { enabled })

  if (!enabled) {
    return (
      <Stack flex={1} align="center" justify="center" padding={16}>
        <Text color="$color11">Missing application ID</Text>
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" padding={16} gap={8}>
        <Spinner size="lg" />
        <Text>Loading inquiry...</Text>
      </Stack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <Stack flex={1} align="center" justify="center" padding={16} gap={8}>
        <Text color="$red10">Unable to load inquiry</Text>
      </Stack>
    )
  }

  const candidateName = data.candidate?.displayName || data.candidate?.username || 'Candidate'
  const jobTitle = data.job?.title || 'Job'

  return (
    <ScrollView>
      <Stack gap={16} padding={16} flex={1}>
        <InquiryViewOrganization
          applicationId={applicationParam}
          inquiryId={data.inquiry.id}
          candidateName={candidateName}
          jobTitle={jobTitle}
        />
        <InquiryHistoryTimeline inquiryId={data.inquiry.id} />
      </Stack>
    </ScrollView>
  )
}
