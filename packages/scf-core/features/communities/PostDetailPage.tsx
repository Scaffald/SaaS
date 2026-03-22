import { useState, useCallback } from 'react'
import { ScrollView } from 'react-native'
import { Text, Stack, Row, Button, Spinner, Separator, Avatar, Input, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import {
  usePost,
  usePostComments,
  usePostRatingsSummary,
  useCreateCommentMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import { CommentThread } from './components/CommentThread'
import { RatingInput } from './components/RatingInput'
import { UpvoteButton } from './components/UpvoteButton'
import { BookmarkButton } from './components/BookmarkButton'
import { AIFeedbackSummary } from './components/AIFeedbackSummary'
import { StarRating } from './components/StarRating'

interface Props {
  postId: string
}

export function PostDetailPage({ postId }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const queryClient = useQueryClient()
  const [commentBody, setCommentBody] = useState('')

  const { data: postData, isLoading: isPostLoading } = usePost(postId)
  const post = postData?.data

  const { data: commentsData, isLoading: isCommentsLoading } = usePostComments(postId)
  const comments = commentsData?.data ?? []

  const { data: ratingSummary } = usePostRatingsSummary(postId)

  const createComment = useCreateCommentMutation({
    onSuccess: () => {
      setCommentBody('')
      queryClient.invalidateQueries({ queryKey: ['communities', 'comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['communities', 'post', postId] })
    },
  })

  const handleAddComment = useCallback(() => {
    if (!commentBody.trim()) return
    createComment.mutate({ postId, params: { body: commentBody } })
  }, [commentBody, postId, createComment])

  if (isPostLoading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 300 }}>
        <Spinner variant="ios" size="lg" />
      </Stack>
    )
  }

  if (!post) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 300 }}>
        <Text>Post not found</Text>
      </Stack>
    )
  }

  const summary = ratingSummary?.data

  return (
    <ScrollView>
      <Stack gap={16}>
        {/* Post Header */}
        <Stack gap={8}>
          <Row align="center" gap={8}>
            <Avatar
              src={post.author?.avatar_url ?? undefined}
              initials={post.author?.display_name?.[0] || '?'}
              size={24}
            />
            <Stack>
              <Text style={{ fontWeight: '600' }}>{post.author?.display_name || 'Anonymous'}</Text>
              <Text style={{ color: colors.text[t].secondary, fontSize: 12 }}>
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
            </Stack>
            <Stack style={{ marginLeft: 'auto' }}>
              <Text style={{ color: colors.text[t].secondary, fontSize: 12, textTransform: 'capitalize' }}>
                {post.post_type}
              </Text>
            </Stack>
          </Row>

          <Text style={{ fontSize: 24, fontWeight: '700' }}>{post.title}</Text>
          <Text>{post.body}</Text>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <Stack gap={8}>
              {post.media_urls.map((_url: string, i: number) => (
                <Stack
                  key={`media-${i}`}
                  style={{
                    height: 300,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: colors.bg[t].muted,
                  }}
                >
                  {/* Image component would go here - using placeholder for cross-platform */}
                  <Text style={{ color: colors.text[t].secondary, padding: 8 }}>
                    Media {i + 1}
                  </Text>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>

        {/* Interactions Bar */}
        <Row align="center" gap={16}>
          <UpvoteButton
            targetType="post"
            targetId={post.id}
            count={post.upvote_count}
            hasUpvoted={post.has_upvoted ?? false}
          />
          <Text style={{ color: colors.text[t].secondary }}>{post.comment_count} comments</Text>
          {summary && summary.rating_count > 0 && (
            <Row align="center" gap={4}>
              <StarRating value={summary.rating_avg ?? 0} readonly size={16} />
              <Text style={{ color: colors.text[t].secondary }}>({summary.rating_count})</Text>
            </Row>
          )}
          <Stack style={{ marginLeft: 'auto' }}>
            <BookmarkButton postId={post.id} hasBookmarked={post.has_bookmarked ?? false} />
          </Stack>
        </Row>

        <Separator />

        {/* AI Feedback Summary */}
        {post.ai_feedback_summary && (
          <>
            <AIFeedbackSummary summary={post.ai_feedback_summary} />
            <Separator />
          </>
        )}

        {/* Rating Section (critique/showcase only) */}
        {post.post_type !== 'advice' && post.is_published && (
          <>
            <RatingInput postId={post.id} />
            <Separator />
          </>
        )}

        {/* Comments Section */}
        <Stack gap={12}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Comments ({post.comment_count})</Text>

          {/* Add Comment */}
          <Row gap={8}>
            <Input
              placeholder="Add a comment..."
              value={commentBody}
              onChangeText={setCommentBody}
              style={{ flex: 1 }}
            />
            <Button
              variant="filled"
              size="sm"
              onPress={handleAddComment}
              disabled={!commentBody.trim() || createComment.isPending}
            >
              Post
            </Button>
          </Row>

          {/* Comment List */}
          {isCommentsLoading ? (
            <Stack align="center" style={{ paddingVertical: 24 }}>
              <Spinner variant="ios" />
            </Stack>
          ) : comments.length === 0 ? (
            <Stack align="center" style={{ paddingVertical: 24 }}>
              <Text style={{ color: colors.text[t].secondary }}>No comments yet. Be the first!</Text>
            </Stack>
          ) : (
            <CommentThread comments={comments} postId={postId} />
          )}
        </Stack>
      </Stack>
    </ScrollView>
  )
}
