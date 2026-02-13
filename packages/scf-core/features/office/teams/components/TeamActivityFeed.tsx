import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { MessageCircle, Send } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { Button, Separator, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

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
  const toast = useToast()
  const queryClient = useQueryClient()
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
      await queryClient.invalidateQueries({ queryKey: [['teams', 'analytics', 'activity']] })
      toast.show({
        title: 'Comment posted',
        message: 'Your update is now visible to the team.',
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
            <Stack gap={8}>
              <Text>{actor} commented</Text>
              {body ? <Text>{body}</Text> : null}
              {mentionNames.length > 0 ? (
                <Text color="gray">Mentions: {mentionNames.join(', ')}</Text>
              ) : null}
              <Text color="gray">{occurredAt}</Text>
            </Stack>
          ),
        }
      }
      case 'job.assigned': {
        const jobId = (payload.jobId as string | undefined) ?? event.relatedJobId ?? 'job'
        const accessibilityLabel = `${actor} assigned this team to job ${jobId}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <Stack gap={4}>
              <Text>
                {actor} assigned this team to job {jobId}
              </Text>
              <Text color="gray">{occurredAt}</Text>
            </Stack>
          ),
        }
      }
      case 'job.assignment_updated': {
        const jobId = (payload.jobId as string | undefined) ?? event.relatedJobId ?? 'job'
        const accessibilityLabel = `${actor} updated the job assignment for ${jobId}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <Stack gap={4}>
              <Text>
                {actor} updated the job assignment for {jobId}
              </Text>
              <Text color="gray">{occurredAt}</Text>
            </Stack>
          ),
        }
      }
      case 'job.unassigned': {
        const jobId = event.relatedJobId ?? 'job'
        const accessibilityLabel = `${actor} removed this team from job ${jobId}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <Stack gap={4}>
              <Text>
                {actor} removed this team from job {jobId}
              </Text>
              <Text color="gray">{occurredAt}</Text>
            </Stack>
          ),
        }
      }
      case 'team.ownership_transferred': {
        const targetMember = resolveUserName(event.subjectUserId)
        const accessibilityLabel = `${actor} transferred ownership to ${targetMember}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <Stack gap={4}>
              <Text>
                {actor} transferred ownership to {targetMember}
              </Text>
              <Text color="gray">{occurredAt}</Text>
            </Stack>
          ),
        }
      }
      case 'member.self_removed': {
        const accessibilityLabel = `${actor} left the team. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <Stack gap={4}>
              <Text>{actor} left the team</Text>
              <Text color="gray">{occurredAt}</Text>
            </Stack>
          ),
        }
      }
      default: {
        const normalizedEvent = event.eventType.replace('.', ' ')
        const accessibilityLabel = `${actor} performed ${normalizedEvent}. ${occurredAt}`
        return {
          accessibilityLabel,
          content: (
            <Stack gap={4}>
              <Text>
                {actor} performed {normalizedEvent}
              </Text>
              <Text color="gray">{occurredAt}</Text>
            </Stack>
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
    <Stack gap={16} paddingHorizontal={12}>
      <Row
        gap={8}
        align="flex-start"
        justify="space-between"
        flexWrap="wrap"
        flexDirection="column"
      >
        <Row gap={8} align="center">
          <MessageCircle size={20} accessibilityLabel="Team activity icon" />
          <Text accessibilityRole="header">Team activity</Text>
        </Row>
        <Button
          size={8}
          variant="outline"
          onPress={() => void activityQuery.refetch()}
          disabled={activityQuery.isFetching}
          accessibilityLabel="Refresh team activity feed"
          accessibilityHint="Reloads the most recent team events"
          width="100%"
        >
          Refresh
        </Button>
      </Row>

      <Stack gap={12}>
        <Text accessibilityRole="header">Share an update</Text>
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
          <Stack gap={8}>
            <Text color="gray">Mention a teammate (optional)</Text>
            <Row gap={8} flexWrap="wrap" flexDirection="column" align="stretch">
              {mentions.map((mention) => (
                <Button
                  key={mention.id}
                  size={8}
                  variant="outline"
                  accessibilityLabel={`Remove mention ${mention.label}`}
                  onPress={() => handleRemoveMention(mention.id)}
                  width="100%"
                >
                  @{mention.label}
                </Button>
              ))}
              {availableMentionOptions.length > 0 ? (
                <ResponsiveSelect
                  value={mentionSelection}
                  onValueChange={(value) => handleMentionSelection(value)}
                  placeholder="Mention teammate"
                  size={8}
                  options={[
                    { value: 'none', label: 'Select teammate' },
                    ...availableMentionOptions.map((option) => ({
                      value: option.id,
                      label: option.label,
                    })),
                  ]}
                />
              ) : null}
            </Row>
          </Stack>
        ) : null}

        <Row justify="flex-end">
          <Button
            size={12}
            backgroundColor="$color9"
            color="gray"
            icon={Send}
            onPress={() => void handleSubmitComment()}
            disabled={disableSubmit}
            accessibilityLabel="Post update"
            accessibilityHint="Shares your message with the team"
            width="100%"
          >
            {isPosting ? <Spinner size="sm" color="gray" /> : 'Post update'}
          </Button>
        </Row>
      </Stack>

      <Separator />

      {activityQuery.isLoading ? (
        <Stack align="center" justify="center" gap={8} paddingVertical={24}>
          <Spinner size="lg" />
          <Text color="gray">Loading team activity…</Text>
        </Stack>
      ) : events.length === 0 ? (
        <Stack gap={8}>
          <Text>No activity yet</Text>
          <Text color="gray">
            Your team&apos;s collaboration history will appear here as members take action.
          </Text>
        </Stack>
      ) : (
        <Stack gap={16}>
          {events.map((event, index) => {
            const eventContent = renderEventDetails(event)
            return (
              <Stack
                key={event.id}
                gap={8}
                paddingBottom={12}
                borderBottomWidth={index === events.length - 1 ? 0 : 1}
                borderColor="$borderColor"
                accessible
                accessibilityRole="summary"
                accessibilityLabel={eventContent.accessibilityLabel}
              >
                {eventContent.content}
              </Stack>
            )
          })}

          {activityQuery.hasNextPage ? (
            <Row justify="center">
              <Button
                size={12}
                variant="outline"
                onPress={() => void activityQuery.fetchNextPage()}
                disabled={activityQuery.isFetchingNextPage}
                accessibilityLabel="Load more activity"
                accessibilityHint="Loads older team activity events"
              >
                {activityQuery.isFetchingNextPage ? <Spinner size="sm" /> : 'Load more'}
              </Button>
            </Row>
          ) : null}
        </Stack>
      )}
    </Stack>
  )
}
