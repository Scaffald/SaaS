/**
 * Community Content Moderation Edge Function.
 *
 * Service role only. The post submit endpoint calls it (#1271); it is not
 * deployed until that lands. The logic lives in `moderation.ts` so it can be
 * tested (#1270).
 *
 * Input: { post_id, title, body, media_urls, community_name, post_type }
 * Output: { result, confidence, reason }, and the verdict is written to the post.
 */

import { createClient } from '@supabase/supabase-js'

import { handleModeration, type ModerationResult } from './moderation.ts'

async function updatePost(postId: string, result: ModerationResult): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  const { error } = await createClient(supabaseUrl, serviceKey)
    .schema('community')
    .from('posts')
    .update({
      moderation_result: result.result,
      moderation_metadata: {
        confidence: result.confidence,
        reason: result.reason,
        moderated_at: new Date().toISOString(),
      },
    })
    .eq('id', postId)
  if (error) throw new Error(`Failed to record moderation: ${error.message}`)
}

Deno.serve((req) =>
  handleModeration(req, { openaiKey: Deno.env.get('OPENAI_API_KEY'), fetch, updatePost })
)
