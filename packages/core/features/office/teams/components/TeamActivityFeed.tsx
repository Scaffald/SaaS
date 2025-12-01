import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { MessageCircle, Send } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Button, Separator, Spinner, Text, TextArea, XStack, YStack } from '@unicornlove/ui'

type MentionOption = {
  id: string
  label: string
}

type MemberDirectoryEntry = {
  displayName?: string | null
  username?: string | null
}

interface TeamActivityFeedProps {
  teamId: string
  mentionOptions?: MentionOption[]
  memberDirectory?: Record<string, MemberDirectoryEntry>
}

const PAGE_SIZE = 20

type TeamActivityOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['activity']
type TeamActivityEvent = NonNullable<TeamActivityOutput['events']>[number]

export function TeamActivityFeed({
  teamId,
  mentionOptions = [],
  memberDirectory = {},
}: TeamActivityFeedProps) {
  const toast = useToastController()
  const utils = api.useUtils()
  const [commentBody, setCommentBody] = useState('')
  const [mentions, setMentions] = useState<MentionOption[]>([])
  const [mentionSelection, setMentionSelection] = useState('none')

  const activityQuery = api.teams.analytics.activity.useInfiniteQuery(
    {
      teamId,
      pageSize: PAGE_SIZE,
    },
    {
      getNextPageParam: (lastPage: TeamActivityOutput | undefined) =>
        lastPage?.nextCursor ?? undefined,
      staleTime: 30_000,
    }
  )

  const postCommentMutation = api.teams.analytics.postComment.useMutation({
    onSuccess: async () => {
      setCommentBody('')
      setMentions([])
      await utils.teams.analytics.activity.invalidate({ teamId, pageSize: PAGE_SIZE })
      toast.show('Comment posted', {
        message: 'Your update is now visible to the team.',
      })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show('Unable to post comment', { message })
    },
  })

  const events: TeamActivityEvent[] = useMemo(() => {
    const pages = activityQuery.data?.pages ?? []
    return pages
      .flatMap((page: TeamActivityOutput | undefined) => page?.events ?? [])
      .map((event: TeamActivityEvent) => ({
        ...event,
        // Ensure payload is an object to simplify downstream use
        payload: typeof event.payload === 'object' && event.payload !== null ? event.payload : {},
      })) as TeamActivityEvent[]
  }, [activityQuery.data])

  const availableMentionOptions = useMemo(
    () => mentionOptions.filter((option) => !mentions.some((item) => item.id === option.id)),
    [mentionOptions, mentions]
  )

  const resolveUserName = (userId?: string | null) => {
    if (!userId) {
      return 'System'
    }
    const entry = memberDirectory[userId]
    if (entry) {
      return entry.displayName ?? entry.username ?? `User ${userId.slice(0, 6)}`
    }
    return `User ${userId.slice(0, 6)}`
  }

  const renderEventDetails = (
    event: TeamActivityEvent
  ): { content: ReactNode; accessibilityLabel: string } => {
    const actor = resolveUserName(event.actorUserId)
    const occurredAt = new Date(event.occurredAt).toLocaleString()

    const payload = event.payload as Record<string, unknown>

    switch (event.eventType) {
      case 'discussion.comment': {
        const body = typeof payload.body === 'string' ? payload.body : ''
        const mentionIds = Array.isArray(payload.mentions) ? (payload.mentions as string[]) : []
        const mentionNames = mentionIds
          .map((id) => resolveUserName(id))
          .filter((name) => Boolean(name))

        const accessibilityLabel = [
          `${actor} commented`,
          body ? `Comment: ${body}` : null,
          mentionNames.length > 0 ? `Mentions ${mentionNames.join(', ')}` : null,
          `On ${occurredAt}`,
        ]
          .filter((value): value is string => Boolean(value))
          .join('. ')

        return {
          accessibilityLabel,
          content: (
            <YStack gap="$2">
              <Text fontWeight="600">{actor} commented</Text>
              {body ? <Text>{body}</Text> : null}
              {mentionNames.length > 0 ? (
                <Text fontSize="$3" color="$color10">
                  Mentions: {mentionNames.join(', ')}
                </Text>
              ) : null}
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
      case 'job.assigned': {
        const jobId = (payload.jobId as string | undefined) ?? event.relatedJobId ?? 'job'
        const accessibilityLabel = `${actor} assigned this team to job ${jobId}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <YStack gap="$1">
              <Text fontWeight="600">
                {actor} assigned this team to job {jobId}
              </Text>
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
      case 'job.assignment_updated': {
        const jobId = (payload.jobId as string | undefined) ?? event.relatedJobId ?? 'job'
        const accessibilityLabel = `${actor} updated the job assignment for ${jobId}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <YStack gap="$1">
              <Text fontWeight="600">
                {actor} updated the job assignment for {jobId}
              </Text>
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
      case 'job.unassigned': {
        const jobId = event.relatedJobId ?? 'job'
        const accessibilityLabel = `${actor} removed this team from job ${jobId}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <YStack gap="$1">
              <Text fontWeight="600">
                {actor} removed this team from job {jobId}
              </Text>
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
      case 'team.ownership_transferred': {
        const targetMember = resolveUserName(event.subjectUserId)
        const accessibilityLabel = `${actor} transferred ownership to ${targetMember}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <YStack gap="$1">
              <Text fontWeight="600">
                {actor} transferred ownership to {targetMember}
              </Text>
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
      case 'member.self_removed': {
        const accessibilityLabel = `${actor} left the team. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <YStack gap="$1">
              <Text fontWeight="600">{actor} left the team</Text>
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
      default: {
        const normalizedEvent = event.eventType.replace('.', ' ')
        const accessibilityLabel = `${actor} performed ${normalizedEvent}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <YStack gap="$1">
              <Text fontWeight="600">
                {actor} performed {normalizedEvent}
              </Text>
              <Text fontSize="$2" color="$color10">
                {occurredAt}
              </Text>
            </YStack>
          ),
        }
      }
    }
  }

  const handleMentionSelection = (value: string) => {
    if (value === 'none') {
      setMentionSelection('none')
      return
    }

    const option = mentionOptions.find((item) => item.id === value)
    if (option && !mentions.some((item) => item.id === option.id)) {
      setMentions((prev) => [...prev, option])
    }
    setMentionSelection('none')
  }

  const handleRemoveMention = (id: string) => {
    setMentions((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmitComment = async () => {
    if (postCommentMutation.isPending) {
      return
    }
    if (!commentBody.trim()) {
      return
    }

    await postCommentMutation.mutateAsync({
      teamId,
      body: commentBody.trim(),
      mentions: mentions.map((mention) => mention.id),
    })
  }

  const isPosting = postCommentMutation.isPending
  const disableSubmit = isPosting || commentBody.trim().length === 0

  return (
    <YStack gap="$4" paddingHorizontal="$3" $md={{ paddingHorizontal: undefined }}>
      <XStack
        gap="$2"
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
        flexDirection="column"
        $md={{
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <XStack gap="$2" alignItems="center">
          <MessageCircle size={20} accessibilityLabel="Team activity icon" />
          <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
            Team activity
          </Text>
        </XStack>
        <Button
          size="$2"
          variant="outlined"
          onPress={() => void activityQuery.refetch()}
          disabled={activityQuery.isFetching}
          accessibilityLabel="Refresh team activity feed"
          accessibilityHint="Reloads the most recent team events"
          width="100%"
          $md={{ width: undefined }}
        >
          Refresh
        </Button>
      </XStack>

      <YStack gap="$3">
        <Text fontWeight="600" accessibilityRole="header">
          Share an update
        </Text>
        <TextArea
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder="Share an update with your team…"
          rows={3}
          accessibilityLabel="Team update message"
          accessibilityHint="Enter the update you want to share with your team"
          disabled={isPosting}
          width="100%"
        />

        {mentionOptions.length > 0 ? (
          <YStack gap="$2">
            <Text fontSize="$3" color="$color11">
              Mention a teammate (optional)
            </Text>
            <XStack
              gap="$2"
              flexWrap="wrap"
              flexDirection="column"
              alignItems="stretch"
              $md={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {mentions.map((mention) => (
                <Button
                  key={mention.id}
                  size="$2"
                  variant="outlined"
                  accessibilityLabel={`Remove mention ${mention.label}`}
                  onPress={() => handleRemoveMention(mention.id)}
                  width="100%"
                  $md={{ width: undefined }}
                >
                  @{mention.label}
                </Button>
              ))}
              {availableMentionOptions.length > 0 ? (
                <ResponsiveSelect
                  value={mentionSelection}
                  onValueChange={(value) => handleMentionSelection(value)}
                  placeholder="Mention teammate"
                  size="$2"
                  options={[
                    { value: 'none', label: 'Select teammate' },
                    ...availableMentionOptions.map((option) => ({
                      value: option.id,
                      label: option.label,
                    })),
                  ]}
                />
              ) : null}
            </XStack>
          </YStack>
        ) : null}

        <XStack justifyContent="flex-end">
          <Button
            size="$3"
            backgroundColor="$color9"
            color="$color1"
            icon={Send}
            onPress={() => void handleSubmitComment()}
            disabled={disableSubmit}
            accessibilityLabel="Post update"
            accessibilityHint="Shares your message with the team"
            width="100%"
            $md={{ width: undefined }}
          >
            {isPosting ? <Spinner size="small" color="$color1" /> : 'Post update'}
          </Button>
        </XStack>
      </YStack>

      <Separator />

      {activityQuery.isLoading ? (
        <YStack alignItems="center" justifyContent="center" gap="$2" paddingVertical="$6">
          <Spinner size="large" />
          <Text color="$color11">Loading team activity…</Text>
        </YStack>
      ) : events.length === 0 ? (
        <YStack gap="$2">
          <Text fontWeight="600">No activity yet</Text>
          <Text color="$color11">
            Your team&apos;s collaboration history will appear here as members take action.
          </Text>
        </YStack>
      ) : (
        <YStack gap="$4">
          {events.map((event, index) => {
            const eventContent = renderEventDetails(event)
            return (
              <YStack
                key={event.id}
                gap="$2"
                paddingBottom="$3"
                borderBottomWidth={index === events.length - 1 ? 0 : 1}
                borderColor="$borderColor"
                accessible
                accessibilityRole="summary"
                accessibilityLabel={eventContent.accessibilityLabel}
              >
                {eventContent.content}
              </YStack>
            )
          })}

          {activityQuery.hasNextPage ? (
            <XStack justifyContent="center">
              <Button
                size="$3"
                variant="outlined"
                onPress={() => void activityQuery.fetchNextPage()}
                disabled={activityQuery.isFetchingNextPage}
                accessibilityLabel="Load more activity"
                accessibilityHint="Loads older team activity events"
              >
                {activityQuery.isFetchingNextPage ? <Spinner size="small" /> : 'Load more'}
              </Button>
            </XStack>
          ) : null}
        </YStack>
      )}
    </YStack>
  )
}
