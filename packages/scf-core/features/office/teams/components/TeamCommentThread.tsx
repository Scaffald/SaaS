import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { MessageCircle, Send } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

type CommentsOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['comments']
type CommentRecord = NonNullable<CommentsOutput['comments']>[number]

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
  const toast = useToast()
  const queryClient = useQueryClient()
  const [commentBody, setCommentBody] = useState('')
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null)

  const mentionLookup = useMemo(() => {
    return new Map(mentionOptions.map((option) => [option.id, option.label]))
  }, [mentionOptions])

  const commentsQuery = api.teams.analytics.comments.useQuery(
    {
      teamId,
      applicationId,
      limit: 50,
    },
    {
      enabled: Boolean(teamId),
      staleTime: 30_000,
    }
  )

  const postCommentMutation = api.teams.analytics.postComment.useMutation({
    onSuccess: async () => {
      setCommentBody('')
      setSelectedMentionId(null)
      await queryClient.invalidateQueries({ queryKey: [['teams', 'analytics', 'comments']] })
      await queryClient.invalidateQueries({ queryKey: [['teams', 'analytics', 'activity']] })
      toast.show({
          title: 'Comment posted',
          message: 'Your update was shared with the team.',
        })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Unable to post comment',
          variant: 'error',
        })
    },
  })

  const comments = (commentsQuery.data?.comments ?? []) as CommentRecord[]

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
      borderColor="$borderColor"
      backgroundColor="$color2"
      padding={16}
      gap={16}
      paddingHorizontal={12}
    >
      <Stack gap={8}>
        <Row gap={8} align="center">
          <MessageCircle size={18} accessibilityLabel="Team discussion icon" />
          <Text accessibilityRole="header">
            Team discussion
          </Text>
        </Row>
        <Text color="gray">
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
          <Row
            gap={8}
            flexWrap="wrap"
            flexDirection="column"
            align="stretch"
          >
            {mentionOptions.map((option) => (
              <Button
                key={option.id}
                size={8}
                variant={selectedMentionId === option.id ? 'outlined' : undefined}
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
          <Text color="gray">
            Mentioning @{mentionLabel}
          </Text>
        ) : null}

        <Row justify="flex-end">
          <Button
            size={12}
            icon={Send}
            backgroundColor="$color9"
            color="gray"
            onPress={() => void handleSubmit()}
            disabled={isSubmitting || commentBody.trim().length === 0}
            accessibilityLabel="Post comment"
            accessibilityHint="Shares this comment with the team"
            width="100%"
          >
            {isSubmitting ? <Spinner size="sm" color="gray" /> : 'Post comment'}
          </Button>
        </Row>
      </Stack>

      {commentsQuery.isLoading ? (
        <Stack align="center" justify="center" paddingVertical={16} gap={8}>
          <Spinner size="lg" />
          <Text color="gray">Loading discussion…</Text>
        </Stack>
      ) : comments.length === 0 ? (
        <Stack gap={4}>
          <Text>No comments yet</Text>
          <Text color="gray">Start the conversation by leaving the first comment.</Text>
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
                borderColor="$borderColor"
                paddingBottom={12}
                accessible
                accessibilityRole="summary"
                accessibilityLabel={commentAccessibilityLabel}
                width="100%"
              >
                <Text>{actorName}</Text>
                <Text color="gray">
                  {occurredAt}
                </Text>
                <Text>{comment.body}</Text>
                {mentionNames.length ? (
                  <Text color="gray">
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
