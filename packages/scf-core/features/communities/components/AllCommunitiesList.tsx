import { useMemo, useEffect, useState } from 'react'
import { Text, Stack, Spinner, useThemeContext, useToast } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useCommunities, useJoinCommunityMutation } from '@scf/core/utils/communities-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import type { Community } from '@scaffald/sdk/resources/communities'
import { CommunityCard } from './CommunityCard'

// The list endpoint returns `is_member` alongside every community (#383), but
// the SDK's `Community` type (packages/sdk, a separate repo) hasn't picked up
// the field yet. Extend it locally rather than widening the shared type.
type CommunityWithMembership = Community & { is_member?: boolean }

type AllCommunitiesListProps = {
  searchQuery: string
  sortBy: string
  onFilteredCountChange?: (count: number) => void
}

export function AllCommunitiesList({ searchQuery, sortBy, onFilteredCountChange }: AllCommunitiesListProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useCommunities()
  const communities: CommunityWithMembership[] = data?.data ?? []

  // The list endpoint now returns `is_member` per community (see #383), so the
  // initial membership state for each card comes straight from the response.
  // We still track newly-joined ids locally so a successful join flips the
  // button to "Joined" immediately without waiting on a refetch (SC-128 #1).
  // `pendingId` drives the per-card loading state without disabling every
  // other card.
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)

  const joinMutation = useJoinCommunityMutation({
    onSuccess: (_data, variables) => {
      setJoinedIds((prev) => new Set(prev).add(variables.communityId))
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
    onError: (error) => {
      toast.show({
        title: "Couldn't join",
        message: error.message || 'Please try again.',
        variant: 'error',
      })
    },
    onSettled: () => setPendingId(null),
  })

  const filtered = useMemo(() => {
    let result = communities
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(
        (c: CommunityWithMembership) =>
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
      {filtered.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          isMember={joinedIds.has(community.id) || Boolean(community.is_member)}
          isJoining={pendingId === community.id}
          onPress={() => router.push(RouteBuilder.communityDetail(community.slug) as Href)}
          onJoin={() => {
            setPendingId(community.id)
            joinMutation.mutate({ communityId: community.id })
          }}
        />
      ))}
    </Stack>
  )
}
