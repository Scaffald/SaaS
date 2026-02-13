/**
 * Skills REST API
 * Manages user skills (soft skills, hard skills, multi-taxonomy)
 * Supports CSI and O*NET skill taxonomies
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

// Soft Skills Schemas
const softSkillCategorySchema = z.enum(['reliability', 'collaboration', 'professionalism', 'technical'])

const softSkillViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: softSkillCategorySchema,
  description: z.string().nullable(),
  orderIndex: z.number(),
  rating: z.number().nullable(),
  selfAssessedAt: z.string().nullable(),
})

const categoryAveragesSchema = z.record(softSkillCategorySchema, z.number())

const getSoftSkillsResponseSchema = z
  .object({
    version: z.number().nullable(),
    lastUpdated: z.string().nullable(),
    categoryAverages: categoryAveragesSchema,
    skills: z.array(softSkillViewSchema),
  })
  .openapi('GetSoftSkillsResponse')

const updateSoftSkillsSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.string().uuid(),
      rating: z.number().min(1).max(5),
    })
  ),
})

const updateSoftSkillsResponseSchema = z
  .object({
    version: z.number(),
    selfAssessedAt: z.string(),
    createdNewVersion: z.boolean(),
    categoryAverages: categoryAveragesSchema,
  })
  .openapi('UpdateSoftSkillsResponse')

// Hard Skills Schemas
const industrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
})

const getIndustriesResponseSchema = z
  .object({
    industries: z.array(industrySchema),
  })
  .openapi('GetIndustriesResponse')

const searchParentSkillsSchema = z.object({
  query: z.string(),
  industryId: z.string().uuid().optional(),
  limit: z.number().int().positive().optional(),
})

const parentSkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
})

const searchParentSkillsResponseSchema = z
  .object({
    skills: z.array(parentSkillSchema),
  })
  .openapi('SearchParentSkillsResponse')

const userSkillSchema = z.object({
  id: z.string().uuid().optional(),
  skill_id: z.string().uuid(),
  skill_name: z.string(),
  proficiency: z.number().min(1).max(10),
  years_experience: z.number().optional(),
  is_explicit: z.boolean().optional(),
  verified: z.boolean().optional(),
})

const getUserSkillsResponseSchema = z
  .object({
    explicitSkills: z.array(userSkillSchema),
    impliedSkills: z.array(userSkillSchema),
    allSkills: z.array(userSkillSchema),
  })
  .openapi('GetUserSkillsResponse')

const addUserSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().min(1).max(10),
})

const updateUserSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().min(1).max(10).optional(),
})

// Multi-Taxonomy Schemas
const skillTaxonomySchema = z.enum(['csi', 'onet'])

const skillDetailsMTSchema = z.object({
  code: z.string(),
  display_code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  hierarchy_level: z.number().nullable(),
})

const userSkillMTSchema = z.object({
  id: z.string().uuid(),
  skill_taxonomy: z.string(),
  csi_skill_id: z.string().uuid().nullable(),
  onet_occupation_id: z.string().nullable(),
  proficiency_level: z.number(),
  years_experience: z.number().nullable(),
  verified: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.string(),
  skill_details: skillDetailsMTSchema.nullable(),
})

const getUserSkillsMTResponseSchema = z
  .object({
    skills: z.array(userSkillMTSchema),
  })
  .openapi('GetUserSkillsMTResponse')

const addSkillMTSchema = z.object({
  taxonomy: skillTaxonomySchema,
  skillId: z.string(),
  proficiencyLevel: z.number().min(1).max(10),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
})

const updateSkillMTSchema = z.object({
  userSkillId: z.string().uuid(),
  proficiencyLevel: z.number().min(1).max(10).optional(),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
})

const getPrimaryIndustryResponseSchema = z
  .object({
    primary_industry_id: z.string().uuid().nullable(),
    industry: industrySchema.nullable(),
  })
  .openapi('GetPrimaryIndustryResponse')

const updatePrimaryIndustrySchema = z.object({
  industryId: z.string().uuid(),
})

const successResponseSchema = z.object({ success: z.boolean() }).openapi('SuccessResponse')

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/skills/soft
 * Get soft skills for user
 */
const getSoftSkillsRoute = createRoute({
  method: 'get',
  path: '/soft',
  tags: ['Skills'],
  summary: 'Get soft skills',
  description: 'Get soft skills with ratings and category averages for the authenticated user',
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
      version: z.coerce.number().int().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Soft skills data',
      content: {
        'application/json': {
          schema: getSoftSkillsResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getSoftSkillsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { userId, version } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const targetUserId = userId || user.id

  // Get soft skills catalog
  const { data: catalog, error: catalogError } = await supabase
    .schema('core')
    .from('soft_skills_catalog')
    .select('*')
    .eq('is_active', true)
    .order('order_index')

  if (catalogError) {
    console.error('Error fetching soft skills catalog:', catalogError)
    return c.json({ error: 'Failed to fetch soft skills', message: catalogError.message }, 500)
  }

  // Get user's ratings
  let query = supabase
    .schema('core')
    .from('soft_skills_ratings')
    .select('*')
    .eq('user_id', targetUserId)

  if (version) {
    query = query.eq('version', version)
  } else {
    // Get latest version
    const { data: latestVersion } = await supabase
      .schema('core')
      .from('soft_skills_ratings')
      .select('version')
      .eq('user_id', targetUserId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestVersion) {
      query = query.eq('version', latestVersion.version)
    }
  }

  const { data: ratings } = await query

  // Calculate category averages
  const categoryAverages: Record<string, number> = {
    reliability: 0,
    collaboration: 0,
    professionalism: 0,
    technical: 0,
  }

  const categoryCounts: Record<string, number> = {
    reliability: 0,
    collaboration: 0,
    professionalism: 0,
    technical: 0,
  }

  // Merge catalog with ratings
  const skills = catalog.map((skill: any) => {
    const rating = ratings?.find((r: any) => r.skill_id === skill.id)
    if (rating) {
      categoryAverages[skill.category] += rating.rating
      categoryCounts[skill.category] += 1
    }
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      orderIndex: skill.order_index,
      rating: rating?.rating || null,
      selfAssessedAt: rating?.self_assessed_at || null,
    }
  })

  // Finalize averages
  for (const category of Object.keys(categoryAverages)) {
    if (categoryCounts[category] > 0) {
      categoryAverages[category] = categoryAverages[category] / categoryCounts[category]
    }
  }

  const lastUpdated = ratings && ratings.length > 0 ? ratings[0].self_assessed_at : null
  const versionNum = ratings && ratings.length > 0 ? ratings[0].version : null

  return c.json({
    version: versionNum,
    lastUpdated,
    categoryAverages,
    skills,
  })
})

/**
 * PATCH /v1/profiles/skills/soft
 * Update soft skills ratings
 */
const updateSoftSkillsRoute = createRoute({
  method: 'patch',
  path: '/soft',
  tags: ['Skills'],
  summary: 'Update soft skills',
  description: 'Update soft skills self-assessment ratings',
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateSoftSkillsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Soft skills updated',
      content: {
        'application/json': {
          schema: updateSoftSkillsResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(updateSoftSkillsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { skills } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get next version number
  const { data: latestVersion } = await supabase
    .schema('core')
    .from('soft_skills_ratings')
    .select('version')
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newVersion = latestVersion ? latestVersion.version + 1 : 1
  const selfAssessedAt = new Date().toISOString()

  // Insert new ratings
  const ratingsToInsert = skills.map((skill) => ({
    user_id: user.id,
    skill_id: skill.skill_id,
    rating: skill.rating,
    version: newVersion,
    self_assessed_at: selfAssessedAt,
  }))

  const { error } = await supabase.schema('core').from('soft_skills_ratings').insert(ratingsToInsert)

  if (error) {
    console.error('Error updating soft skills:', error)
    return c.json({ error: 'Failed to update soft skills', message: error.message }, 500)
  }

  // Calculate category averages
  const { data: catalog } = await supabase
    .schema('core')
    .from('soft_skills_catalog')
    .select('id, category')
    .in(
      'id',
      skills.map((s) => s.skill_id)
    )

  const categoryAverages: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}

  skills.forEach((skill) => {
    const catalogEntry = catalog?.find((c: any) => c.id === skill.skill_id)
    if (catalogEntry) {
      const category = catalogEntry.category
      categoryAverages[category] = (categoryAverages[category] || 0) + skill.rating
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
  })

  for (const category of Object.keys(categoryAverages)) {
    categoryAverages[category] = categoryAverages[category] / categoryCounts[category]
  }

  return c.json({
    version: newVersion,
    selfAssessedAt,
    createdNewVersion: true,
    categoryAverages,
  })
})

/**
 * GET /v1/profiles/skills/industries
 * Get available industries
 */
const getIndustriesRoute = createRoute({
  method: 'get',
  path: '/industries',
  tags: ['Skills'],
  summary: 'Get industries',
  description: 'Get list of available industries for skills taxonomy',
  responses: {
    200: {
      description: 'List of industries',
      content: {
        'application/json': {
          schema: getIndustriesResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getIndustriesRoute, async (c) => {
  const supabase = c.get('supabase')

  const { data: industries, error } = await supabase.schema('core').from('industries').select('id, name, slug').order('name')

  if (error) {
    console.error('Error fetching industries:', error)
    return c.json({ error: 'Failed to fetch industries', message: error.message }, 500)
  }

  return c.json({ industries: industries || [] })
})

/**
 * GET /v1/profiles/skills
 * Get user's hard skills
 */
const getUserSkillsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Skills'],
  summary: 'Get user skills',
  description: 'Get user hard skills (explicit and implied)',
  responses: {
    200: {
      description: 'User skills',
      content: {
        'application/json': {
          schema: getUserSkillsResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getUserSkillsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: skills, error } = await supabase.schema('core').from('user_skills').select('*').eq('user_id', user.id)

  if (error) {
    console.error('Error fetching user skills:', error)
    return c.json({ error: 'Failed to fetch user skills', message: error.message }, 500)
  }

  const explicitSkills = skills?.filter((s: any) => s.is_explicit) || []
  const impliedSkills = skills?.filter((s: any) => !s.is_explicit) || []

  return c.json({
    explicitSkills,
    impliedSkills,
    allSkills: skills || [],
  })
})

/**
 * POST /v1/profiles/skills
 * Add user skill
 */
const addUserSkillRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Skills'],
  summary: 'Add user skill',
  description: 'Add a new skill to user profile',
  request: {
    body: {
      content: {
        'application/json': {
          schema: addUserSkillSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Skill added',
      content: {
        'application/json': {
          schema: successResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(addUserSkillRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { skillId, proficiency } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { error } = await supabase
    .schema('core')
    .from('user_skills')
    .insert({
      user_id: user.id,
      skill_id: skillId,
      proficiency,
      is_explicit: true,
    })

  if (error) {
    console.error('Error adding skill:', error)
    return c.json({ error: 'Failed to add skill', message: error.message }, 500)
  }

  return c.json({ success: true }, 201)
})

/**
 * DELETE /v1/profiles/skills/:skillId
 * Remove user skill
 */
const removeUserSkillRoute = createRoute({
  method: 'delete',
  path: '/{skillId}',
  tags: ['Skills'],
  summary: 'Remove user skill',
  description: 'Remove a skill from user profile',
  request: {
    params: z.object({
      skillId: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: 'Skill removed',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(removeUserSkillRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { skillId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { error } = await supabase
    .schema('core')
    .from('user_skills')
    .delete()
    .eq('user_id', user.id)
    .eq('skill_id', skillId)

  if (error) {
    console.error('Error removing skill:', error)
    return c.json({ error: 'Failed to remove skill', message: error.message }, 500)
  }

  return c.body(null, 204)
})

/**
 * GET /v1/profiles/skills/multi-taxonomy
 * Get user skills (multi-taxonomy)
 */
const getUserSkillsMTRoute = createRoute({
  method: 'get',
  path: '/multi-taxonomy',
  tags: ['Skills'],
  summary: 'Get multi-taxonomy skills',
  description: 'Get user skills with CSI and O*NET taxonomies',
  responses: {
    200: {
      description: 'Multi-taxonomy skills',
      content: {
        'application/json': {
          schema: getUserSkillsMTResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getUserSkillsMTRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: skills, error } = await supabase
    .schema('core')
    .from('user_skills_multi_taxonomy')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching multi-taxonomy skills:', error)
    return c.json({ error: 'Failed to fetch skills', message: error.message }, 500)
  }

  return c.json({ skills: skills || [] })
})

/**
 * POST /v1/profiles/skills/multi-taxonomy
 * Add multi-taxonomy skill
 */
const addSkillMTRoute = createRoute({
  method: 'post',
  path: '/multi-taxonomy',
  tags: ['Skills'],
  summary: 'Add multi-taxonomy skill',
  description: 'Add a skill using CSI or O*NET taxonomy',
  request: {
    body: {
      content: {
        'application/json': {
          schema: addSkillMTSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Skill added',
      content: {
        'application/json': {
          schema: successResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(addSkillMTRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { taxonomy, skillId, proficiencyLevel, yearsExperience, notes } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const insertData: any = {
    user_id: user.id,
    skill_taxonomy: taxonomy,
    proficiency_level: proficiencyLevel,
    years_experience: yearsExperience,
    notes,
  }

  if (taxonomy === 'csi') {
    insertData.csi_skill_id = skillId
  } else {
    insertData.onet_occupation_id = skillId
  }

  const { error } = await supabase.schema('core').from('user_skills_multi_taxonomy').insert(insertData)

  if (error) {
    console.error('Error adding multi-taxonomy skill:', error)
    return c.json({ error: 'Failed to add skill', message: error.message }, 500)
  }

  return c.json({ success: true }, 201)
})

/**
 * DELETE /v1/profiles/skills/multi-taxonomy/:userSkillId
 * Remove multi-taxonomy skill
 */
const removeSkillMTRoute = createRoute({
  method: 'delete',
  path: '/multi-taxonomy/{userSkillId}',
  tags: ['Skills'],
  summary: 'Remove multi-taxonomy skill',
  description: 'Remove a skill from user profile',
  request: {
    params: z.object({
      userSkillId: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: 'Skill removed',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(removeSkillMTRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { userSkillId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { error } = await supabase
    .schema('core')
    .from('user_skills_multi_taxonomy')
    .delete()
    .eq('id', userSkillId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error removing skill:', error)
    return c.json({ error: 'Failed to remove skill', message: error.message }, 500)
  }

  return c.body(null, 204)
})

/**
 * GET /v1/profiles/skills/primary-industry
 * Get user's primary industry
 */
const getPrimaryIndustryRoute = createRoute({
  method: 'get',
  path: '/primary-industry',
  tags: ['Skills'],
  summary: 'Get primary industry',
  description: "Get user's primary industry for skills context",
  responses: {
    200: {
      description: 'Primary industry',
      content: {
        'application/json': {
          schema: getPrimaryIndustryResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getPrimaryIndustryRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: profile } = await supabase
    .schema('core')
    .from('user_profiles')
    .select('industry_id, industries:industry_id(id, name, slug)')
    .eq('id', user.id)
    .single()

  return c.json({
    primary_industry_id: profile?.industry_id || null,
    industry: profile?.industries || null,
  })
})

/**
 * PATCH /v1/profiles/skills/primary-industry
 * Update user's primary industry
 */
const updatePrimaryIndustryRoute = createRoute({
  method: 'patch',
  path: '/primary-industry',
  tags: ['Skills'],
  summary: 'Update primary industry',
  description: "Update user's primary industry",
  request: {
    body: {
      content: {
        'application/json': {
          schema: updatePrimaryIndustrySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Primary industry updated',
      content: {
        'application/json': {
          schema: successResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(updatePrimaryIndustryRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { industryId } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { error } = await supabase
    .schema('core')
    .from('user_profiles')
    .update({ industry_id: industryId, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating primary industry:', error)
    return c.json({ error: 'Failed to update primary industry', message: error.message }, 500)
  }

  return c.json({ success: true })
})

export default app
