/**
 * Community AI Feedback Summary Edge Function.
 *
 * Service role only. Meant to run when a published post reaches 5+ comments
 * (#1271); it is not deployed until that lands. The logic lives in `summary.ts`
 * so it can be tested (#1270).
 *
 * Input: { post_id }
 * Output: { summary }, which is also stored on the post.
 */

import { createClient } from '@supabase/supabase-js'

import { handleSummary, type SummaryPost } from './summary.ts'

function serviceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  return createClient(supabaseUrl, serviceKey).schema('community')
}

Deno.serve((req) =>
  handleSummary(req, {
    openaiKey: Deno.env.get('OPENAI_API_KEY'),
    fetch,
    loadPost: async (postId) => {
      const { data, error } = await serviceClient()
        .from('posts')
        .select('id, title, body, post_type, comment_count')
        .eq('id', postId)
        .maybeSingle()
      if (error) throw new Error(`Failed to load post: ${error.message}`)
      return (data as SummaryPost | null) ?? null
    },
    // Comment bodies only — no author information reaches the model.
    loadComments: async (postId) => {
      const { data, error } = await serviceClient()
        .from('comments')
        .select('body')
        .eq('post_id', postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      if (error) throw new Error(`Failed to load comments: ${error.message}`)
      return (data ?? []).map((c: { body: string }) => c.body)
    },
    saveSummary: async (postId, summary) => {
      const { error } = await serviceClient()
        .from('posts')
        .update({ ai_feedback_summary: summary, ai_summary_updated_at: new Date().toISOString() })
        .eq('id', postId)
      if (error) throw new Error(`Failed to store summary: ${error.message}`)
    },
  })
)
