import { useFollowing, useUnfollowUserMutation } from '@scf/core/utils/engagement-sdk-hooks'
import type { Follow } from '@scaffald/sdk/resources/follows'
import { useToast, useThemeContext } from '@scaffald/ui'
import { UserMinus } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Avatar, Button, Input, SkeletonList, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'

export function FollowingList() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: followingResponse, isLoading } = useFollowing()
  const following = followingResponse?.data

  const unfollowMutation = useUnfollowUserMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', 'following'] })
      toast.show({
        title: 'Success',
        message: 'Unfollowed successfully',
        variant: 'success',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to unfollow user',
        variant: 'error',
      })
    },
  })

  const filteredFollowing = useMemo(() => {
    if (!following) return []
    if (!searchTerm.trim()) return following

    const search = searchTerm.toLowerCase()
    return following.filter((follow: Follow) => {
      const f = follow.followee
      const name = f?.name || ''
      return name.toLowerCase().includes(search)
    })
  }, [following, searchTerm])

  const handleUnfollow = useCallback(
    async (_followId: string, userId: string) => {
      if (confirm('Are you sure you want to unfollow this user?')) {
        await unfollowMutation.mutateAsync(userId)
      }
    },
    [unfollowMutation]
  )

  if (isLoading) {
    return <SkeletonList count={4} variant="profile" />
  }

  return (
    <Stack gap={16}>
      <Input
        placeholder="Search following..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {filteredFollowing.length === 0 ? (
        <Stack
          gap={12}
          borderWidth={1}
          borderColor={colors.border[t].default}
          borderRadius={16}
          padding="md"
          backgroundColor={colors.bg[t].muted}
          align="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text>Not following anyone yet</Text>
          <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
            {searchTerm
              ? 'No users match your search.'
              : "You're not following anyone yet. Discover workers and start following them."}
          </Text>
        </Stack>
      ) : (
        <Stack
          gap={0}
          style={{
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.bg[t].default,
          }}
        >
          {filteredFollowing.map((follow: Follow, idx: number) => {
            const followee = follow.followee
            const name = followee?.name || 'Unknown'
            const avatar = followee?.avatar_url
            const date = follow.created_at ? new Date(follow.created_at).toLocaleDateString() : '-'
            const isLast = idx === filteredFollowing.length - 1

            return (
              <Row
                key={follow.id}
                align="center"
                gap={12}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border[t].subtle,
                }}
              >
                <Avatar
                  size={40}
                  src={avatar ? { uri: avatar } : undefined}
                  initials={!avatar ? name.charAt(0).toUpperCase() : undefined}
                  color="primary"
                />
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[t].primary }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text[t].secondary }} numberOfLines={1}>
                    Following since {date}
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  variant="outline"
                  iconStart={UserMinus}
                  onPress={() => handleUnfollow(follow.id, follow.followee_id)}
                  disabled={unfollowMutation.isPending}
                >
                  Unfollow
                </Button>
              </Row>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
