import { useMemo, useEffect } from 'react'
import { Text, Stack, Spinner, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useMyCommunities } from '@scf/core/utils/communities-sdk-hooks'
import { CommunityCard } from './CommunityCard'

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
        <Spinner variant="ios" />
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
    <Stack gap={12}>
      {filtered.map((item) => (
        <CommunityCard
          key={item.community_id}
          community={item.community}
          onPress={() => router.push(RouteBuilder.communityDetail(item.community?.slug ?? '') as Href)}
          joinedAt={item.joined_at}
          isVerified={item.is_verified}
        />
      ))}
    </Stack>
  )
}
