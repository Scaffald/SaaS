import { useTeamComments, usePostTeamCommentMutation } from '@scf/core/utils/teams-sdk-hooks'
import type { TeamComment } from '@scaffald/sdk'
import { MessageCircle, Send } from 'lucide-react-native'
import { useToast, useThemeContext } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type MentionOption = {
  id: string
  label: string
}

interface TeamCommentThreadProps {
  teamId: string
  applicationId?: string
  mentionOptions?: MentionOption[]
}

export function TeamCommentThread({
  teamId,
  applicationId,
  mentionOptions = [],
}: TeamCommentThreadProps) {
  const { theme } = useThemeContext()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [commentBody, setCommentBody] = useState('')
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null)

  const mentionLookup = useMemo(() => {
    return new Map(mentionOptions.map((option) => [option.id, option.label]))
  }, [mentionOptions])

  const commentsQuery = useTeamComments(
    teamId,
    { applicationId, limit: 50 },
    { enabled: Boolean(teamId), staleTime: 30_000 }
  )

  const postCommentMutation = usePostTeamCommentMutation({
    onSuccess: async () => {
      setCommentBody('')
      setSelectedMentionId(null)
      await queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'analytics', 'comments'] })
      await queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'analytics', 'activity'] })
      toast.show({
        title: 'Comment posted',
        message: 'Your update was shared with the team.',
      })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: 'Unable to post comment',
        message: 'Please try again.',
        variant: 'error',
      })
    },
  })

  const comments = (commentsQuery.data?.comments ?? []) as TeamComment[]

  const isSubmitting = postCommentMutation.isPending

  const handleSubmit = async () => {
    if (!commentBody.trim()) return
    await postCommentMutation.mutateAsync({
      teamId,
      applicationId,
      body: commentBody.trim(),
      mentions: selectedMentionId ? [selectedMentionId] : [],
    })
  }

  const mentionLabel = useMemo(() => {
    if (!selectedMentionId) return null
    return mentionOptions.find((item) => item.id === selectedMentionId)?.label ?? null
  }, [selectedMentionId, mentionOptions])

  return (
    <Card
      borderWidth={1}
      borderColor={colors.border[theme].default}
      style={{ backgroundColor: colors.bg[theme].subtle }}
      padding="md"
      gap={16}
      paddingHorizontal={12}
    >
      <Stack gap={8}>
        <Row gap={8} align="center">
          <MessageCircle size={18} accessibilityLabel="Team discussion icon" />
          <Text accessibilityRole="header">Team discussion</Text>
        </Row>
        <Text style={{ color: colors.text[theme].secondary }}>
          Share updates with your team. Mentions notify teammates instantly.
        </Text>
      </Stack>

      <Stack gap={12}>
        <TextArea
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder="Add a comment for your team…"
          rows={3}
          disabled={isSubmitting}
          accessibilityLabel="Team discussion comment"
          accessibilityHint="Describe your update and optionally mention a teammate"
          width="100%"
        />

        {mentionOptions.length > 0 ? (
          <Row gap={8} wrap flexDirection="column" align="stretch">
            {mentionOptions.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={selectedMentionId === option.id ? 'outline' : undefined}
                onPress={() =>
                  setSelectedMentionId((current) => (current === option.id ? null : option.id))
                }
                accessibilityLabel={
                  selectedMentionId === option.id
                    ? `Remove mention ${option.label}`
                    : `Mention ${option.label}`
                }
                width="100%"
              >
                @{option.label}
              </Button>
            ))}
          </Row>
        ) : null}

        {mentionLabel ? (
          <Text style={{ color: colors.text[theme].secondary }}>Mentioning @{mentionLabel}</Text>
        ) : null}

        <Row justify="flex-end">
          <Button
            size="sm"
            iconStart={Send}
            style={{
              backgroundColor: colors.bg[theme].primary,
              color: colors.text[theme].secondary,
            }}
            onPress={() => void handleSubmit()}
            disabled={isSubmitting || commentBody.trim().length === 0}
            accessibilityLabel="Post comment"
            accessibilityHint="Shares this comment with the team"
            width="100%"
          >
            {isSubmitting ? (
              <Spinner size="sm" style={{ color: colors.text[theme].secondary }} />
            ) : (
              'Post comment'
            )}
          </Button>
        </Row>
      </Stack>

      {commentsQuery.isLoading ? (
        <Stack align="center" justify="center" paddingVertical={16} gap={8}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading discussion…</Text>
        </Stack>
      ) : comments.length === 0 ? (
        <Stack gap={4}>
          <Text>No comments yet</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Start the conversation by leaving the first comment.
          </Text>
        </Stack>
      ) : (
        <Stack gap={12}>
          {comments.map((comment) => {
            const actorName =
              comment.actorDisplayName ?? comment.actorUserId?.slice(0, 6) ?? 'Team member'
            const occurredAt = new Date(comment.occurredAt).toLocaleString()
            const mentionNames = (comment.mentions ?? []).map(
              (mentionId: string) => mentionLookup.get(mentionId) ?? mentionId.slice(0, 6)
            )
            const commentAccessibilityLabel = [
              `${actorName} commented`,
              comment.body ? `Comment: ${comment.body}` : null,
              mentionNames.length ? `Mentions ${mentionNames.join(', ')}` : null,
              `On ${occurredAt}`,
            ]
              .filter((value): value is string => Boolean(value))
              .join('. ')

            return (
              <Stack
                key={comment.id}
                gap={4}
                borderBottomWidth={1}
                borderColor={colors.border[theme].default}
                paddingBottom={12}
                accessible
                accessibilityRole="summary"
                accessibilityLabel={commentAccessibilityLabel}
                width="100%"
              >
                <Text>{actorName}</Text>
                <Text style={{ color: colors.text[theme].secondary }}>{occurredAt}</Text>
                <Text>{comment.body}</Text>
                {mentionNames.length ? (
                  <Text style={{ color: colors.text[theme].secondary }}>
                    Mentions: {mentionNames.join(', ')}
                  </Text>
                ) : null}
              </Stack>
            )
          })}
        </Stack>
      )}
    </Card>
  )
}
