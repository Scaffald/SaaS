/**
 * Skills REST API
 * Manages user skills (soft skills, hard skills, multi-taxonomy)
 * Supports CSI and O*NET skill taxonomies
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

// Soft Skills Schemas
const softSkillCategorySchema = z.enum([
  "reliability",
  "collaboration",
  "professionalism",
  "technical",
]);

const softSkillViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: softSkillCategorySchema,
  description: z.string().nullable(),
  orderIndex: z.number(),
  rating: z.number().nullable(),
  selfAssessedAt: z.string().nullable(),
});

const categoryAveragesSchema = z.record(softSkillCategorySchema, z.number());

const getSoftSkillsResponseSchema = z
  .object({
    version: z.number().nullable(),
    lastUpdated: z.string().nullable(),
    categoryAverages: categoryAveragesSchema,
    skills: z.array(softSkillViewSchema),
  })
  .openapi("GetSoftSkillsResponse");

const updateSoftSkillsSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.string().uuid(),
      rating: z.number().min(1).max(5),
    }),
  ),
});

const updateSoftSkillsResponseSchema = z
  .object({
    version: z.number(),
    selfAssessedAt: z.string(),
    createdNewVersion: z.boolean(),
    categoryAverages: categoryAveragesSchema,
  })
  .openapi("UpdateSoftSkillsResponse");

// Hard Skills Schemas
const industrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

const getIndustriesResponseSchema = z
  .object({
    industries: z.array(industrySchema),
  })
  .openapi("GetIndustriesResponse");

const _searchParentSkillsSchema = z.object({
  query: z.string(),
  industryId: z.string().uuid().optional(),
  limit: z.number().int().positive().optional(),
});

const parentSkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
});

const _searchParentSkillsResponseSchema = z
  .object({
    skills: z.array(parentSkillSchema),
  })
  .openapi("SearchParentSkillsResponse");

const userSkillSchema = z.object({
  id: z.string().uuid().optional(),
  skill_id: z.string().uuid(),
  skill_name: z.string(),
  proficiency: z.number().min(1).max(10),
  years_experience: z.number().optional(),
  is_explicit: z.boolean().optional(),
  verified: z.boolean().optional(),
});

const getUserSkillsResponseSchema = z
  .object({
    explicitSkills: z.array(userSkillSchema),
    impliedSkills: z.array(userSkillSchema),
    allSkills: z.array(userSkillSchema),
  })
  .openapi("GetUserSkillsResponse");

const addUserSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().min(1).max(10),
});

const _updateUserSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().min(1).max(10).optional(),
});

// Multi-Taxonomy Schemas
const skillTaxonomySchema = z.enum(["csi", "onet"]);

const skillDetailsMTSchema = z.object({
  code: z.string(),
  display_code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  hierarchy_level: z.number().nullable(),
});

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
});

const getUserSkillsMTResponseSchema = z
  .object({
    skills: z.array(userSkillMTSchema),
  })
  .openapi("GetUserSkillsMTResponse");

const addSkillMTSchema = z.object({
  taxonomy: skillTaxonomySchema,
  skillId: z.string(),
  proficiencyLevel: z.number().min(1).max(10),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
});

const _updateSkillMTSchema = z.object({
  userSkillId: z.string().uuid(),
  proficiencyLevel: z.number().min(1).max(10).optional(),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
});

const getPrimaryIndustryResponseSchema = z
  .object({
    primary_industry_id: z.string().uuid().nullable(),
    industry: industrySchema.nullable(),
  })
  .openapi("GetPrimaryIndustryResponse");

const updatePrimaryIndustrySchema = z.object({
  industryId: z.string().uuid(),
});

const successResponseSchema = z.object({ success: z.boolean() }).openapi(
  "SuccessResponse",
);

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/skills/soft
 * Get soft skills for user
 */
const getSoftSkillsRoute = createRoute({
  method: "get",
  path: "/soft",
  tags: ["Skills"],
  summary: "Get soft skills",
  description:
    "Get soft skills with ratings and category averages for the authenticated user",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
      version: z.coerce.number().int().optional(),
    }),
  },
  responses: {
    200: {
      description: "Soft skills data",
      content: {
        "application/json": {
          schema: getSoftSkillsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getSoftSkillsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId, version } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const targetUserId = userId || user.id;

  // Get soft skills catalog from core.soft_skills (table is soft_skills, not soft_skills_catalog)
  const { data: catalog, error: catalogError } = await supabase
    .schema("core")
    .from("soft_skills")
    .select("*")
    .eq("is_active", true)
    .order("order_index");

  if (catalogError) {
    console.error("Error fetching soft skills catalog:", catalogError);
    return c.json({
      error: "Failed to fetch soft skills",
      message: catalogError.message,
    }, 500);
  }

  // Get user's ratings
  let query = supabase
    .schema("core")
    .from("soft_skills_ratings")
    .select("*")
    .eq("user_id", targetUserId);

  if (version) {
    query = query.eq("version", version);
  } else {
    // Get latest version
    const { data: latestVersion } = await supabase
      .schema("core")
      .from("soft_skills_ratings")
      .select("version")
      .eq("user_id", targetUserId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion) {
      query = query.eq("version", latestVersion.version);
    }
  }

  const { data: ratings } = await query;

  // Calculate category averages
  const categoryAverages: Record<string, number> = {
    reliability: 0,
    collaboration: 0,
    professionalism: 0,
    technical: 0,
  };

  const categoryCounts: Record<string, number> = {
    reliability: 0,
    collaboration: 0,
    professionalism: 0,
    technical: 0,
  };

  // Merge catalog with ratings (catalog from core.soft_skills)
  type CatalogSkill = {
    id: string;
    name: string;
    category: string;
    description?: string;
    order_index?: number;
  };
  type RatingRow = {
    skill_id: string;
    rating: number;
    self_assessed_at?: string;
  };
  const skills = (catalog || []).map((skill: CatalogSkill) => {
    const rating = ratings?.find((r: RatingRow) => r.skill_id === skill.id);
    if (rating) {
      categoryAverages[skill.category] += rating.rating;
      categoryCounts[skill.category] += 1;
    }
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      orderIndex: skill.order_index,
      rating: rating?.rating || null,
      selfAssessedAt: rating?.self_assessed_at || null,
    };
  });

  // Finalize averages
  for (const category of Object.keys(categoryAverages)) {
    if (categoryCounts[category] > 0) {
      categoryAverages[category] = categoryAverages[category] /
        categoryCounts[category];
    }
  }

  const lastUpdated = ratings && ratings.length > 0
    ? ratings[0].self_assessed_at
    : null;
  const versionNum = ratings && ratings.length > 0 ? ratings[0].version : null;

  return c.json({
    version: versionNum,
    lastUpdated,
    categoryAverages,
    skills,
  });
});

/**
 * PATCH /v1/profiles/skills/soft
 * Update soft skills ratings
 */
const updateSoftSkillsRoute = createRoute({
  method: "patch",
  path: "/soft",
  tags: ["Skills"],
  summary: "Update soft skills",
  description: "Update soft skills self-assessment ratings",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateSoftSkillsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Soft skills updated",
      content: {
        "application/json": {
          schema: updateSoftSkillsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(updateSoftSkillsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { skills } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get next version number
  const { data: latestVersion } = await supabase
    .schema("core")
    .from("soft_skills_ratings")
    .select("version")
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newVersion = latestVersion ? latestVersion.version + 1 : 1;
  const selfAssessedAt = new Date().toISOString();

  // Insert new ratings
  const ratingsToInsert = skills.map((skill) => ({
    user_id: user.id,
    skill_id: skill.skill_id,
    rating: skill.rating,
    version: newVersion,
    self_assessed_at: selfAssessedAt,
  }));

  const { error } = await supabase.schema("core").from("soft_skills_ratings")
    .insert(ratingsToInsert);

  if (error) {
    console.error("Error updating soft skills:", error);
    return c.json({
      error: "Failed to update soft skills",
      message: error.message,
    }, 500);
  }

  // Calculate category averages from core.soft_skills
  const { data: catalog } = await supabase
    .schema("core")
    .from("soft_skills")
    .select("id, category")
    .in(
      "id",
      skills.map((s) => s.skill_id),
    );

  const categoryAverages: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  skills.forEach((skill) => {
    const catalogEntry = catalog?.find((c: { id: string }) =>
      c.id === skill.skill_id
    );
    if (catalogEntry) {
      const category = catalogEntry.category;
      categoryAverages[category] = (categoryAverages[category] || 0) +
        skill.rating;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  for (const category of Object.keys(categoryAverages)) {
    categoryAverages[category] = categoryAverages[category] /
      categoryCounts[category];
  }

  return c.json({
    version: newVersion,
    selfAssessedAt,
    createdNewVersion: true,
    categoryAverages,
  });
});

// Soft skills history response: versions with categoryAverages
const softSkillsHistoryVersionSchema = z.object({
  version: z.number(),
  selfAssessedAt: z.string().nullable(),
  categoryAverages: categoryAveragesSchema,
});
const getSoftSkillsHistoryResponseSchema = z
  .object({
    versions: z.array(softSkillsHistoryVersionSchema),
  })
  .openapi("GetSoftSkillsHistoryResponse");

const getSoftSkillsHistoryRoute = createRoute({
  method: "get",
  path: "/soft/history",
  tags: ["Skills"],
  summary: "Get soft skills history",
  description:
    "Get history of soft skills self-assessment versions for the authenticated user.",
  responses: {
    200: {
      description: "Soft skills history",
      content: {
        "application/json": { schema: getSoftSkillsHistoryResponseSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getSoftSkillsHistoryRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: catalog } = await supabase
    .schema("core")
    .from("soft_skills")
    .select("id, category")
    .eq("is_active", true);
  const categoryBySkillId = new Map(
    (catalog || []).map((
      s: { id: string; category: string },
    ) => [s.id, s.category]),
  );

  const { data: rows, error } = await supabase
    .schema("core")
    .from("soft_skills_ratings")
    .select("version, skill_id, rating, self_assessed_at")
    .eq("user_id", user.id)
    .order("version", { ascending: false });

  if (error) {
    return c.json(
      { error: "Failed to fetch history", message: error.message },
      500,
    );
  }

  const byVersion = new Map<
    number,
    {
      version: number;
      selfAssessedAt: string | null;
      sums: Record<string, number>;
      counts: Record<string, number>;
    }
  >();
  for (const row of rows || []) {
    const category = categoryBySkillId.get(row.skill_id);
    if (!category) continue;
    if (!byVersion.has(row.version)) {
      byVersion.set(row.version, {
        version: row.version,
        selfAssessedAt: row.self_assessed_at ?? null,
        sums: {
          reliability: 0,
          collaboration: 0,
          professionalism: 0,
          technical: 0,
        },
        counts: {
          reliability: 0,
          collaboration: 0,
          professionalism: 0,
          technical: 0,
        },
      });
    }
    const b = byVersion.get(row.version);
    if (b) {
      b.sums[category] = (b.sums[category] || 0) + row.rating;
      b.counts[category] = (b.counts[category] || 0) + 1;
    }
  }

  const versions = Array.from(byVersion.values()).map((b) => ({
    version: b.version,
    selfAssessedAt: b.selfAssessedAt,
    categoryAverages: {
      reliability: b.counts.reliability
        ? b.sums.reliability / b.counts.reliability
        : 0,
      collaboration: b.counts.collaboration
        ? b.sums.collaboration / b.counts.collaboration
        : 0,
      professionalism: b.counts.professionalism
        ? b.sums.professionalism / b.counts.professionalism
        : 0,
      technical: b.counts.technical ? b.sums.technical / b.counts.technical : 0,
    },
  }));

  return c.json({ versions });
});

// Soft skills comparison: self vs peer averages
const getSoftSkillsComparisonResponseSchema = z
  .object({
    version: z.number().nullable(),
    self: categoryAveragesSchema.nullable(),
    peer: categoryAveragesSchema.nullable(),
    peerSampleSize: z.number().int(),
    alignmentScore: z.number().nullable(),
  })
  .openapi("GetSoftSkillsComparisonResponse");

const getSoftSkillsComparisonRoute = createRoute({
  method: "get",
  path: "/soft/comparison",
  tags: ["Skills"],
  summary: "Get soft skills comparison",
  description:
    "Compare current user soft skills category averages to peer (e.g. aggregate) averages.",
  responses: {
    200: {
      description: "Soft skills comparison",
      content: {
        "application/json": { schema: getSoftSkillsComparisonResponseSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getSoftSkillsComparisonRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // Get current user's latest soft skills (reuse same logic as GET /soft)
  const { data: latestVersion } = await supabase
    .schema("core")
    .from("soft_skills_ratings")
    .select("version")
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  let self: Record<string, number> | null = null;
  let version: number | null = null;
  if (latestVersion) {
    const { data: ratings } = await supabase
      .schema("core")
      .from("soft_skills_ratings")
      .select("skill_id, rating")
      .eq("user_id", user.id)
      .eq("version", latestVersion.version);
    const { data: catalog } = await supabase.schema("core").from("soft_skills")
      .select("id, category").eq("is_active", true);
    const categoryBySkillId = new Map(
      (catalog || []).map((
        s: { id: string; category: string },
      ) => [s.id, s.category]),
    );
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const r of ratings || []) {
      const cat = categoryBySkillId.get(r.skill_id);
      if (!cat) continue;
      sums[cat] = (sums[cat] || 0) + r.rating;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    self = {
      reliability: counts.reliability
        ? sums.reliability / counts.reliability
        : 0,
      collaboration: counts.collaboration
        ? sums.collaboration / counts.collaboration
        : 0,
      professionalism: counts.professionalism
        ? sums.professionalism / counts.professionalism
        : 0,
      technical: counts.technical ? sums.technical / counts.technical : 0,
    };
    version = latestVersion.version;
  }

  // Peer aggregate: optional - count of rating rows as peerSampleSize for now
  const { count: peerCount } = await supabase
    .schema("core")
    .from("soft_skills_ratings")
    .select("*", { count: "exact", head: true });
  const peerSampleSize = peerCount ?? 0;
  return c.json({
    version,
    self,
    peer: null,
    peerSampleSize,
    alignmentScore: null,
  });
});

/**
 * GET /v1/profiles/skills/industries
 * Get available industries
 */
const getIndustriesRoute = createRoute({
  method: "get",
  path: "/industries",
  tags: ["Skills"],
  summary: "Get industries",
  description: "Get list of available industries for skills taxonomy",
  responses: {
    200: {
      description: "List of industries",
      content: {
        "application/json": {
          schema: getIndustriesResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getIndustriesRoute, async (c) => {
  const supabase = c.get("supabase");

  const { data: industries, error } = await supabase.schema("core").from(
    "industries",
  ).select("id, name, slug").order("name");

  if (error) {
    console.error("Error fetching industries:", error);
    return c.json({
      error: "Failed to fetch industries",
      message: error.message,
    }, 500);
  }

  return c.json({ industries: industries || [] });
});

/**
 * GET /v1/profiles/skills
 * Get user's hard skills
 */
const getUserSkillsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Skills"],
  summary: "Get user skills",
  description: "Get user hard skills (explicit and implied)",
  responses: {
    200: {
      description: "User skills",
      content: {
        "application/json": {
          schema: getUserSkillsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getUserSkillsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: skills, error } = await supabase.schema("core").from(
    "user_skills",
  ).select("*").eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user skills:", error);
    return c.json({
      error: "Failed to fetch user skills",
      message: error.message,
    }, 500);
  }

  const explicitSkills = skills?.filter((s: { is_explicit?: boolean }) =>
    s.is_explicit
  ) || [];
  const impliedSkills =
    skills?.filter((s: { is_explicit?: boolean }) => !s.is_explicit) || [];

  return c.json({
    explicitSkills,
    impliedSkills,
    allSkills: skills || [],
  });
});

/**
 * POST /v1/profiles/skills
 * Add user skill
 */
const addUserSkillRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Skills"],
  summary: "Add user skill",
  description: "Add a new skill to user profile",
  request: {
    body: {
      content: {
        "application/json": {
          schema: addUserSkillSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Skill added",
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(addUserSkillRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { skillId, proficiency } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("user_skills")
    .insert({
      user_id: user.id,
      skill_id: skillId,
      proficiency,
      is_explicit: true,
    });

  if (error) {
    console.error("Error adding skill:", error);
    return c.json(
      { error: "Failed to add skill", message: error.message },
      500,
    );
  }

  return c.json({ success: true }, 201);
});

/**
 * DELETE /v1/profiles/skills/:skillId
 * Remove user skill
 */
const removeUserSkillRoute = createRoute({
  method: "delete",
  path: "/{skillId}",
  tags: ["Skills"],
  summary: "Remove user skill",
  description: "Remove a skill from user profile",
  request: {
    params: z.object({
      skillId: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "Skill removed",
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(removeUserSkillRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { skillId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("user_skills")
    .delete()
    .eq("user_id", user.id)
    .eq("skill_id", skillId);

  if (error) {
    console.error("Error removing skill:", error);
    return c.json(
      { error: "Failed to remove skill", message: error.message },
      500,
    );
  }

  return c.body(null, 204);
});

/**
 * GET /v1/profiles/skills/multi-taxonomy
 * Get user skills (multi-taxonomy)
 */
const getUserSkillsMTRoute = createRoute({
  method: "get",
  path: "/multi-taxonomy",
  tags: ["Skills"],
  summary: "Get multi-taxonomy skills",
  description: "Get user skills with CSI and O*NET taxonomies",
  responses: {
    200: {
      description: "Multi-taxonomy skills",
      content: {
        "application/json": {
          schema: getUserSkillsMTResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getUserSkillsMTRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: rows, error } = await supabase
    .schema("core")
    .from("user_skills")
    .select("*")
    .eq("user_id", user.id)
    // CSI/O*NET rows only — exclude soft-skill and trade entries in user_skills.
    .in("skill_taxonomy", ["csi", "onet"]);

  if (error) {
    console.error("Error fetching multi-taxonomy skills:", error);
    return c.json(
      { error: "Failed to fetch skills", message: error.message },
      500,
    );
  }

  const userRows = (rows ?? []) as Array<{
    skill_taxonomy: string;
    csi_skill_id: string | null;
    onet_occupation_id: string | null;
    [key: string]: unknown;
  }>;

  // Enrich each row with skill_details (name/code) from its taxonomy source.
  // The profile UI filters out rows lacking skill_details.name, so raw
  // user_skills rows would otherwise vanish from "Your Skills".
  const csiIds = [
    ...new Set(
      userRows.filter((r) => r.csi_skill_id).map((r) => r.csi_skill_id),
    ),
  ] as string[];
  const onetIds = [
    ...new Set(
      userRows.filter((r) => r.onet_occupation_id).map((r) =>
        (r.onet_occupation_id as string).trim()
      ),
    ),
  ];

  const csiMap = new Map<
    string,
    {
      name: string;
      code_key: string;
      code_display: string;
      depth: number | null;
    }
  >();
  if (csiIds.length > 0) {
    const { data: csi } = await supabase
      .schema("data")
      .from("masterformat")
      .select("id, name, code_key, code_display, depth")
      .in("id", csiIds);
    for (const m of csi ?? []) csiMap.set(m.id, m);
  }

  const onetMap = new Map<string, { onetsoc_code: string; title: string }>();
  if (onetIds.length > 0) {
    const { data: onet } = await supabase
      .schema("onet")
      .from("occupation_data")
      .select("onetsoc_code, title")
      .in("onetsoc_code", onetIds);
    for (const o of onet ?? []) onetMap.set(o.onetsoc_code.trim(), o);
  }

  const skills = userRows.map((r) => {
    let skill_details: {
      code: string;
      display_code: string;
      name: string;
      hierarchy_level: number | null;
    } | null = null;

    if (r.skill_taxonomy === "csi" && r.csi_skill_id) {
      const m = csiMap.get(r.csi_skill_id);
      if (m) {
        skill_details = {
          code: m.code_key,
          display_code: m.code_display,
          name: m.name,
          hierarchy_level: m.depth ?? null,
        };
      }
    } else if (r.skill_taxonomy === "onet" && r.onet_occupation_id) {
      const code = (r.onet_occupation_id as string).trim();
      const o = onetMap.get(code);
      if (o) {
        skill_details = {
          code,
          display_code: code,
          name: o.title,
          hierarchy_level: null,
        };
      }
    }

    return { ...r, skill_details };
  });

  return c.json({ skills });
});

/**
 * POST /v1/profiles/skills/multi-taxonomy
 * Add multi-taxonomy skill
 */
const addSkillMTRoute = createRoute({
  method: "post",
  path: "/multi-taxonomy",
  tags: ["Skills"],
  summary: "Add multi-taxonomy skill",
  description: "Add a skill using CSI or O*NET taxonomy",
  request: {
    body: {
      content: {
        "application/json": {
          schema: addSkillMTSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Skill added",
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(addSkillMTRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { taxonomy, skillId, proficiencyLevel, yearsExperience, notes } = c.req
    .valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    skill_taxonomy: taxonomy,
    proficiency_level: proficiencyLevel,
    years_experience: yearsExperience,
    notes,
  };

  if (taxonomy === "csi") {
    insertData.csi_skill_id = skillId;
  } else {
    insertData.onet_occupation_id = skillId;
  }

  const { error } = await supabase.schema("core").from(
    "user_skills",
  ).insert(insertData);

  if (error) {
    console.error("Error adding multi-taxonomy skill:", error);
    return c.json(
      { error: "Failed to add skill", message: error.message },
      500,
    );
  }

  return c.json({ success: true }, 201);
});

/**
 * DELETE /v1/profiles/skills/multi-taxonomy/:userSkillId
 * Remove multi-taxonomy skill
 */
const removeSkillMTRoute = createRoute({
  method: "delete",
  path: "/multi-taxonomy/{userSkillId}",
  tags: ["Skills"],
  summary: "Remove multi-taxonomy skill",
  description: "Remove a skill from user profile",
  request: {
    params: z.object({
      userSkillId: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "Skill removed",
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(removeSkillMTRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userSkillId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("user_skills")
    .delete()
    .eq("id", userSkillId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing skill:", error);
    return c.json(
      { error: "Failed to remove skill", message: error.message },
      500,
    );
  }

  return c.body(null, 204);
});

/**
 * POST /v1/profiles/skills/search-parents
 * Cascading skill search across CSI MasterFormat (data.masterformat) and
 * core.skills via the search_parent_skills RPC. Ported from the legacy tRPC
 * router so the REST SDK's skills.searchParentSkills() resolves instead of 404ing.
 */
const searchParentSkillsBodySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  // Optional: universal search (#381) has no industry context. The
  // search_parent_skills RPC ignores a NULL industry, searching all skills.
  industryId: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).optional(),
  // Which taxonomies to search. Defaults to ["csi"] when omitted.
  // "csi" → CSI MasterFormat + core skills (search_parent_skills RPC).
  // "onet" → O*NET occupations (onet.occupation_data) returned as skill items.
  taxonomies: z.array(z.enum(["csi", "onet"])).optional(),
});

const searchParentSkillItemSchema = z
  .object({
    skill_id: z.string(),
    skill_name: z.string(),
    csi_display: z.string().nullable(),
    csi_code: z.array(z.string()).nullable(),
    active: z.boolean(),
    child_count: z.number(),
    parent_id: z.string().nullable(),
    parent_name: z.string().nullable(),
    depth: z.number(),
    hierarchy_path: z.string().nullable(),
  })
  .openapi("SearchParentSkillItem");

const searchParentSkillsResponseSchema = z
  .object({ skills: z.array(searchParentSkillItemSchema) })
  .openapi("SearchParentSkillsResponse");

const searchParentSkillsRoute = createRoute({
  method: "post",
  path: "/search-parents",
  tags: ["Skills"],
  summary: "Search parent skills",
  description:
    "Cascading skill search across CSI MasterFormat and core skills via the search_parent_skills RPC.",
  request: {
    body: {
      content: {
        "application/json": { schema: searchParentSkillsBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Matching parent skills",
      content: {
        "application/json": { schema: searchParentSkillsResponseSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(searchParentSkillsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { query, industryId, limit, taxonomies } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const lim = limit ?? 20;
  const active = taxonomies && taxonomies.length > 0 ? taxonomies : ["csi"];
  const wantCsi = active.includes("csi");
  const wantOnet = active.includes("onet");

  let csiResults: unknown[] = [];
  let onetResults: unknown[] = [];

  if (wantCsi) {
    const { data, error } = await supabase.rpc("search_parent_skills", {
      p_query: query,
      p_industry_id: industryId ?? null,
      p_limit: lim,
    });
    if (error) {
      console.error("Error searching parent skills (csi):", error);
      return c.json(
        { error: "Failed to search parent skills", message: error.message },
        500,
      );
    }
    csiResults = data ?? [];
  }

  if (wantOnet) {
    // O*NET occupations as skill items. The id/code is the O*NET-SOC code
    // (contains a dash, e.g. "47-2152.00"), which the client uses to infer the
    // "onet" taxonomy on select and to set onet_occupation_id when adding.
    const { data, error } = await supabase
      .schema("onet")
      .from("occupation_data")
      .select("onetsoc_code, title")
      .ilike("title", `%${query}%`)
      .limit(lim);
    if (error) {
      console.error("Error searching parent skills (onet):", error);
      return c.json(
        { error: "Failed to search O*NET occupations", message: error.message },
        500,
      );
    }
    onetResults = (data ?? []).map(
      (o: { onetsoc_code: string; title: string }) => ({
        skill_id: o.onetsoc_code,
        skill_name: o.title,
        csi_display: null,
        csi_code: null,
        active: true,
        child_count: 0,
        parent_id: null,
        parent_name: null,
        depth: 0,
        hierarchy_path: o.title,
      }),
    );
  }

  // Interleave when both taxonomies are requested so neither dominates the list.
  let skills: unknown[];
  if (wantCsi && wantOnet) {
    skills = [];
    const max = Math.max(csiResults.length, onetResults.length);
    for (let i = 0; i < max; i++) {
      if (i < csiResults.length) skills.push(csiResults[i]);
      if (i < onetResults.length) skills.push(onetResults[i]);
    }
  } else {
    skills = wantOnet ? onetResults : csiResults;
  }

  return c.json({ skills: skills.slice(0, lim) });
});

/**
 * GET /v1/profiles/skills/primary-industry
 * Get user's primary industry
 */
const getPrimaryIndustryRoute = createRoute({
  method: "get",
  path: "/primary-industry",
  tags: ["Skills"],
  summary: "Get primary industry",
  description: "Get user's primary industry for skills context",
  responses: {
    200: {
      description: "Primary industry",
      content: {
        "application/json": {
          schema: getPrimaryIndustryResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getPrimaryIndustryRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile } = await supabase
    .schema("core")
    .from("users")
    .select("industry_id, industries:industry_id(id, name, slug)")
    .eq("id", user.id)
    .single();

  return c.json({
    primary_industry_id: profile?.industry_id || null,
    industry: profile?.industries || null,
  });
});

/**
 * PATCH /v1/profiles/skills/primary-industry
 * Update user's primary industry
 */
const updatePrimaryIndustryRoute = createRoute({
  method: "patch",
  path: "/primary-industry",
  tags: ["Skills"],
  summary: "Update primary industry",
  description: "Update user's primary industry",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updatePrimaryIndustrySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Primary industry updated",
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(updatePrimaryIndustryRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { industryId } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("users")
    .update({ industry_id: industryId, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating primary industry:", error);
    return c.json({
      error: "Failed to update primary industry",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
