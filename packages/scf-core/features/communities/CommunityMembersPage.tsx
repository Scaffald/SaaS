import { useState, useMemo } from 'react'
import { Text, Stack, Row, Input, Avatar, Spinner, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useCommunity, useCommunityMembers } from '@scf/core/utils/communities-sdk-hooks'

interface Props {
  slug: string
}

export function CommunityMembersPage({ slug }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [searchTerm, setSearchTerm] = useState('')
  const { data: communityData } = useCommunity(slug)
  const community = communityData?.data

  const { data: membersData, isLoading } = useCommunityMembers(community?.id, {
    limit: 100,
  })

  const members = membersData?.data ?? []

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return members
    const lower = searchTerm.toLowerCase()
    return members.filter(
      (m) =>
        m.display_name?.toLowerCase().includes(lower) || m.headline?.toLowerCase().includes(lower)
    )
  }, [members, searchTerm])

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>{community?.name} Members</Text>
        <Text style={{ color: colors.text[t].secondary }}>{membersData?.total ?? 0} members</Text>
      </Stack>

      <Input placeholder="Search members..." value={searchTerm} onChangeText={setSearchTerm} />

      {isLoading ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Spinner />
        </Stack>
      ) : filtered.length === 0 ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Text style={{ color: colors.text[t].secondary }}>No members found</Text>
        </Stack>
      ) : (
        <Stack gap={8}>
          {filtered.map((member) => (
              <Row
                key={member.id}
                align="center"
                gap={12}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border[t].default,
                }}
              >
                <Avatar
                  src={member.avatar_url ?? undefined}
                  initials={member.display_name?.[0] || '?'}
                  size={32}
                />
                <Stack style={{ flex: 1 }} gap={2}>
                  <Row align="center" gap={8}>
                    <Text style={{ fontWeight: '600' }}>{member.display_name || 'Anonymous'}</Text>
                    {member.is_verified && (
                      <Stack
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 4,
                          backgroundColor: t === 'dark' ? colors.success[900] : colors.success[100],
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.success[600] }}>Verified</Text>
                      </Stack>
                    )}
                  </Row>
                  {member.headline && <Text style={{ color: colors.text[t].secondary }}>{member.headline}</Text>}
                </Stack>
              </Row>
            )
          )}
        </Stack>
      )}
    </Stack>
  )
}
