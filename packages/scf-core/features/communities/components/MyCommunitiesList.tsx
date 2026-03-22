import { useMemo, useEffect } from 'react'
import { Pressable } from 'react-native'
import { Text, Stack, Row, Avatar, Spinner, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useMyCommunities } from '@scf/core/utils/communities-sdk-hooks'

type MyCommunitiesListProps = {
  searchQuery: string
  sortBy: string
  onFilteredCountChange?: (count: number) => void
}

export function MyCommunitiesList({ searchQuery, sortBy, onFilteredCountChange }: MyCommunitiesListProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const { data, isLoading } = useMyCommunities()
  const memberships = data?.data ?? []

  const filtered = useMemo(() => {
    let result = memberships
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.community?.name?.toLowerCase().includes(lower) ||
          item.community?.description?.toLowerCase().includes(lower)
      )
    }
    switch (sortBy) {
      case 'name':
        result = [...result].sort((a, b) =>
          (a.community?.name ?? '').localeCompare(b.community?.name ?? '')
        )
        break
      case 'newest':
        result = [...result].sort((a, b) => b.joined_at.localeCompare(a.joined_at))
        break
      default:
        result = [...result].sort(
          (a, b) =>
            ((b.community?.member_count ?? 0) + (b.community?.post_count ?? 0)) -
            ((a.community?.member_count ?? 0) + (a.community?.post_count ?? 0))
        )
        break
    }
    return result
  }, [memberships, searchQuery, sortBy])

  useEffect(() => {
    onFilteredCountChange?.(filtered.length)
  }, [filtered.length, onFilteredCountChange])

  if (isLoading) {
    return (
      <Stack align="center" style={{ paddingVertical: 40 }}>
        <Spinner />
      </Stack>
    )
  }

  if (memberships.length === 0) {
    return (
      <Stack align="center" style={{ paddingVertical: 40 }}>
        <Text style={{ color: colors.text[t].secondary }}>You haven't joined any communities yet.</Text>
      </Stack>
    )
  }

  if (filtered.length === 0) {
    return (
      <Stack align="center" style={{ paddingVertical: 40 }}>
        <Text style={{ color: colors.text[t].secondary }}>No communities found</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={8}>
      {filtered.map((item) => (
          <Pressable
            key={item.community_id}
            onPress={() => router.push(RouteBuilder.communityDetail(item.community?.slug ?? '') as Href)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Row
              align="center"
              gap={12}
              style={{
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border[t].default,
                cursor: 'pointer',
              }}
            >
              <Avatar
              src={item.community?.icon_url ?? undefined}
              initials={item.community?.name?.[0] || '?'}
              size={48}
            />
            <Stack style={{ flex: 1 }} gap={4}>
              <Row align="center" gap={8}>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>
                  {item.community?.name || 'Unknown'}
                </Text>
                {item.is_verified && (
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
              <Text style={{ fontSize: 12, color: colors.text[t].secondary }}>
                Joined {new Date(item.joined_at).toLocaleDateString()}
              </Text>
            </Stack>
            </Row>
          </Pressable>
        )
      )}
    </Stack>
  )
}
