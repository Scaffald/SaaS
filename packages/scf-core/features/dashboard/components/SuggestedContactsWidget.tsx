import {
  useFollowers,
  useSendConnectionMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import {
  Avatar,
  Button,
  DashboardWidget,
  Row,
  Skeleton,
  SkeletonAvatar,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function SuggestedContactsWidget() {
  const { theme } = useThemeContext()
  const queryClient = useQueryClient()
  const { data: followers, isLoading } = useFollowers({ limit: 5 })
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const sendConnection = useSendConnectionMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Skeleton width={140} height={18} borderRadius={4} />
          {[1, 2].map((i) => (
            <Row key={i} gap={12} align="center" justify="space-between">
              <Row gap={12} align="center">
                <SkeletonAvatar size={40} />
                <Stack gap={4}>
                  <Skeleton width={100} height={12} />
                  <Skeleton width={80} height={10} />
                </Stack>
              </Row>
              <Skeleton width={60} height={28} borderRadius={8} />
            </Row>
          ))}
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  // Get follower items — FollowsListResponse = { data: Follow[], total: number }
  const contacts = (followers?.data ?? []).slice(0, 3)

  if (contacts.length === 0) return null

  return (
    <DashboardWidget>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.text[theme].primary,
          marginBottom: 4,
        }}
      >
        Suggested Contacts
      </Text>
      <Stack gap={16}>
        {contacts.map((follow) => {
          const follower = follow.follower
          const id = follower?.id ?? follow.follower_id
          const name = follower
            ? `${follower.first_name} ${follower.last_name}`.trim()
            : 'User'
          const headline = ''
          const avatarUrl = follower?.avatar_url
          const initials = name
            .split(/\s+/)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          const isSent = sentIds.has(id)

          return (
            <Row key={id} justify="space-between" align="center" gap={12}>
              <Row gap={12} align="center" flex={1}>
                <Avatar
                  size={40}
                  src={avatarUrl || undefined}
                  initials={initials}
                  color="gray"
                />
                <Stack gap={2} flex={1}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.text[theme].primary,
                    }}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  {headline ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text[theme].secondary,
                      }}
                      numberOfLines={1}
                    >
                      {headline}
                    </Text>
                  ) : null}
                </Stack>
              </Row>
              <Button
                variant="outline"
                color="primary"
                size="sm"
                disabled={isSent || sendConnection.isPending}
                onPress={() => {
                  if (!id) return
                  setSentIds((prev) => new Set(prev).add(id))
                  sendConnection.mutate({ targetUserId: id })
                }}
              >
                {isSent ? 'Sent' : 'Connect'}
              </Button>
            </Row>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
