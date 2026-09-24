import { InquiryHistoryTimeline } from '@scf/core/features/inquiries/components/InquiryHistoryTimeline'
import { InquiryViewOrganization } from '@scf/core/features/inquiries/components/InquiryViewOrganization'

import type { InquiryDetails } from '@scf/core/utils/inquiry-capability-types'
import { Button, Stack } from '@scaffald/ui'

interface InquiryTabProps {
  applicationId: string
  candidateName: string
  jobTitle: string
  data: InquiryDetails
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
      {/* Edit belongs beside the title, not floating above it (#837). */}
      <InquiryViewOrganization
        applicationId={applicationId}
        inquiryId={inquiry.id as string}
        candidateName={candidateName}
        jobTitle={jobTitle}
        actions={
          onEditInquiry ? (
            <Button size="sm" variant="outline" onPress={onEditInquiry}>
              {editLabel}
            </Button>
          ) : undefined
        }
      />

      <InquiryHistoryTimeline inquiryId={inquiry.id as string} />
    </Stack>
  )
}
