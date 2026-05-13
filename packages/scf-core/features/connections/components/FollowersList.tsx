import { useFollowers } from '@scf/core/utils/engagement-sdk-hooks'
import { useMemo, useState } from 'react'
import { Avatar, Input, SkeletonList, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
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
          {filteredFollowers.map((follow: Follow, idx: number) => {
            const follower = follow.follower
            const name = follower
              ? `${follower.first_name || ''} ${follower.last_name || ''}`.trim() || 'Unknown'
              : 'Unknown'
            const avatar = follower?.avatar_url
            const date = follow.created_at ? new Date(follow.created_at).toLocaleDateString() : '-'
            const isLast = idx === filteredFollowers.length - 1

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
                  color="success"
                />
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[t].primary }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text[t].secondary }} numberOfLines={1}>
                    Following since {date}
                  </Text>
                </Stack>
              </Row>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
