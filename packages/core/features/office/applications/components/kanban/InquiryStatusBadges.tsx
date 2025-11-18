import { useMemo } from 'react'
import { YStack, XStack, Text } from '@app/ui'
import { Check, MessageSquare } from '@tamagui/lucide-icons'
import { useUser } from '@app/core/utils/useUser'

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

export function InquiryStatusBadges({
  inquiryData,
}: InquiryStatusBadgesProps) {
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
      (c) =>
        c.sender_id !== currentUser.id &&
        !c.read_by?.includes(currentUser.id)
    ).length
  }, [comments, currentUser.id])

  const hasCapabilityResponses = capabilityResponses.length > 0
  const hasPendingChecks = !allAccepted && !hasCapabilityResponses

  if (allAccepted && unreadComments === 0 && !hasPendingChecks) {
    return null // No badges needed if everything is complete
  }

  return (
    <XStack gap="$1" flexWrap="wrap" mt="$2">
      {/* Unread comments badge */}
      {unreadComments > 0 && (
        <XStack
          bg="$blue3"
          px="$2"
          py="$1"
          rounded="$2"
          items="center"
          gap="$1"
        >
          <MessageSquare size={12} color="$blue10" />
          <Text fontSize="$1" color="$blue10" fontWeight="500">
            {unreadComments}
          </Text>
        </XStack>
      )}

      {/* All accepted badge */}
      {allAccepted && (
        <XStack
          bg="$green9"
          px="$2"
          py="$1"
          rounded="$2"
          items="center"
          gap="$1"
        >
          <Check size={12} color="white" />
          <Text fontSize="$1" color="white" fontWeight="600">
            Check completed
          </Text>
        </XStack>
      )}

      {/* Pending sections badge */}
      {pendingSections > 0 && !allAccepted && (
        <YStack bg="$gray3" px="$2" py="$1" rounded="$2">
          <Text fontSize="$1" color="$gray11" fontWeight="500">
            {pendingSections} Pending
          </Text>
        </YStack>
      )}

      {/* Completed sections badge */}
      {acceptedSections > 0 && !allAccepted && (
        <YStack bg="$green3" px="$2" py="$1" rounded="$2">
          <Text fontSize="$1" color="$green10" fontWeight="500">
            {acceptedSections} Completed
          </Text>
        </YStack>
      )}

      {/* Pending checks badge */}
      {hasPendingChecks && (
        <YStack bg="$gray3" px="$2" py="$1" rounded="$2">
          <Text fontSize="$1" color="$gray11" fontWeight="500">
            Pending checks
          </Text>
        </YStack>
      )}

      {/* Progress indicator */}
      {!allAccepted && (
        <YStack bg="$blue2" px="$2" py="$1" rounded="$2">
          <Text fontSize="$1" color="$blue11" fontWeight="500">
            {acceptedSections}/{totalSections}
          </Text>
        </YStack>
      )}
    </XStack>
  )
}

