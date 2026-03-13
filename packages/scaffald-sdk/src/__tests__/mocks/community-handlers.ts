import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://api.scaffald.com'

const MOCK_COMMUNITY = {
  id: 'comm_1',
  name: 'Electrical',
  slug: 'electrical',
  description: 'Electrical trade community',
  icon_url: null,
  industry_id: 'ind_1',
  member_count: 150,
  post_count: 42,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const MOCK_POST = {
  id: 'post_1',
  community_id: 'comm_1',
  author_id: 'user_1',
  post_type: 'showcase',
  status: 'published',
  title: 'Electrical Panel Upgrade',
  body: 'Completed a 200A panel upgrade...',
  media_urls: ['https://storage.example.com/photo1.jpg'],
  media_thumbnails: ['https://storage.example.com/thumb1.jpg'],
  skill_tags: ['skill_1', 'skill_2'],
  upvote_count: 12,
  comment_count: 5,
  rating_avg: 4.5,
  rating_count: 3,
  is_published: true,
  published_at: '2024-01-05T00:00:00Z',
  moderation_result: 'approved',
  ai_feedback_summary: 'Great panel work with clean routing.',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-05T00:00:00Z',
  author: {
    id: 'user_1',
    display_name: 'Mike Johnson',
    avatar_url: null,
    headline: 'Master Electrician',
  },
}

const MOCK_COMMENT = {
  id: 'comment_1',
  post_id: 'post_1',
  author_id: 'user_2',
  parent_comment_id: null,
  body: 'Nice work on the routing!',
  is_pinned: false,
  upvote_count: 2,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

const MOCK_SCORE = {
  user_id: 'user_1',
  score: 75,
  karma_bank: 25,
  total_earned: 100,
  updated_at: '2024-01-05T00:00:00Z',
}

export const communityHandlers = [
  // Communities
  http.get(`${BASE_URL}/v1/communities`, () => {
    return HttpResponse.json({ data: [MOCK_COMMUNITY] })
  }),

  http.get(`${BASE_URL}/v1/communities/:slug`, () => {
    return HttpResponse.json({ data: MOCK_COMMUNITY })
  }),

  http.post(`${BASE_URL}/v1/communities/:id/join`, () => {
    return HttpResponse.json({ success: true, message: 'Joined community' })
  }),

  http.delete(`${BASE_URL}/v1/communities/:id/leave`, () => {
    return HttpResponse.json({ success: true, message: 'Left community' })
  }),

  // Posts
  http.get(`${BASE_URL}/v1/communities/posts/feed/:communityId`, () => {
    return HttpResponse.json({ data: [MOCK_POST], next_cursor: null })
  }),

  http.get(`${BASE_URL}/v1/communities/posts/published`, () => {
    return HttpResponse.json({ data: [MOCK_POST], next_cursor: null })
  }),

  http.get(`${BASE_URL}/v1/communities/posts/portfolio/:userId`, () => {
    return HttpResponse.json({ data: [MOCK_POST], next_cursor: null })
  }),

  http.get(`${BASE_URL}/v1/communities/posts/:postId`, () => {
    return HttpResponse.json({ data: MOCK_POST })
  }),

  http.post(`${BASE_URL}/v1/communities/posts`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      data: { ...MOCK_POST, ...body, id: 'post_new', status: 'draft', is_published: false },
    })
  }),

  http.post(`${BASE_URL}/v1/communities/posts/:postId/submit`, () => {
    return HttpResponse.json({ data: { ...MOCK_POST, status: 'published' } })
  }),

  http.post(`${BASE_URL}/v1/communities/posts/:postId/publish`, () => {
    return HttpResponse.json({ data: { ...MOCK_POST, is_published: true } })
  }),

  // Comments
  http.get(`${BASE_URL}/v1/communities/comments/:postId`, () => {
    return HttpResponse.json({ data: [MOCK_COMMENT], total: 1 })
  }),

  http.post(`${BASE_URL}/v1/communities/comments/:postId`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { data: { ...MOCK_COMMENT, id: 'comment_new', body: body.body } },
      { status: 201 }
    )
  }),

  // Ratings
  http.post(`${BASE_URL}/v1/communities/ratings/:postId`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        data: {
          id: 'rating_1',
          post_id: 'post_1',
          rater_id: 'user_2',
          base_rating: body.base_rating,
          quality_rating: body.quality_rating ?? null,
          technique_rating: body.technique_rating ?? null,
          creativity_rating: body.creativity_rating ?? null,
          created_at: '2024-01-03T00:00:00Z',
        },
      },
      { status: 201 }
    )
  }),

  http.get(`${BASE_URL}/v1/communities/ratings/summary/:postId`, () => {
    return HttpResponse.json({
      data: {
        rating_avg: 4.5,
        rating_count: 3,
        quality_avg: 4.0,
        technique_avg: 4.5,
        creativity_avg: 5.0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 1, '5': 2 },
      },
    })
  }),

  // Interactions
  http.post(`${BASE_URL}/v1/communities/interactions/upvote`, () => {
    return HttpResponse.json({ success: true })
  }),

  http.post(`${BASE_URL}/v1/communities/interactions/bookmark/:postId`, () => {
    return HttpResponse.json({
      data: {
        id: 'bm_1',
        user_id: 'user_1',
        post_id: 'post_1',
        created_at: '2024-01-05T00:00:00Z',
      },
    })
  }),

  // Reputation
  http.get(`${BASE_URL}/v1/communities/reputation/me`, () => {
    return HttpResponse.json({ data: MOCK_SCORE })
  }),

  http.get(`${BASE_URL}/v1/communities/reputation/user/:userId`, () => {
    return HttpResponse.json({ data: MOCK_SCORE })
  }),

  http.post(`${BASE_URL}/v1/communities/reputation/gift-karma`, () => {
    return HttpResponse.json({ success: true, message: 'Gifted 5 karma' })
  }),

  // Skills
  http.get(`${BASE_URL}/v1/communities/skills/search`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'skill_1',
          name: 'Panel Installation',
          slug: 'panel-installation',
          tier: 2,
          parent_id: 'skill_parent_1',
          community_id: 'comm_1',
          description: 'Installing electrical panels',
        },
      ],
    })
  }),

  // Office Communities
  http.get(`${BASE_URL}/v1/office/communities/verification-queue`, () => {
    return HttpResponse.json({
      data: [
        {
          membership_id: 'mem_1',
          community_id: 'comm_1',
          community_name: 'Electrical',
          user_id: 'user_3',
          display_name: 'Jane Smith',
          email: 'jane@example.com',
          verification_data: {
            state: 'CA',
            license_number: 'EL-12345',
            license_type: 'Journeyman Electrician',
            submitted_at: '2024-01-01T00:00:00Z',
            status: 'pending',
          },
          joined_at: '2023-12-15T00:00:00Z',
        },
      ],
      total: 1,
    })
  }),

  http.patch(`${BASE_URL}/v1/office/communities/verify/:membershipId`, () => {
    return HttpResponse.json({ success: true, message: 'Verification approved' })
  }),

  http.patch(`${BASE_URL}/v1/office/communities/reject/:membershipId`, () => {
    return HttpResponse.json({ success: true, message: 'Verification rejected' })
  }),
]
