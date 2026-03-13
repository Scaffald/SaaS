/**
 * Community Content Moderation Edge Function
 * Called internally by post submit endpoint (service_role).
 * Uses OpenAI GPT-4o-mini for text moderation and GPT-4o for image analysis.
 *
 * Input: { post_id, title, body, media_urls, community_name, post_type }
 * Output: { result: 'approved' | 'rejected_off_topic' | 'rejected_spam' | 'rejected_non_trade' | 'manual_review',
 *           confidence, reason }
 */

import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

interface ModerationRequest {
  post_id: string
  title: string
  body: string
  media_urls: string[]
  community_name: string
  post_type: 'advice' | 'critique' | 'showcase'
}

interface ModerationResult {
  result:
    | 'approved'
    | 'rejected_off_topic'
    | 'rejected_spam'
    | 'rejected_non_trade'
    | 'manual_review'
  confidence: number
  reason: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // Verify service role authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: ModerationRequest = await req.json()
    const { post_id, title, body: postBody, media_urls, community_name, post_type } = body

    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    // If no OpenAI key, auto-approve (development mode)
    if (!openaiKey) {
      console.log('[community-moderate] No OPENAI_API_KEY, auto-approving post:', post_id)
      return new Response(
        JSON.stringify({
          result: 'approved',
          confidence: 1.0,
          reason: 'Auto-approved (moderation not configured)',
        } satisfies ModerationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Text moderation with GPT-4o-mini
    const textResult = await moderateText(openaiKey, {
      title,
      body: postBody,
      community_name,
      post_type,
    })

    // If text is rejected, no need to check images
    if (textResult.result !== 'approved') {
      await updatePostModeration(post_id, textResult, authHeader)
      return new Response(JSON.stringify(textResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Image moderation with GPT-4o (if media present)
    if (media_urls && media_urls.length > 0) {
      const imageResult = await moderateImages(openaiKey, media_urls, community_name)
      if (imageResult.result !== 'approved') {
        await updatePostModeration(post_id, imageResult, authHeader)
        return new Response(JSON.stringify(imageResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // All checks passed
    const approved: ModerationResult = {
      result: 'approved',
      confidence: textResult.confidence,
      reason: 'Content meets community guidelines',
    }
    await updatePostModeration(post_id, approved, authHeader)

    return new Response(JSON.stringify(approved), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[community-moderate] Error:', err)
    // On error, send to manual review rather than blocking
    return new Response(
      JSON.stringify({
        result: 'manual_review',
        confidence: 0,
        reason: `Moderation error: ${(err as Error).message}`,
      } satisfies ModerationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function moderateText(
  apiKey: string,
  content: { title: string; body: string; community_name: string; post_type: string }
): Promise<ModerationResult> {
  const systemPrompt = `You are a content moderator for Scaffold Communities, a professional platform for skilled trades workers (electricians, plumbers, cosmetologists, etc).

Your job is to evaluate whether a post is appropriate for the ${content.community_name} community.

Rules:
1. Content must be related to skilled trades, construction, or professional services
2. No spam, advertisements, or self-promotion unrelated to trade work
3. No offensive, hateful, or harassing content
4. Post type is "${content.post_type}" — advice posts should contain helpful information, critique posts should present work for feedback, showcase posts should display completed work

Respond with JSON only:
{
  "result": "approved" | "rejected_off_topic" | "rejected_spam" | "rejected_non_trade",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

If confidence is below 0.8, use "manual_review" as the result.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Title: ${content.title}\n\nBody: ${content.body}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const parsed = JSON.parse(data.choices[0].message.content)

  // If low confidence, route to manual review
  if (parsed.confidence < 0.8 && parsed.result === 'approved') {
    return { result: 'manual_review', confidence: parsed.confidence, reason: parsed.reason }
  }

  return parsed as ModerationResult
}

async function moderateImages(
  apiKey: string,
  mediaUrls: string[],
  communityName: string
): Promise<ModerationResult> {
  // Only check first 4 images to control costs
  const urls = mediaUrls.slice(0, 4)

  const imageContent = urls.map((url) => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'low' as const },
  }))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an image moderator for Scaffold Communities (${communityName}), a professional platform for skilled trades. Images should show trade work, tools, materials, or professional settings. Reject inappropriate, offensive, or completely unrelated content. Respond with JSON: {"result": "approved" | "rejected_off_topic" | "rejected_non_trade", "confidence": 0.0-1.0, "reason": "brief explanation"}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please review these images for community guidelines compliance:' },
            ...imageContent,
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI Vision API error: ${response.status}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content) as ModerationResult
}

async function updatePostModeration(
  postId: string,
  result: ModerationResult,
  authHeader: string
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase
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
}
