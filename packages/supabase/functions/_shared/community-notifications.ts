/**
 * Community Notifications Helper
 * Fire-and-forget notification insertion for community events.
 * Uses the existing insertNotification utility from the notification system.
 */

import { insertNotification } from './notifications/utils.ts'
import type { NotificationSupabaseClient } from './notifications/types.ts'

// Community notification types are added via migration 414 but not yet in the generated
// database.types.ts. We use a typed helper to safely cast until `supabase gen types` is re-run.
// biome-ignore lint/suspicious/noExplicitAny: DB enum types are stale until regenerated
const typed = (payload: Record<string, unknown>) => payload as any

interface CommunityNotifyCtx {
  supabase: NotificationSupabaseClient
}

// ── Post Comment ──────────────────────────────────────────────────────────────
export async function notifyPostComment(
  ctx: CommunityNotifyCtx,
  opts: {
    postAuthorId: string
    commenterId: string
    commenterName: string
    postId: string
    postTitle: string
    communitySlug: string
    commentPreview?: string
  }
) {
  // Don't notify if commenting on own post
  if (opts.postAuthorId === opts.commenterId) return

  await insertNotification(ctx.supabase, typed({
    user_id: opts.postAuthorId,
    type: 'community.post_comment',
    severity: 'info',
    title: 'New comment on your post',
    message: `${opts.commenterName} commented on "${opts.postTitle}"`,
    preview: opts.commentPreview?.slice(0, 100) || undefined,
    cta_label: 'View Post',
    cta_url: `/dashboard/communities/${opts.communitySlug}/post/${opts.postId}`,
    metadata: {
      post_id: opts.postId,
      commenter_id: opts.commenterId,
    },
  }))
}

// ── Post Rating ───────────────────────────────────────────────────────────────
export async function notifyPostRating(
  ctx: CommunityNotifyCtx,
  opts: {
    postAuthorId: string
    raterId: string
    raterName: string
    postId: string
    postTitle: string
    communitySlug: string
    baseRating: number
  }
) {
  if (opts.postAuthorId === opts.raterId) return

  await insertNotification(ctx.supabase, typed({
    user_id: opts.postAuthorId,
    type: 'community.post_rating',
    severity: 'info',
    title: 'New rating on your post',
    message: `${opts.raterName} rated "${opts.postTitle}" ${opts.baseRating}/5 stars`,
    cta_label: 'View Post',
    cta_url: `/dashboard/communities/${opts.communitySlug}/post/${opts.postId}`,
    metadata: {
      post_id: opts.postId,
      rater_id: opts.raterId,
      base_rating: opts.baseRating,
    },
  }))
}

// ── Reputation Change ─────────────────────────────────────────────────────────
export async function notifyReputationChange(
  ctx: CommunityNotifyCtx,
  opts: {
    userId: string
    delta: number
    reason: string
    newScore: number
  }
) {
  const direction = opts.delta > 0 ? 'increased' : 'decreased'

  await insertNotification(
    ctx.supabase,
    typed({
      user_id: opts.userId,
      type: 'community.reputation_change',
      severity: 'info',
      title: 'Scaffold Score Updated',
      message: `Your score ${direction} by ${Math.abs(opts.delta)} to ${opts.newScore}. ${opts.reason}`,
      cta_label: 'View Score',
      cta_url: '/dashboard/communities/reputation',
      metadata: {
        delta: opts.delta,
        new_score: opts.newScore,
      },
    }),
    // Dedupe by user+day to avoid spamming on rapid score changes
    `rep_change:${opts.userId}:${new Date().toISOString().slice(0, 10)}`
  )
}

// ── Karma Received ────────────────────────────────────────────────────────────
export async function notifyKarmaReceived(
  ctx: CommunityNotifyCtx,
  opts: {
    receiverId: string
    giverId: string
    giverName: string
    amount: number
    message?: string
  }
) {
  await insertNotification(ctx.supabase, typed({
    user_id: opts.receiverId,
    type: 'community.karma_received',
    severity: 'info',
    title: 'You received karma!',
    message: `${opts.giverName} gifted you ${opts.amount} karma${opts.message ? `: "${opts.message}"` : ''}`,
    cta_label: 'View Score',
    cta_url: '/dashboard/communities/reputation',
    metadata: {
      giver_id: opts.giverId,
      amount: opts.amount,
    },
  }))
}

// ── Followed User Post ────────────────────────────────────────────────────────
export async function notifyFollowedUserPost(
  ctx: CommunityNotifyCtx,
  opts: {
    followerId: string
    authorId: string
    authorName: string
    postId: string
    postTitle: string
    communitySlug: string
  }
) {
  await insertNotification(ctx.supabase, typed({
    user_id: opts.followerId,
    type: 'community.followed_user_post',
    severity: 'info',
    title: 'New post from someone you follow',
    message: `${opts.authorName} published "${opts.postTitle}"`,
    cta_label: 'View Post',
    cta_url: `/dashboard/communities/${opts.communitySlug}/post/${opts.postId}`,
    metadata: {
      post_id: opts.postId,
      author_id: opts.authorId,
    },
  }))
}

// ── Notify All Followers of a New Published Post ─────────────────────────────
export async function notifyFollowersOfNewPost(
  ctx: CommunityNotifyCtx,
  opts: {
    authorId: string
    authorName: string
    postId: string
    postTitle: string
    communitySlug: string
  }
) {
  // Get all users who follow this author
  const { data: followers } = await ctx.supabase
    .schema('core')
    .from('follows')
    .select('follower_id')
    .eq('followee_id', opts.authorId)
    .eq('followee_type', 'user')

  if (!followers || followers.length === 0) return

  // Send notification to each follower (batch in parallel, max 50)
  const batch = followers.slice(0, 50)
  await Promise.allSettled(
    batch.map((f: { follower_id: string }) =>
      notifyFollowedUserPost(ctx, {
        followerId: f.follower_id,
        authorId: opts.authorId,
        authorName: opts.authorName,
        postId: opts.postId,
        postTitle: opts.postTitle,
        communitySlug: opts.communitySlug,
      })
    )
  )
}
