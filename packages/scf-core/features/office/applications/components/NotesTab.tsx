import { TeamCommentThread } from '@scf/core/features/office/teams'
import { Text, YStack } from '@unicornlove/ui'

interface NotesTabProps {
  applicationId: string
  teamId?: string | null
  mentionOptions?: Array<{ id: string; label: string }>
}

export const NotesTab = ({ applicationId, teamId, mentionOptions = [] }: NotesTabProps) => {
  if (!teamId) {
    return (
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="600">
          Team discussion unavailable
        </Text>
        <Text color="$color11">
          Assign this job to a team to enable collaborative comments and mentions.
        </Text>
      </YStack>
    )
  }

  return (
    <TeamCommentThread
      teamId={teamId}
      applicationId={applicationId}
      mentionOptions={mentionOptions}
    />
  )
}
