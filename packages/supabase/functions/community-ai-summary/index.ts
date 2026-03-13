/**
 * Community AI Feedback Summary Edge Function
 * Generates a 2-3 sentence summary of community feedback on a post.
 * Triggered when a published post reaches 5+ comments.
 *
 * Input: { post_id }
 * Output: { summary }
 */

import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { post_id } = await req.json()

    if (!post_id) {
      return new Response(JSON.stringify({ error: 'post_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the post
    const { data: post } = await supabase
      .schema('community')
      .from('posts')
      .select('id, title, body, post_type, comment_count')
      .eq('id', post_id)
      .maybeSingle()

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (post.comment_count < 5) {
      return new Response(
        JSON.stringify({ error: 'Post needs at least 5 comments for AI summary' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all non-deleted comments (anonymized — no author info)
    const { data: comments } = await supabase
      .schema('community')
      .from('comments')
      .select('body, created_at')
      .eq('post_id', post_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (!comments || comments.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Not enough active comments' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no OpenAI key, return placeholder
    if (!openaiKey) {
      const placeholder = `This ${post.post_type} post received ${comments.length} comments from community members. Key themes discussed include feedback on technique and suggestions for improvement.`
      await supabase
        .schema('community')
        .from('posts')
        .update({
          ai_feedback_summary: placeholder,
          ai_summary_updated_at: new Date().toISOString(),
        })
        .eq('id', post_id)

      return new Response(JSON.stringify({ summary: placeholder }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate summary with GPT-4o-mini
    const commentTexts = comments
      .map((c: Record<string, unknown>, i: number) => `Comment ${i + 1}: ${c.body as string}`)
      .join('\n\n')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant summarizing community feedback on a skilled trades ${post.post_type} post. Generate a concise 2-3 sentence summary of the key themes, suggestions, and consensus from the community comments. Do NOT reference individual commenters — summarize the collective feedback. Keep it professional and constructive.`,
          },
          {
            role: 'user',
            content: `Post title: "${post.title}"\n\nPost body: ${post.body}\n\nCommunity feedback (${comments.length} comments):\n\n${commentTexts}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.choices[0].message.content.trim()

    // Store summary on the post
    await supabase
      .schema('community')
      .from('posts')
      .update({
        ai_feedback_summary: summary,
        ai_summary_updated_at: new Date().toISOString(),
      })
      .eq('id', post_id)

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[community-ai-summary] Error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
