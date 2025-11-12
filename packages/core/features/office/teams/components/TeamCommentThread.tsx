import { useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, TextArea, XStack, YStack } from 'tamagui'
import { MessageCircle, Send } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'

import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'

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
  const toast = useToastController()
  const utils = api.useUtils()
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
    },
  )

  const postCommentMutation = api.teams.analytics.postComment.useMutation({
    onSuccess: async () => {
      setCommentBody('')
      setSelectedMentionId(null)
      await utils.teams.analytics.comments.invalidate({ teamId, applicationId, limit: 50 })
      await utils.teams.analytics.activity.invalidate({ teamId, pageSize: 20 })
      toast.show('Comment posted', { message: 'Your update was shared with the team.' })
    },
    onError: (error: Error) => {
      toast.show('Unable to post comment', { message: error.message })
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
    <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$4">
      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <MessageCircle size={18} />
          <Text fontSize="$5" fontWeight="700">
            Team discussion
          </Text>
        </XStack>
        <Text color="$color11" fontSize="$3">
          Share updates with your team. Mentions notify teammates instantly.
        </Text>
      </YStack>

      <YStack gap="$3">
        <TextArea
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder="Add a comment for your team…"
          rows={3}
          disabled={isSubmitting}
        />

        {mentionOptions.length > 0 ? (
          <XStack gap="$2" flexWrap="wrap">
            {mentionOptions.map((option) => (
              <Button
                key={option.id}
                size="$2"
                variant={selectedMentionId === option.id ? 'outlined' : undefined}
                onPress={() =>
                  setSelectedMentionId((current) => (current === option.id ? null : option.id))
                }
              >
                @{option.label}
              </Button>
            ))}
          </XStack>
        ) : null}

        {mentionLabel ? (
          <Text fontSize="$2" color="$color10">
            Mentioning @{mentionLabel}
          </Text>
        ) : null}

        <XStack justify="flex-end">
          <Button
            size="$3"
            icon={Send}
            bg="$color9"
            color="$color1"
            onPress={() => void handleSubmit()}
            disabled={isSubmitting || commentBody.trim().length === 0}
          >
            {isSubmitting ? <Spinner size="small" color="$color1" /> : 'Post comment'}
          </Button>
        </XStack>
      </YStack>

      {commentsQuery.isLoading ? (
        <YStack items="center" justify="center" py="$4" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading discussion…</Text>
        </YStack>
      ) : comments.length === 0 ? (
        <YStack gap="$1">
          <Text fontWeight="600">No comments yet</Text>
          <Text color="$color11">Start the conversation by leaving the first comment.</Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          {comments.map((comment) => (
            <YStack key={comment.id} gap="$1" borderBottomWidth={1} borderColor="$borderColor" pb="$3">
              <Text fontWeight="600">
                {comment.actorDisplayName ?? comment.actorUserId?.slice(0, 6) ?? 'Team member'}
              </Text>
              <Text color="$color10" fontSize="$2">
                {new Date(comment.occurredAt).toLocaleString()}
              </Text>
              <Text>{comment.body}</Text>
              {comment.mentions?.length ? (
                <Text fontSize="$2" color="$color10">
                  Mentions:{' '}
                  {comment.mentions
                    .map((mentionId: string) => mentionLookup.get(mentionId) ?? mentionId.slice(0, 6))
                    .join(', ')}
                </Text>
              ) : null}
            </YStack>
          ))}
        </YStack>
      )}
    </Card>
  )
}


