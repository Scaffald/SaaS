import { Button, Text, YStack } from '@app/ui'
import type { inferRouterOutputs } from '@trpc/server'

import type { AppRouter } from '@app/supabase/client-types'
import { InquiryViewOrganization } from '@app/core/features/inquiries/components/InquiryViewOrganization'
import { InquiryHistoryTimeline } from '@app/core/features/inquiries/components/InquiryHistoryTimeline'

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
        <YStack items="flex-end">
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

