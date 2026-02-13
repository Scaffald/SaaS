import { TeamCommentThread } from '@scf/core/features/office/teams'
import { Text, Stack } from '@unicornlove/beyond-ui'

interface NotesTabProps {
  applicationId: string
  teamId?: string | null
  mentionOptions?: Array<{ id: string; label: string }>
}

export const NotesTab = ({ applicationId, teamId, mentionOptions = [] }: NotesTabProps) => {
  if (!teamId) {
    return (
      <Stack gap={12}>
        <Text>
          Team discussion unavailable
        </Text>
        <Text color="gray">
          Assign this job to a team to enable collaborative comments and mentions.
        </Text>
      </Stack>
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
