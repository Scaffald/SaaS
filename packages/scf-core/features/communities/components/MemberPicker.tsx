import { useMemo, useState } from 'react'
import { Image } from 'react-native'
import { Button, Input, Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check, X } from 'lucide-react-native'
import {
  useCommunityMembers,
  useMyCommunities,
} from '@scf/core/utils/communities-sdk-hooks'
import type { CommunityMember } from '@scaffald/sdk/resources/communities'

export interface MemberPickerProps {
  selected: { id: string; display_name: string | null; avatar_url: string | null } | null
  onSelect: (member: CommunityMember | null) => void
  disabled?: boolean
}

export function MemberPicker({ selected, onSelect, disabled }: MemberPickerProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { data: myCommunitiesData, isLoading: isMyLoading } = useMyCommunities()
  const myCommunities = myCommunitiesData?.data ?? []
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>(
    myCommunities[0]?.community_id
  )
  const effectiveCommunityId = activeCommunityId ?? myCommunities[0]?.community_id
  const [search, setSearch] = useState('')

  const { data: membersData, isLoading: isMembersLoading } = useCommunityMembers(
    effectiveCommunityId,
    { limit: 100 },
    { enabled: !!effectiveCommunityId }
  )

  const filteredMembers = useMemo(() => {
    const all = membersData?.data ?? []
    if (!search.trim()) return all.slice(0, 20)
    const q = search.trim().toLowerCase()
    return all
      .filter(
        (m) =>
          (m.display_name ?? '').toLowerCase().includes(q) ||
          (m.headline ?? '').toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [membersData, search])

  if (selected) {
    return (
      <Row
        align="center"
        gap={8}
        style={{
          padding: 8,
          borderRadius: 8,
          backgroundColor: t === 'dark' ? colors.info[900] : colors.info[50],
        }}
      >
        {selected.avatar_url ? (
          <Image
            source={{ uri: selected.avatar_url }}
            style={{ width: 28, height: 28, borderRadius: 14 }}
          />
        ) : (
          <Stack
            align="center"
            justify="center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.info[500],
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
              {(selected.display_name ?? '?').slice(0, 1).toUpperCase()}
            </Text>
          </Stack>
        )}
        <Text style={{ flex: 1, fontWeight: '600' }}>
          {selected.display_name ?? 'Member'}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onPress={() => onSelect(null)}
          disabled={disabled}
          iconStart={X}
        >
          Change
        </Button>
      </Row>
    )
  }

  if (isMyLoading) {
    return (
      <Stack align="center" style={{ padding: 12 }}>
        <Spinner size="sm" />
      </Stack>
    )
  }

  if (myCommunities.length === 0) {
    return (
      <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
        Join a community first to gift karma to its members.
      </Text>
    )
  }

  return (
    <Stack gap={8}>
      {myCommunities.length > 1 && (
        <Row gap={4} style={{ flexWrap: 'wrap' }}>
          {myCommunities.map((c) => (
            <Button
              key={c.community_id}
              size="sm"
              variant={effectiveCommunityId === c.community_id ? 'filled' : 'outline'}
              onPress={() => setActiveCommunityId(c.community_id)}
              disabled={disabled}
            >
              {c.community.name}
            </Button>
          ))}
        </Row>
      )}

      <Input
        placeholder="Search members…"
        value={search}
        onChangeText={setSearch}
        editable={!disabled}
      />

      {isMembersLoading ? (
        <Stack align="center" style={{ padding: 12 }}>
          <Spinner size="sm" />
        </Stack>
      ) : filteredMembers.length === 0 ? (
        <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
          {search ? 'No members match.' : 'No members yet.'}
        </Text>
      ) : (
        <Stack
          gap={2}
          style={{
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 8,
            maxHeight: 240,
            overflow: 'hidden',
          }}
        >
          {filteredMembers.map((m) => (
            <Button
              key={m.id}
              variant="outline"
              size="sm"
              onPress={() => onSelect(m)}
              disabled={disabled}
              style={{
                borderRadius: 0,
                borderWidth: 0,
                borderBottomWidth: 1,
                borderBottomColor: colors.border[t].subtle,
                justifyContent: 'flex-start',
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <Row align="center" gap={8} style={{ flex: 1 }}>
                {m.avatar_url ? (
                  <Image
                    source={{ uri: m.avatar_url }}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                  />
                ) : (
                  <Stack
                    align="center"
                    justify="center"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: colors.info[500],
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 11 }}>
                      {(m.display_name ?? '?').slice(0, 1).toUpperCase()}
                    </Text>
                  </Stack>
                )}
                <Stack gap={1} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600' }}>
                    {m.display_name ?? 'Member'}
                  </Text>
                  {m.headline ? (
                    <Text style={{ fontSize: 11, color: colors.text[t].secondary }}>
                      {m.headline}
                    </Text>
                  ) : null}
                </Stack>
                {m.is_verified ? <Check size={14} color={colors.info[500]} /> : null}
              </Row>
            </Button>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
