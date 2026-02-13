import { useFollowers } from '@scf/core/utils/engagement-sdk-hooks'
import { DataTable } from '@scf/core/components/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Avatar, Input, Spinner, Text, Row, Stack } from '@scaffald/ui'

interface Follower {
  id: string
  follower_id: string
  follower_type: 'user'
  followee_id: string
  followee_type: 'user' | 'organization' | 'job'
  created_at: string
  follower?: {
    id: string
    name: string
    avatar_url?: string
  }
}

export function FollowersList() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: followersResponse, isLoading } = useFollowers()
  const followers = followersResponse?.data

  const filteredFollowers = useMemo(() => {
    if (!followers) return []
    if (!searchTerm.trim()) return followers

    const search = searchTerm.toLowerCase()
    return followers.filter((follow: Follower) => {
      const name = follow.follower?.name || ''
      return name.toLowerCase().includes(search)
    })
  }, [followers, searchTerm])

  const columns = useMemo<ColumnDef<Follower>[]>(
    () => [
      {
        accessorKey: 'follower',
        header: 'User',
        cell: ({ row }) => {
          const follow = row.original
          const follower = follow.follower
          const name = follower?.name || 'Unknown'
          const avatar = follower?.avatar_url

          return (
            <Row align="center" gap={8}>
              <Avatar size={32}>
                {avatar ? (
                  <Avatar.Image source={{ uri: avatar }} />
                ) : (
                  <Avatar.Fallback backgroundColor="$green4">
                    <Text color="$green10">{name.charAt(0).toUpperCase()}</Text>
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
    ],
    []
  )

  if (isLoading) {
    return (
      <Stack align="center" justify="center" paddingVertical={24} gap={8}>
        <Spinner size="lg" />
        <Text color="$gray11">Loading followers…</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <Input
        placeholder="Search followers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        size="md"
      />

      {filteredFollowers.length === 0 ? (
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
          <Text>No followers yet</Text>
          <Text color="$gray11" style={{ textAlign: 'center' }}>
            {searchTerm
              ? 'No followers match your search.'
              : "You don't have any followers yet. Build your profile to attract followers."}
          </Text>
        </Stack>
      ) : (
        <DataTable
          columns={columns}
          data={filteredFollowers}
          pageSize={20}
          emptyMessage="No followers found"
        />
      )}
    </Stack>
  )
}
