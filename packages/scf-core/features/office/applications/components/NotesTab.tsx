import { TeamCommentThread } from '@scf/core/features/office/teams'
import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface NotesTabProps {
  applicationId: string
  teamId?: string | null
  mentionOptions?: Array<{ id: string; label: string }>
}

export const NotesTab = ({ applicationId, teamId, mentionOptions = [] }: NotesTabProps) => {
  const { theme } = useThemeContext()
  if (!teamId) {
    return (
      <Stack gap={12}>
        <Text>Team discussion unavailable</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
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
