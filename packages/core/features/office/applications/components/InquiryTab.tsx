import { YStack, Spinner, Text } from '@app/ui'
import { InquiryViewOrganization } from '@app/core/features/inquiries/components/InquiryViewOrganization'
import { api } from '@app/core/utils/api'

interface InquiryTabProps {
  applicationId: string
  inquiryId: string
  candidateName: string
  jobTitle: string
}

export function InquiryTab({
  applicationId,
  inquiryId,
  candidateName,
  jobTitle,
}: InquiryTabProps) {
  const { data: inquiryData, isLoading } = api.inquiries.getByApplication.useQuery({
    applicationId,
  })

  if (isLoading) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Spinner size="large" />
        <Text>Loading inquiry...</Text>
      </YStack>
    )
  }

  if (!inquiryData || !inquiryData.inquiry) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text color="$color11">No inquiry found for this application</Text>
      </YStack>
    )
  }

  return (
    <InquiryViewOrganization
      applicationId={applicationId}
      inquiryId={inquiryId}
      candidateName={candidateName}
      jobTitle={jobTitle}
    />
  )
}

