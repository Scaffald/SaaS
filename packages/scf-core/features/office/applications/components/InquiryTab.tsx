import { InquiryHistoryTimeline } from '@scf/core/features/inquiries/components/InquiryHistoryTimeline'
import { InquiryViewOrganization } from '@scf/core/features/inquiries/components/InquiryViewOrganization'

import type { AppRouter } from '@scf/supabase/client-types'
import { Button, Stack } from '@scaffald/ui'
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
    <Stack gap={16}>
      {onEditInquiry && (
        <Stack align="flex-end">
          <Button size="sm" variant="outline" onPress={onEditInquiry}>
            {editLabel}
          </Button>
        </Stack>
      )}

      <InquiryViewOrganization
        applicationId={applicationId}
        inquiryId={inquiry.id}
        candidateName={candidateName}
        jobTitle={jobTitle}
      />

      <InquiryHistoryTimeline inquiryId={inquiry.id} />
    </Stack>
  )
}
