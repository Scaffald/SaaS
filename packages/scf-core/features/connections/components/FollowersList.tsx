import { useFollowers } from '@scf/core/utils/engagement-sdk-hooks'
import { columnsFromTanStack } from '@scf/core/utils/table-columns'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Avatar, Input, SkeletonList, Table, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import type { Follow } from '@scaffald/sdk/resources/follows'

export function FollowersList() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
          return <Text style={{ color: colors.text[t].secondary }}>{date ? new Date(date).toLocaleDateString() : '-'}</Text>
        },
      },
    ],
    [t]
  )

  const tableColumns = useMemo(
    () => columnsFromTanStack<Follow & Record<string, unknown>>(columnDefs as ColumnDef<Follow & Record<string, unknown>>[]),
    [columnDefs]
  )

  if (isLoading) {
    return <SkeletonList count={4} variant="profile" />
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
          borderColor={colors.border[t].default}
          borderRadius={16}
          padding="md"
          backgroundColor={colors.bg[t].muted}
          align="center"
          justify="center"
          style={{ minHeight: 300 }}
        >
          <Text>No followers yet</Text>
          <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
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
