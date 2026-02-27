import { useFollowers } from '@scf/core/utils/engagement-sdk-hooks'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Avatar, Input, Spinner, Table, Text, Row, Stack } from '@scaffald/ui'

import type { Follow } from '@scaffald/sdk/resources/follows'

export function FollowersList() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: followersResponse, isLoading } = useFollowers()
  const followers = followersResponse?.data

  const filteredFollowers = useMemo(() => {
    if (!followers) return []
    if (!searchTerm.trim()) return followers

    const search = searchTerm.toLowerCase()
    return followers.filter((follow: Follow) => {
      const f = follow.follower
      const name = f ? `${f.first_name || ''} ${f.last_name || ''}`.trim() : ''
      return name.toLowerCase().includes(search)
    })
  }, [followers, searchTerm])

  const columnDefs = useMemo<ColumnDef<Follow>[]>(
    () => [
      {
        accessorKey: 'follower',
        header: 'User',
        cell: ({ row }) => {
          const follow = row.original
          const follower = follow.follower
          const name = follower
            ? `${follower.first_name || ''} ${follower.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown'
          const avatar = follower?.avatar_url

          return (
            <Row align="center" gap={8}>
              <Avatar
                size={32}
                src={avatar ? { uri: avatar } : undefined}
                initials={!avatar ? name.charAt(0).toUpperCase() : undefined}
                color="success"
              />
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

  const tableColumns = useMemo(
    () => columnsFromTanStack<Follow & Record<string, unknown>>(columnDefs as ColumnDef<Follow & Record<string, unknown>>[]),
    [columnDefs]
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
        <Table
          columns={tableColumns}
          data={filteredFollowers as (Follow & Record<string, unknown>)[]}
          pageSize={20}
          emptyMessage="No followers found"
        />
      )}
    </Stack>
  )
}
