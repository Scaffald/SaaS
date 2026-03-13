/**
 * Community Professional Search REST API
 * Employer search: natural language → structured filters → ranked results
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  community_id: z.string().uuid().optional(),
  limit: z.number().int().positive().max(50).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
})

const professionalResultSchema = z
  .object({
    user_id: z.string().uuid(),
    display_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    headline: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    scaffold_score: z.number().int(),
    rating_avg: z.number().nullable(),
    rating_count: z.number().int(),
    published_post_count: z.number().int(),
    skill_tags: z.array(z.string()),
    is_verified: z.boolean(),
  })
  .openapi('ProfessionalResult')

// ============================================================================
// POST /v1/communities/search/professionals — Search professionals
// ============================================================================

const searchProfessionalsRoute = createRoute({
  method: 'post',
  path: '/professionals',
  tags: ['Community Search'],
  summary: 'Search professionals',
  description:
    'Search for trade professionals using natural language. Parses queries into structured filters and ranks by Scaffold Score + skill match.',
  request: {
    body: {
      content: { 'application/json': { schema: searchRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Search results',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(professionalResultSchema),
            total: z.number().int(),
            parsed_filters: z.unknown().optional(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(searchProfessionalsRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const { query, community_id, limit, offset } = c.req.valid('json')

  // Step 1: Parse natural language into structured filters
  const filters = await parseSearchQuery(query)

  // Step 2: Query professionals
  // Get users who are members of relevant communities and have published posts
  let membershipsQuery = supabase
    .schema('community')
    .from('memberships')
    .select('user_id, community_id, is_verified')

  if (community_id) {
    membershipsQuery = membershipsQuery.eq('community_id', community_id)
  }

  const { data: memberships } = await membershipsQuery

  if (!memberships || memberships.length === 0) {
    return c.json({ data: [], total: 0, parsed_filters: filters })
  }

  const userIds = [...new Set(memberships.map((m: Record<string, unknown>) => m.user_id))]
  const verifiedMap = new Map<string, boolean>()
  for (const m of memberships) {
    if (m.is_verified) verifiedMap.set(m.user_id, true)
  }

  // Get user profiles
  let usersQuery = supabase
    .schema('core')
    .from('users')
    .select('id, display_name, avatar_url, headline, city, state')
    .in('id', userIds)

  if (filters.state) {
    usersQuery = usersQuery.ilike('state', filters.state)
  }

  if (filters.city) {
    usersQuery = usersQuery.ilike('city', `%${filters.city}%`)
  }

  const { data: users } = await usersQuery

  if (!users || users.length === 0) {
    return c.json({ data: [], total: 0, parsed_filters: filters })
  }

  const matchedUserIds = users.map((u: Record<string, unknown>) => u.id)

  // Get scaffold scores
  const { data: scores } = await supabase
    .schema('community')
    .from('scaffold_scores')
    .select('user_id, score')
    .in('user_id', matchedUserIds)

  const scoreMap = new Map((scores || []).map((s: Record<string, unknown>) => [s.user_id, s.score]))

  // Get published post counts and rating data
  const { data: postStats } = await supabase
    .schema('community')
    .from('posts')
    .select('author_id, rating_avg, rating_count, skill_tags')
    .in('author_id', matchedUserIds)
    .eq('is_published', true)
    .is('deleted_at', null)

  const userPostStats = new Map<
    string,
    { count: number; totalRating: number; ratingCount: number; skillTags: Set<string> }
  >()

  for (const post of postStats || []) {
    const existing = userPostStats.get(post.author_id) || {
      count: 0,
      totalRating: 0,
      ratingCount: 0,
      skillTags: new Set<string>(),
    }
    existing.count++
    if (post.rating_avg) {
      existing.totalRating += post.rating_avg * (post.rating_count || 1)
      existing.ratingCount += post.rating_count || 1
    }
    for (const tag of post.skill_tags || []) {
      existing.skillTags.add(tag)
    }
    userPostStats.set(post.author_id, existing)
  }

  // Get skill names for display
  const allSkillIds = new Set<string>()
  for (const stats of userPostStats.values()) {
    for (const id of stats.skillTags) allSkillIds.add(id)
  }

  const { data: skillNames } = allSkillIds.size > 0
    ? await supabase
        .schema('community')
        .from('skill_taxonomy')
        .select('id, name')
        .in('id', [...allSkillIds])
    : { data: [] }

  const skillNameMap = new Map((skillNames || []).map((s: Record<string, unknown>) => [s.id, s.name]))

  // Build results with ranking
  const results = users.map((user: Record<string, unknown>) => {
    const stats = userPostStats.get(user.id) || {
      count: 0,
      totalRating: 0,
      ratingCount: 0,
      skillTags: new Set<string>(),
    }

    const ratingAvg = stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : null
    const score = scoreMap.get(user.id) ?? 100

    return {
      user_id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      headline: user.headline,
      city: user.city,
      state: user.state,
      scaffold_score: score,
      rating_avg: ratingAvg ? Math.round(ratingAvg * 100) / 100 : null,
      rating_count: stats.ratingCount,
      published_post_count: stats.count,
      skill_tags: [...stats.skillTags].map((id) => skillNameMap.get(id) || id),
      is_verified: verifiedMap.has(user.id),
      // Ranking score (not returned, used for sorting)
      _rank: score * 0.4 + (ratingAvg || 0) * 10 + stats.count * 2 + (verifiedMap.has(user.id) ? 20 : 0),
    }
  })

  // Sort by ranking score
  results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b._rank as number) - (a._rank as number))

  // Paginate
  const total = results.length
  const paginated = results.slice(offset, offset + limit).map(({ _rank, ...rest }: Record<string, unknown>) => rest)

  return c.json({ data: paginated, total, parsed_filters: filters })
})

// ============================================================================
// Query parser (simple keyword extraction, upgradeable to OpenAI)
// ============================================================================

interface ParsedFilters {
  skills: string[]
  state: string | null
  city: string | null
  keywords: string[]
}

async function parseSearchQuery(query: string): Promise<ParsedFilters> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  // If OpenAI available, use it for natural language parsing
  if (openaiKey) {
    try {
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
              content: `Extract structured search filters from a natural language query about finding trade professionals. Return JSON: {"skills": ["skill names"], "state": "2-letter state or null", "city": "city name or null", "keywords": ["other keywords"]}`,
            },
            { role: 'user', content: query },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return JSON.parse(data.choices[0].message.content) as ParsedFilters
      }
    } catch (err) {
      console.error('[community-search] OpenAI parse error:', err)
    }
  }

  // Fallback: simple keyword extraction
  const words = query.toLowerCase().split(/\s+/)
  const stateAbbreviations = new Set([
    'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia',
    'ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj',
    'nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt',
    'va','wa','wv','wi','wy',
  ])

  let state: string | null = null
  const keywords: string[] = []

  for (const word of words) {
    if (stateAbbreviations.has(word)) {
      state = word.toUpperCase()
    } else {
      keywords.push(word)
    }
  }

  return { skills: keywords, state, city: null, keywords }
}

export default app
