import { useUser } from '@scf/core/utils/useUser'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import { Check, MessageSquare } from 'lucide-react-native'
import { useMemo } from 'react'

interface InquiryStatusBadgesProps {
  inquiryData: {
    sections: Array<{
      section_name: string
      accepted_by: string | null
      accepted_at: string | null
    }>
    comments: Array<{
      sender_id: string
      read_by: string[]
    }>
    capabilityResponses: Array<{
      capability_name: string
    }>
  } | null
}

export function InquiryStatusBadges({ inquiryData }: InquiryStatusBadgesProps) {
  const { user: currentUser } = useUser()

  if (!inquiryData || !currentUser) return null

  const { sections, comments, capabilityResponses } = inquiryData

  // Calculate metrics
  const totalSections = 4 // employment, compensation, capabilities, other
  const acceptedSections = sections.filter((s) => s.accepted_by !== null).length
  const pendingSections = totalSections - acceptedSections
  const allAccepted = acceptedSections === totalSections

  // Calculate unread comments
  const unreadComments = useMemo(() => {
    return comments.filter(
      (c) => c.sender_id !== currentUser.id && !c.read_by?.includes(currentUser.id)
    ).length
  }, [comments, currentUser.id])

  const hasCapabilityResponses = capabilityResponses.length > 0
  const hasPendingChecks = !allAccepted && !hasCapabilityResponses

  if (allAccepted && unreadComments === 0 && !hasPendingChecks) {
    return null // No badges needed if everything is complete
  }

  return (
    <Row gap={4} flexWrap="wrap" marginTop={8}>
      {/* Unread comments badge */}
      {unreadComments > 0 && (
        <Row
          backgroundColor="$blue3"
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={8}
          align="center"
          gap={4}
        >
          <MessageSquare size="sm" color="$blue10" />
          <Text color="$blue10">{unreadComments}</Text>
        </Row>
      )}

      {/* All accepted badge */}
      {allAccepted && (
        <Row
          backgroundColor="$green9"
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={8}
          align="center"
          gap={4}
        >
          <Check size="sm" color="white" />
          <Text color="white">Check completed</Text>
        </Row>
      )}

      {/* Pending sections badge */}
      {pendingSections > 0 && !allAccepted && (
        <Stack backgroundColor="$gray3" paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text color="$gray11">{pendingSections} Pending</Text>
        </Stack>
      )}

      {/* Completed sections badge */}
      {acceptedSections > 0 && !allAccepted && (
        <Stack backgroundColor="$green3" paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text color="$green10">{acceptedSections} Completed</Text>
        </Stack>
      )}

      {/* Pending checks badge */}
      {hasPendingChecks && (
        <Stack backgroundColor="$gray3" paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text color="$gray11">Pending checks</Text>
        </Stack>
      )}

      {/* Progress indicator */}
      {!allAccepted && (
        <Stack backgroundColor="$blue2" paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text color="$blue11">
            {acceptedSections}/{totalSections}
          </Text>
        </Stack>
      )}
    </Row>
  )
}
