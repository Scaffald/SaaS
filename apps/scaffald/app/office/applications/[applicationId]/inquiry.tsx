import { InquiryHistoryTimeline } from '@scf/core/features/inquiries/components/InquiryHistoryTimeline'
import { InquiryViewOrganization } from '@scf/core/features/inquiries/components/InquiryViewOrganization'
import { api } from '@scf/core/utils/api'
import { Text, YStack } from '@unicornlove/ui'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView, Spinner } from '@unicornlove/ui'

export default function OfficeApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam = typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = api.inquiries.getByApplication.useQuery(
    { applicationId: applicationParam },
    { enabled }
  )

  if (!enabled) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$color11">Missing application ID</Text>
      </YStack>
    )
  }

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Spinner size="large" />
        <Text>Loading inquiry...</Text>
      </YStack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Text color="$red10">Unable to load inquiry</Text>
      </YStack>
    )
  }

  const candidateName = data.candidate?.displayName || data.candidate?.username || 'Candidate'
  const jobTitle = data.job?.title || 'Job'

  return (
    <ScrollView>
      <YStack gap="$4" padding="$4" flex={1}>
        <InquiryViewOrganization
          applicationId={applicationParam}
          inquiryId={data.inquiry.id}
          candidateName={candidateName}
          jobTitle={jobTitle}
        />
        <InquiryHistoryTimeline inquiryId={data.inquiry.id} />
      </YStack>
    </ScrollView>
  )
}
