import { useUser } from '@scf/core/utils/useUser'
import { Text, Row, Stack , useThemeContext} from '@unicornlove/beyond-ui'
import { Check, MessageSquare } from 'lucide-react-native'
import { useMemo } from 'react'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
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
          style={{ backgroundColor: colors.bg[theme].info }}
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={8}
          align="center"
          gap={4}
        >
          <MessageSquare size="sm" style={{ color: colors.text[theme].info }} />
          <Text style={{ color: colors.text[theme].info }}>{unreadComments}</Text>
        </Row>
      )}

      {/* All accepted badge */}
      {allAccepted && (
        <Row
          style={{ backgroundColor: colors.bg[theme].success }}
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
        <Stack style={{ backgroundColor: colors.bg[theme].muted }} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text style={{ color: colors.text[theme].secondary }}>{pendingSections} Pending</Text>
        </Stack>
      )}

      {/* Completed sections badge */}
      {acceptedSections > 0 && !allAccepted && (
        <Stack style={{ backgroundColor: colors.bg[theme].successSubtle }} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text style={{ color: colors.text[theme].success }}>{acceptedSections} Completed</Text>
        </Stack>
      )}

      {/* Pending checks badge */}
      {hasPendingChecks && (
        <Stack style={{ backgroundColor: colors.bg[theme].muted }} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text style={{ color: colors.text[theme].secondary }}>Pending checks</Text>
        </Stack>
      )}

      {/* Progress indicator */}
      {!allAccepted && (
        <Stack style={{ backgroundColor: colors.bg[theme].info }} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
          <Text style={{ color: colors.text[theme].info }}>
            {acceptedSections}/{totalSections}
          </Text>
        </Stack>
      )}
    </Row>
  )
}
