import { useFollowing, useUnfollowUserMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { DataTable } from '@scf/core/components/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useToast } from '@unicornlove/beyond-ui'
import { UserMinus } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Avatar, Button, Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'

interface Following {
  id: string
  follower_id: string
  follower_type: 'user'
  followee_id: string
  followee_type: 'user' | 'organization' | 'job'
  created_at: string
  followee?: {
    id: string
    name: string
    avatar_url?: string
  }
}

export function FollowingList() {
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
    return following.filter((follow: Following) => {
      const name = follow.followee?.name || ''
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

  const columns = useMemo<ColumnDef<Following>[]>(
    () => [
      {
        accessorKey: 'followee',
        header: 'User',
        cell: ({ row }) => {
          const follow = row.original
          const followee = follow.followee
          const name = followee?.name || 'Unknown'
          const avatar = followee?.avatar_url

          return (
            <Row align="center" gap={8}>
              <Avatar  size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback backgroundColor="$purple4">
                    <Text color="$purple10">{name.charAt(0).toUpperCase()}</Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <Text>{name}</Text>
            </Row>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Following Since',
        cell: ({ row }) => {
          const date = row.original.created_at
          return <Text color="$gray11">{date ? new Date(date).toLocaleDateString() : '-'}</Text>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const follow = row.original
          return (
            <Button
              size="xs"
              variant="outline"
              icon={UserMinus}
              onPress={() => handleUnfollow(follow.id, follow.followee_id)}
              disabled={unfollowMutation.isPending}
            >
              Unfollow
            </Button>
          )
        },
      },
    ],
    [unfollowMutation.isPending, handleUnfollow]
  )

  if (isLoading) {
    return (
      <Stack align="center" justify="center" paddingVertical={24} gap={8}>
        <Spinner size="lg" />
        <Text color="$gray11">Loading following…</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <Input
        placeholder="Search following..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        size="md"
      />

      {filteredFollowing.length === 0 ? (
        <Stack
          gap={12}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={16}
          padding="md"
          backgroundColor="$color2"
          align="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text>Not following anyone yet</Text>
          <Text color="$gray11" style={{ textAlign: 'center' }}>
            {searchTerm
              ? 'No users match your search.'
              : "You're not following anyone yet. Discover workers and start following them."}
          </Text>
        </Stack>
      ) : (
        <DataTable
          columns={columns}
          data={filteredFollowing}
          pageSize={20}
          emptyMessage="No users found"
        />
      )}
    </Stack>
  )
}
