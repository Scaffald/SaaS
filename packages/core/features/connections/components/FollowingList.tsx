import { api } from '@app/core/utils/api'
import { DataTable } from '@app/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useToastController } from '@tamagui/toast'
import { UserMinus } from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'
import { Avatar, Button, Input, Spinner, Text, XStack, YStack } from 'tamagui'

interface FollowingData {
  user?: {
    display_name?: string | null
    username?: string | null
    avatar_url?: string | null
    industry?: {
      name?: string | null
    } | null
  } | null
  created_at?: string
  id?: string
  followee_id?: string
}

type FollowingQueryResult = ReturnType<typeof api.follows.getFollowing.useQuery>
type Following = NonNullable<FollowingQueryResult['data']> extends Array<infer T> ? T : FollowingData

export function FollowingList() {
  const [searchTerm, setSearchTerm] = useState('')
  const utils = api.useUtils()
  const toast = useToastController()

  const { data: following, isLoading } = api.follows.getFollowing.useQuery()

  const unfollowMutation = api.follows.unfollowUser.useMutation({
    onSuccess: () => {
      utils.follows.getFollowing.invalidate()
      toast.show('Success', {
        message: 'Unfollowed successfully',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to unfollow user',
      })
    },
  })

  const filteredFollowing = useMemo(() => {
    if (!following) return []
    if (!searchTerm.trim()) return following

    const search = searchTerm.toLowerCase()
    return following.filter((follow: Following) => {
      const name = follow.user?.display_name || follow.user?.username || ''
      return name.toLowerCase().includes(search)
    })
  }, [following, searchTerm])

  const handleUnfollow = async (_followId: string, userId: string) => {
    if (confirm('Are you sure you want to unfollow this user?')) {
      await unfollowMutation.mutateAsync({ targetUserId: userId })
    }
  }

  const columns = useMemo<ColumnDef<Following>[]>(
    () => [
      {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => {
          const follow = row.original
          const user = follow.user
          const name = user?.display_name || user?.username || 'Unknown'
          const avatar = user?.avatar_url

          return (
            <XStack items="center" gap="$2">
              <Avatar circular size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback bg="$purple4">
                    <Text fontSize="$3" fontWeight="600" color="$purple10">
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <Text fontSize="$3" fontWeight="500">
                {name}
              </Text>
            </XStack>
          )
        },
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => {
          const user = row.original.user
          return <Text fontSize="$3">{user?.industry?.name || '-'}</Text>
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Following Since',
        cell: ({ row }) => {
          const date = row.original.created_at
          return (
            <Text fontSize="$3" color="$color10">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </Text>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const follow = row.original
          return (
            <Button
              size="$2"
              variant="outlined"
              icon={UserMinus}
              onPress={() => handleUnfollow(follow.id || '', follow.followee_id || '')}
              disabled={unfollowMutation.isPending}
            >
              Unfollow
            </Button>
          )
        },
      },
    ],
    [unfollowMutation.isPending]
  )

  if (isLoading) {
    return (
      <YStack items="center" justify="center" py="$6" gap="$2">
        <Spinner size="large" />
        <Text color="$color11">Loading following…</Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4">
      <Input
        placeholder="Search following..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        size="$4"
      />

      {filteredFollowing.length === 0 ? (
        <YStack
          gap="$3"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          p="$4"
          bg="$color2"
          items="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text fontWeight="600">Not following anyone yet</Text>
          <Text color="$color11" style={{ textAlign: 'center' }}>
            {searchTerm
              ? 'No users match your search.'
              : 'You\'re not following anyone yet. Discover workers and start following them.'}
          </Text>
        </YStack>
      ) : (
        <DataTable
          columns={columns}
          data={filteredFollowing}
          pageSize={20}
          emptyMessage="No users found"
        />
      )}
    </YStack>
  )
}
