import { useState, useCallback } from 'react'
import { ScrollView } from 'react-native'
import { Text, Stack, Row, Button, Input, Separator, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCommunity,
  useCreatePostMutation,
  useSubmitPostMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import { SkillTagPicker } from './SkillTagPicker'
import { PostMediaUpload } from './PostMediaUpload'
import type { PostType } from '@scaffald/sdk/resources/community-posts'
import type { CommunitySkill } from '@scaffald/sdk/resources/community-skills'

interface Props {
  communitySlug: string
  editPostId?: string
}

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
  { value: 'advice', label: 'Advice', description: 'Share tips, tutorials, or industry knowledge' },
  { value: 'critique', label: 'Critique', description: 'Submit work for peer feedback' },
  {
    value: 'showcase',
    label: 'Showcase',
    description: 'Display completed work for your portfolio',
  },
]

export function PostComposer({ communitySlug }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: communityData } = useCommunity(communitySlug)
  const community = communityData?.data

  const [postType, setPostType] = useState<PostType>('advice')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [skillTags, setSkillTags] = useState<CommunitySkill[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  const requiresMedia = postType === 'critique' || postType === 'showcase'

  const createPost = useCreatePostMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'feed'] })
      // Auto-submit for moderation
      if (data.data?.id) {
        submitPost.mutate(data.data.id)
      }
    },
  })

  const submitPost = useSubmitPostMutation({
    onSuccess: () => {
      router.back()
    },
  })

  const handleCreate = useCallback(() => {
    if (!community?.id || !title.trim() || !body.trim()) return
    if (requiresMedia && mediaUrls.length === 0) return
    createPost.mutate({
      community_id: community.id,
      post_type: postType,
      title: title.trim(),
      body: body.trim(),
      skill_tags: skillTags.map((s) => s.id),
      media_urls: mediaUrls,
    })
  }, [community?.id, postType, title, body, skillTags, mediaUrls, requiresMedia, createPost])

  const isPending = createPost.isPending || submitPost.isPending

  return (
    <ScrollView>
      <Stack gap={20}>
        <Stack gap={4}>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>Create Post</Text>
          <Text style={{ color: colors.text[t].secondary }}>Share with the {community?.name || ''} community</Text>
        </Stack>

        {/* Post Type Selector */}
        <Stack gap={8}>
          <Text style={{ fontWeight: '600' }}>Post Type</Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {POST_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={postType === type.value ? 'filled' : 'outline'}
                size="sm"
                onPress={() => setPostType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </Row>
          <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
            {POST_TYPES.find((pt) => pt.value === postType)?.description}
          </Text>
        </Stack>

        <Separator />

        {/* Title */}
        <Stack gap={4}>
          <Text style={{ fontWeight: '600' }}>Title</Text>
          <Input
            placeholder="Give your post a clear title..."
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </Stack>

        {/* Body */}
        <Stack gap={4}>
          <Text style={{ fontWeight: '600' }}>Content</Text>
          <Input
            placeholder={
              postType === 'advice'
                ? 'Share your knowledge, tips, or tutorial...'
                : postType === 'critique'
                  ? 'Describe the work and what feedback you want...'
                  : 'Tell us about this completed project...'
            }
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={8}
            style={{ minHeight: 150 }}
          />
        </Stack>

        {/* Skill Tags */}
        <Stack gap={4}>
          <Text style={{ fontWeight: '600' }}>Skill Tags</Text>
          <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
            Tag relevant skills to help others find your post
          </Text>
          <SkillTagPicker
            communityId={community?.id}
            selectedTags={skillTags}
            onTagsChange={setSkillTags}
          />
        </Stack>

        {/* Media Upload */}
        <Stack gap={4}>
          <Text style={{ fontWeight: '600' }}>
            Media{requiresMedia ? ` (required for ${postType})` : ' (optional)'}
          </Text>
          <PostMediaUpload value={mediaUrls} onChange={setMediaUrls} disabled={isPending} />
        </Stack>

        <Separator />

        {/* Actions */}
        <Row gap={12}>
          <Button variant="outline" onPress={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="filled"
            onPress={handleCreate}
            disabled={
              !title.trim() ||
              !body.trim() ||
              isPending ||
              (requiresMedia && mediaUrls.length === 0)
            }
          >
            {isPending ? 'Creating...' : 'Create & Submit'}
          </Button>
        </Row>
      </Stack>
    </ScrollView>
  )
}
