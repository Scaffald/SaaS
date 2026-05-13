import { useMemo, useState } from 'react'
import { Image, Pressable, Platform } from 'react-native'
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
        <Stack
          align="center"
          justify="center"
          style={{
            paddingVertical: 24,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 12,
            backgroundColor: colors.bg[t].muted,
          }}
        >
          <Text style={{ color: colors.text[t].secondary, fontSize: 14 }}>
            {search ? 'No members match.' : 'No members yet.'}
          </Text>
        </Stack>
      ) : (
        <Stack
          gap={0}
          style={{
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 12,
            maxHeight: 320,
            overflow: 'hidden',
            backgroundColor: colors.bg[t].default,
          }}
        >
          {filteredMembers.map((m, idx) => {
            const isLast = idx === filteredMembers.length - 1
            return (
              <Pressable
                key={m.id}
                onPress={() => onSelect(m)}
                disabled={disabled}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border[t].subtle,
                  backgroundColor: pressed ? colors.bg[t].muted : 'transparent',
                  opacity: disabled ? 0.5 : 1,
                  ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
                })}
              >
                <Row align="center" gap={10}>
                  {m.avatar_url ? (
                    <Image
                      source={{ uri: m.avatar_url }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                  ) : (
                    <Stack
                      align="center"
                      justify="center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.info[500],
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                        {(m.display_name ?? '?').slice(0, 1).toUpperCase()}
                      </Text>
                    </Stack>
                  )}
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Row align="center" gap={6}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '600', color: colors.text[t].primary }}
                        numberOfLines={1}
                      >
                        {m.display_name ?? 'Member'}
                      </Text>
                      {m.is_verified ? <Check size={14} color={colors.info[500]} /> : null}
                    </Row>
                    {m.headline ? (
                      <Text
                        style={{ fontSize: 12, color: colors.text[t].secondary }}
                        numberOfLines={1}
                      >
                        {m.headline}
                      </Text>
                    ) : null}
                  </Stack>
                </Row>
              </Pressable>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
