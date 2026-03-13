import { useState, useMemo } from 'react'
import { Text, Stack, Row, Input, Avatar, Button, Spinner } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useCommunities, useJoinCommunityMutation } from '@scf/core/utils/communities-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import type { Community } from '@scaffald/sdk/resources/communities'

export function AllCommunitiesList() {
  const [searchTerm, setSearchTerm] = useState('')
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
    if (!searchTerm.trim()) return communities
    const lower = searchTerm.toLowerCase()
    return communities.filter(
      (c: Community) =>
        c.name.toLowerCase().includes(lower) || c.description?.toLowerCase().includes(lower)
    )
  }, [communities, searchTerm])

  if (isLoading) {
    return (
      <Stack align="center" style={{ paddingVertical: 40 }}>
        <Spinner />
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <Input placeholder="Search communities..." value={searchTerm} onChangeText={setSearchTerm} />

      {filtered.length === 0 ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Text color="$gray11">No communities found</Text>
        </Stack>
      ) : (
        <Stack gap={8}>
          {filtered.map((community: Community) => (
            <Row
              key={community.id}
              align="center"
              gap={12}
              style={{
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                cursor: 'pointer',
              }}
              onPress={() => router.push(RouteBuilder.communityDetail(community.slug) as Href)}
            >
              <Avatar src={community.icon_url ?? undefined} initials={community.name[0]} size={48} />
              <Stack style={{ flex: 1 }} gap={4}>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>{community.name}</Text>
                {community.description && (
                  <Text color="$gray11" numberOfLines={2}>
                    {community.description}
                  </Text>
                )}
                <Row gap={12}>
                  <Text color="$gray11" style={{ fontSize: 12 }}>
                    {community.member_count} members
                  </Text>
                  <Text color="$gray11" style={{ fontSize: 12 }}>
                    {community.post_count} posts
                  </Text>
                </Row>
              </Stack>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  joinMutation.mutate({ communityId: community.id })
                }}
              >
                Join
              </Button>
            </Row>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
