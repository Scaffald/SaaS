import { useMemo, useEffect } from 'react'
import { Text, Stack, Spinner, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useCommunities, useJoinCommunityMutation } from '@scf/core/utils/communities-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import type { Community } from '@scaffald/sdk/resources/communities'
import { CommunityCard } from './CommunityCard'

type AllCommunitiesListProps = {
  searchQuery: string
  sortBy: string
  onFilteredCountChange?: (count: number) => void
}

export function AllCommunitiesList({ searchQuery, sortBy, onFilteredCountChange }: AllCommunitiesListProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useCommunities()
  const communities = data?.data ?? []

  const joinMutation = useJoinCommunityMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const filtered = useMemo(() => {
    let result = communities
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(
        (c: Community) =>
          c.name.toLowerCase().includes(lower) || c.description?.toLowerCase().includes(lower)
      )
    }
    switch (sortBy) {
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at))
        break
      default:
        result = [...result].sort(
          (a, b) => (b.member_count + b.post_count) - (a.member_count + a.post_count)
        )
        break
    }
    return result
  }, [communities, searchQuery, sortBy])

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

  if (filtered.length === 0) {
    return (
      <Stack align="center" style={{ paddingVertical: 40 }}>
        <Text style={{ color: colors.text[t].secondary }}>No communities found</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={12}>
      {filtered.map((community: Community) => (
        <CommunityCard
          key={community.id}
          community={community}
          onPress={() => router.push(RouteBuilder.communityDetail(community.slug) as Href)}
          onJoin={() => joinMutation.mutate({ communityId: community.id })}
        />
      ))}
    </Stack>
  )
}
