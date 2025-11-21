import { api } from '@app/core/utils/api'
import { DataTable } from '@app/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Avatar, Input, Spinner, Text, XStack, YStack } from 'tamagui'

type Follower = NonNullable<ReturnType<typeof api.follows.getFollowers.useQuery>['data']>[number]

export function FollowersList() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: followers, isLoading } = api.follows.getFollowers.useQuery()

  const filteredFollowers = useMemo(() => {
    if (!followers) return []
    if (!searchTerm.trim()) return followers

    const search = searchTerm.toLowerCase()
    return followers.filter((follow: Follower) => {
      const name = follow.user?.display_name || follow.user?.username || ''
      return name.toLowerCase().includes(search)
    })
  }, [followers, searchTerm])

  const columns = useMemo<ColumnDef<Follower>[]>(
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
                  <Avatar.Fallback bg="$green4">
                    <Text fontSize="$3" fontWeight="600" color="$green10">
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
    ],
    []
  )

  if (isLoading) {
    return (
      <YStack items="center" justify="center" py="$6" gap="$2">
        <Spinner size="large" />
        <Text color="$color11">Loading followers…</Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4">
      <Input
        placeholder="Search followers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        size="$4"
      />

      {filteredFollowers.length === 0 ? (
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
          <Text fontWeight="600">No followers yet</Text>
          <Text color="$color11" style={{ textAlign: 'center' }}>
            {searchTerm
              ? 'No followers match your search.'
              : 'You don\'t have any followers yet. Build your profile to attract followers.'}
          </Text>
        </YStack>
      ) : (
        <DataTable
          columns={columns}
          data={filteredFollowers}
          pageSize={20}
          emptyMessage="No followers found"
        />
      )}
    </YStack>
  )
}
