import { ScrollView, Spinner } from 'tamagui'
import { useLocalSearchParams } from 'expo-router'
import { Text, YStack } from '@app/ui'

import { api } from '@app/core/utils/api'
import { InquiryViewCandidate } from '@app/core/features/inquiries/components/InquiryViewCandidate'

export default function DashboardApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam = typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = api.inquiries.getByApplication.useQuery(
    { applicationId: applicationParam },
    { enabled }
  )

  if (!enabled) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Text color="$color11">Missing application ID</Text>
      </YStack>
    )
  }

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$2">
        <Spinner size="large" />
        <Text>Loading inquiry...</Text>
      </YStack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$2">
        <Text color="$red10">Unable to load inquiry</Text>
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack gap="$4" p="$4" flex={1}>
        <InquiryViewCandidate applicationId={applicationParam} inquiryId={data.inquiry.id} />
      </YStack>
    </ScrollView>
  )
}
