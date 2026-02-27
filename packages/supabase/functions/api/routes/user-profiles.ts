import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'
import { enrichUserSkills } from '../../trpc/routers/utils/skill-enrichment.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../_shared/database.types.ts'

const app = new OpenAPIHono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

/**
 * Zod Schemas for User Profiles API
 */

// User Profile Preview Schema (lightweight)
const userProfilePreviewSchema = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
    avatarPath: z.string().nullable(),
    headline: z.string().nullable(),
    location: z.string().nullable(),
    topSkills: z.array(
      z.object({
        proficiency: z.number(),
        taxonomy: z.string().nullable(),
        csiSkillId: z.string().nullable(),
        onetOccupationId: z.string().nullable(),
      })
    ),
  })
  .openapi('UserProfilePreview')

// User Profile Detailed Schema
const userProfileDetailedSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    headline: z.string().nullable(),
    bio: z.string().nullable(),
    industry_name: z.string().nullable(),
    years_of_experience: z.number().nullable(),
    calculatedYearsOfExperience: z.number(),
    gamified_score: z.number().nullable(),
    location: z.string().nullable(),
    availability: z.string().nullable(),
    certifications: z.array(z.unknown()).nullable(),
    hourly_rate_cents: z.number().nullable(),
    open_to_travel: z.boolean().nullable(),
    travel_mileage: z.number().nullable(),
    open_to_work: z.boolean().nullable(),
    education_level: z.string().nullable(),
  })
  .openapi('UserProfileDetailed')

// User Skill Schema
const userSkillSchema = z
  .object({
    id: z.string().uuid(),
    taxonomy: z.enum(['csi', 'onet']),
    csiSkillId: z.string().nullable(),
    onetOccupationId: z.string().nullable(),
    tradeId: z.string().nullable(),
    tradeSlug: z.string().nullable(),
    tradeName: z.string().nullable(),
    name: z.string(),
    code: z.string().nullable(),
    displayCode: z.string().nullable(),
    label: z.string(),
    taxonomyLabel: z.enum(['CSI MasterFormat', 'O*NET Occupation']),
    description: z.string().nullable(),
    proficiency: z.number(),
    yearsExperience: z.number().nullable(),
    verified: z.boolean(),
    verifiedAt: z.string().nullable(),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
  })
  .openapi('UserSkill')

// User Certification Schema
const userCertificationSchema = z
  .object({
    id: z.string().uuid(),
    certification_id: z.string().uuid(),
    user_id: z.string().uuid(),
    issue_date: z.string().nullable(),
    expiration_date: z.string().nullable(),
    credential_id: z.string().nullable(),
    credential_url: z.string().nullable(),
    created_at: z.string(),
    is_active: z.boolean(),
  })
  .openapi('UserCertification')

// User Experience Schema
const userExperienceSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    job_title: z.string(),
    company_name: z.string(),
    location: z.string().nullable(),
    start_date: z.string(),
    end_date: z.string().nullable(),
    is_current: z.boolean(),
    description: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi('UserExperience')

// User Education Schema
const userEducationSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    school_name: z.string(),
    degree: z.string().nullable(),
    field_of_study: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    is_current: z.boolean(),
    gpa: z.number().nullable(),
    description: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi('UserEducation')

// Reviews Summary Schema
const reviewsSummarySchema = z
  .object({
    averageRating: z.number(),
    totalReviews: z.number(),
    ratings: z.record(z.string(), z.unknown()),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    reviews: z.array(
      z.object({
        id: z.string().uuid(),
        headline: z.string(),
        body: z.string(),
        date: z.string(),
        rating: z.number(),
        authorId: z.string().uuid().nullable(),
      })
    ),
  })
  .openapi('ReviewsSummary')

// Contact Info Schema
const contactInfoSchema = z
  .object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    employment_city: z.string().nullable(),
    employment_state: z.string().nullable(),
    employment_zip: z.string().nullable(),
  })
  .openapi('ContactInfo')

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

/**
 * Helper Functions
 */

async function userHasPlatformRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Unable to verify platform roles: ${error.message}`)
  }

  return Boolean(
    data?.some((assignment: { role: { name?: string; scope?: string } | { name?: string; scope?: string }[] }) => {
      const role = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role
      return role?.scope === 'platform' && ['office', 'super_admin'].includes(role?.name ?? '')
    })
  )
}

async function ensureOrganizationAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationId: string
) {
  if (await userHasPlatformRole(supabase, userId)) {
    return
  }

  const { data: organization, error: orgError } = await supabase
    .schema('core')
    .from('organizations')
    .select('id, owner_user_id')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) {
    throw new Error(`Failed to load organization: ${orgError.message}`)
  }

  if (!organization) {
    throw new Error('Organization not found')
  }

  if (organization.owner_user_id === userId) {
    return
  }

  const { data: assignment } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('scope_org_id')
    .eq('user_id', userId)
    .eq('scope_org_id', organizationId)
    .maybeSingle()

  if (!assignment) {
    throw new Error('You do not have access to this organization')
  }
}

/**
 * GET /v1/user-profiles/:userId/preview
 * Get lightweight user profile preview for map view
 */
const getPreviewRoute = createRoute({
  method: 'get',
  path: '/{userId}/preview',
  tags: ['User Profiles'],
  summary: 'Get user profile preview',
  description: 'Returns optimized lightweight data for quick loading in map context with top skills',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'User profile preview',
      content: {
        'application/json': {
          schema: userProfilePreviewSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getPreviewRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  // Get basic user info
  const { data: user, error: userError } = await supabase
    .schema('core')
    .from('users')
    .select('id, display_name, username, avatar_path, avatar_url, headline')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return c.json(
      {
        error: 'Not Found',
        message: `User profile not found: ${userError?.message || 'Unknown error'}`,
      },
      404
    )
  }

  // Get top 3-5 skills
  const { data: skills } = await supabase
    .schema('core')
    .from('user_skills')
    .select('proficiency_level, skill_taxonomy, csi_skill_id, onet_occupation_id')
    .eq('user_id', userId)
    .order('proficiency_level', { ascending: false })
    .limit(5)

  // Get location from profile
  const { data: profile } = await supabase
    .schema('core')
    .from('profile')
    .select('location, employment_city, employment_state')
    .eq('user_id', userId)
    .single()

  // Build location string
  const locationParts = []
  if (profile?.employment_city) {
    locationParts.push(profile.employment_city)
  }
  if (profile?.employment_state) {
    locationParts.push(profile.employment_state)
  }
  const location =
    locationParts.length > 0 ? locationParts.join(', ') : profile?.location || null

  // Build display name
  const displayName = user.display_name || user.username || 'User'

  return c.json(
    {
      id: user.id,
      displayName,
      avatarUrl: user.avatar_url,
      avatarPath: user.avatar_path,
      headline: user.headline,
      location,
      topSkills: (skills || [])
        .slice(0, 5)
        .map(
          (skill: {
            proficiency_level?: number | null
            skill_taxonomy?: string | null
            csi_skill_id?: string | null
            onet_occupation_id?: string | null
          }) => ({
            proficiency: skill.proficiency_level || 0,
            taxonomy: skill.skill_taxonomy,
            csiSkillId: skill.csi_skill_id,
            onetOccupationId: skill.onet_occupation_id,
          })
        ),
    },
    200
  )
})

/**
 * GET /v1/user-profiles/:userId
 * Get comprehensive user profile
 */
const getUserProfileRoute = createRoute({
  method: 'get',
  path: '/{userId}',
  tags: ['User Profiles'],
  summary: 'Get comprehensive user profile',
  description: 'Includes all public profile data for detailed views',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Detailed user profile',
      content: {
        'application/json': {
          schema: userProfileDetailedSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserProfileRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  const { data: profile, error } = await supabase
    .schema('core')
    .from('v_profile_search')
    .select(
      `
      id,
      name,
      avatar_url,
      headline,
      bio,
      industry_name,
      years_of_experience,
      gamified_score,
      location,
      availability,
      certifications,
      hourly_rate_cents,
      open_to_travel,
      travel_mileage,
      open_to_work,
      education_level
    `
    )
    .eq('id', userId)
    .single()

  if (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: `Failed to fetch user profile: ${error.message}`,
      },
      500
    )
  }

  const { data: calculatedYears, error: yearsError } = await supabase.rpc(
    'calculate_years_of_experience',
    { p_user_id: userId }
  )

  if (yearsError) {
    console.warn('[userProfile.getUserProfile] Unable to calculate years of experience', {
      userId,
      error: yearsError.message,
    })
  }

  return c.json(
    {
      ...profile,
      calculatedYearsOfExperience: calculatedYears ?? profile?.years_of_experience ?? 0,
    },
    200
  )
})

/**
 * GET /v1/user-profiles/:userId/skills
 * Get user skills with proficiency
 */
const getUserSkillsRoute = createRoute({
  method: 'get',
  path: '/{userId}/skills',
  tags: ['User Profiles'],
  summary: 'Get user skills',
  description: 'Includes skill details from CSI/ONET taxonomies with enrichment data',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Array of enriched user skills',
      content: {
        'application/json': {
          schema: z.array(userSkillSchema),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserSkillsRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  const { data: skills, error } = await supabase
    .schema('core')
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('proficiency_level', { ascending: false })

  if (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: `Failed to fetch user skills: ${error.message}`,
      },
      500
    )
  }

  const enrichedSkills = await enrichUserSkills(supabase, skills ?? [])

  return c.json(enrichedSkills, 200)
})

/**
 * GET /v1/user-profiles/:userId/certifications
 * Get user certifications
 */
const getUserCertificationsRoute = createRoute({
  method: 'get',
  path: '/{userId}/certifications',
  tags: ['User Profiles'],
  summary: 'Get user certifications',
  description: 'Includes certification details and expiration tracking',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Array of user certifications',
      content: {
        'application/json': {
          schema: z.array(userCertificationSchema),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserCertificationsRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  const { data: certifications, error } = await supabase
    .schema('core')
    .from('user_certifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('issue_date', { ascending: false })

  if (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: `Failed to fetch certifications: ${error.message}`,
      },
      500
    )
  }

  return c.json(certifications || [], 200)
})

/**
 * GET /v1/user-profiles/:userId/experience
 * Get user work experience
 */
const getUserExperienceRoute = createRoute({
  method: 'get',
  path: '/{userId}/experience',
  tags: ['User Profiles'],
  summary: 'Get user work experience',
  description: 'Includes current and past positions',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Array of work experience entries',
      content: {
        'application/json': {
          schema: z.array(userExperienceSchema),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserExperienceRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  const { data: experience, error } = await supabase
    .schema('core')
    .from('user_experience')
    .select('*')
    .eq('user_id', userId)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false })

  if (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: `Failed to fetch work experience: ${error.message}`,
      },
      500
    )
  }

  return c.json(experience || [], 200)
})

/**
 * GET /v1/user-profiles/:userId/education
 * Get user education
 */
const getUserEducationRoute = createRoute({
  method: 'get',
  path: '/{userId}/education',
  tags: ['User Profiles'],
  summary: 'Get user education',
  description: 'Includes degrees and ongoing education',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Array of education entries',
      content: {
        'application/json': {
          schema: z.array(userEducationSchema),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserEducationRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  const { data: education, error } = await supabase
    .schema('core')
    .from('user_education')
    .select('*')
    .eq('user_id', userId)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false })

  if (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: `Failed to fetch education: ${error.message}`,
      },
      500
    )
  }

  return c.json(education || [], 200)
})

/**
 * GET /v1/user-profiles/:userId/reviews-summary
 * Get user reviews summary
 */
const getUserReviewsSummaryRoute = createRoute({
  method: 'get',
  path: '/{userId}/reviews-summary',
  tags: ['User Profiles'],
  summary: 'Get user reviews summary',
  description: 'Aggregated review metrics and recent feedback',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Reviews summary with ratings and feedback',
      content: {
        'application/json': {
          schema: reviewsSummarySchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserReviewsSummaryRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const { userId } = c.req.valid('param')

  // Get reviews for this user (simplified for current schema)
  const { data: reviews, error: reviewsError } = await supabase
    .schema('core')
    .from('reviews')
    .select('*')
    .eq('subject_id', userId)
    .eq('subject_type', 'user')
    .order('created_at', { ascending: false })

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError)
    // Return empty data structure instead of throwing
    return c.json(
      {
        averageRating: 0,
        totalReviews: 0,
        ratings: {},
        strengths: [],
        improvements: [],
        reviews: [],
      },
      200
    )
  }

  const reviewsList = reviews || []
  const totalReviews = reviewsList.length

  // Calculate average rating if rating field exists
  const ratingsArray = reviewsList
    .filter((r: { rating?: number | null }) => r.rating != null)
    .map((r: { rating?: number | null }) => r.rating)
  const averageRating =
    ratingsArray.length > 0
      ? Math.round(
          (ratingsArray.reduce(
            (sum: number, val: number | null | undefined) => sum + (val ?? 0),
            0
          ) /
            ratingsArray.length) *
            10
        ) / 10
      : 0

  // Return simplified structure (full review system not yet implemented in schema)
  return c.json(
    {
      averageRating,
      totalReviews,
      ratings: {},
      strengths: [],
      improvements: [],
      reviews: reviewsList
        .slice(0, 10)
        .map(
          (review: {
            id: string
            headline?: string | null
            body?: string | null
            created_at: string
            rating?: number | null
            author_user_id?: string | null
          }) => ({
            id: review.id,
            headline: review.headline || '',
            body: review.body || '',
            date: review.created_at,
            rating: review.rating || 0,
            authorId: review.author_user_id,
          })
        ),
    },
    200
  )
})

/**
 * GET /v1/user-profiles/:userId/contact-info
 * Get user contact info (requires authentication and success fee payment)
 */
const getUserContactInfoRoute = createRoute({
  method: 'get',
  path: '/{userId}/contact-info',
  tags: ['User Profiles'],
  summary: 'Get user contact info',
  description: 'Access is gated by success fee payment. Requires organizationId and applicationId query params.',
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    query: z.object({
      organizationId: z.string().uuid().openapi({
        description: 'Organization ID requesting contact info',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
      applicationId: z.string().uuid().openapi({
        description: 'Application ID for success fee verification',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Contact information',
      content: {
        'application/json': {
          schema: contactInfoSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - success fee payment required',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Contact information not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getUserContactInfoRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient<Database>
  const user = c.get('user')
  const { userId } = c.req.valid('param')
  const { organizationId, applicationId } = c.req.valid('query')

  if (!user) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required to access contact information',
      },
      401
    )
  }

  try {
    await ensureOrganizationAccess(supabase, user.id, organizationId)
  } catch (error) {
    return c.json(
      {
        error: 'Forbidden',
        message: error instanceof Error ? error.message : 'Access denied',
      },
      403
    )
  }

  const { data: successFee } = await supabase
    .schema('core')
    .from('success_fees')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('application_id', applicationId)
    .eq('worker_user_id', userId)
    .eq('status', 'upfront_paid')
    .maybeSingle()

  if (!successFee) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Success fee payment is required to access worker contact information.',
      },
      403
    )
  }

  const { data: contactInfo, error } = await supabase
    .schema('core')
    .from('profile')
    .select(
      `
      email,
      phone,
      location,
      employment_city,
      employment_state,
      employment_zip
    `
    )
    .eq('user_id', userId)
    .single()

  if (error) {
    return c.json(
      {
        error: 'Not Found',
        message: 'Contact information not found',
      },
      404
    )
  }

  return c.json(contactInfo, 200)
})

export default app
