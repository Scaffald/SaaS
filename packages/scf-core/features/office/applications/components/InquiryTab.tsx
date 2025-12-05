import { InquiryHistoryTimeline } from '@scf/core/features/inquiries/components/InquiryHistoryTimeline'
import { InquiryViewOrganization } from '@scf/core/features/inquiries/components/InquiryViewOrganization'

import type { AppRouter } from '@scf/supabase/client-types'
import { Button, YStack } from '@unicornlove/ui'
import type { inferRouterOutputs } from '@trpc/server'

type InquiryQueryOutput = NonNullable<
  inferRouterOutputs<AppRouter>['inquiries']['getByApplication']
>

interface InquiryTabProps {
  applicationId: string
  candidateName: string
  jobTitle: string
  data: InquiryQueryOutput
  onEditInquiry?: () => void
  editLabel?: string
}

export function InquiryTab({
  applicationId,
  candidateName,
  jobTitle,
  data,
  onEditInquiry,
  editLabel = 'Edit Inquiry',
}: InquiryTabProps) {
  const { inquiry } = data

  return (
    <YStack gap="$4">
      {onEditInquiry && (
        <YStack alignItems="flex-end">
          <Button size="$3" variant="outlined" onPress={onEditInquiry}>
            {editLabel}
          </Button>
        </YStack>
      )}

      <InquiryViewOrganization
        applicationId={applicationId}
        inquiryId={inquiry.id}
        candidateName={candidateName}
        jobTitle={jobTitle}
      />

      <InquiryHistoryTimeline inquiryId={inquiry.id} />
    </YStack>
  )
}
