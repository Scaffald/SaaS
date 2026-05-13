import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";
import {
  computeSoftSkillMatch,
  fetchSoftSkillMetadata,
  loadUserSoftSkillsForMatching,
  parseRequiredSoftSkills,
  type SoftSkillRequirement,
} from "../../_shared/soft-skills-matching.ts";

const app = new OpenAPIHono();

// Apply auth middleware to all routes
app.use("*", authMiddleware);

/**
 * Zod Schemas for Jobs API
 */

// Query parameters schema for listing jobs
const jobsQuerySchema = z.object({
  status: z
    .enum(["published", "draft", "archived", "open", "paused", "closed"])
    .optional()
    .default("published")
    .openapi({
      description: "Filter jobs by status",
      example: "published",
    }),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
    .openapi({
      description: "Number of jobs to return (max 100)",
      example: 20,
    }),
  offset: z.coerce.number().int().nonnegative().optional().default(0).openapi({
    description: "Offset for pagination",
    example: 0,
  }),
  organizationId: z.string().uuid().optional().openapi({
    description: "Filter by organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  location: z.string().optional().openapi({
    description: "Filter by location (partial match)",
    example: "San Francisco",
  }),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "temp", "intern"])
    .optional()
    .openapi({
      description: "Filter by employment type",
      example: "full_time",
    }),
  remoteOption: z.enum(["on_site", "hybrid", "remote"]).optional().openapi({
    description: "Filter by remote work option",
    example: "remote",
  }),
});

// Job response schema (simplified public fields)
const jobSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    status: z.enum(["draft", "open", "paused", "closed", "published"]),
    employment_type: z.enum([
      "full_time",
      "part_time",
      "contract",
      "temp",
      "intern",
    ]).nullable(),
    remote_option: z.enum(["on_site", "hybrid", "remote"]).nullable(),
    location: z.string().nullable(),
    pay_range_min_cents: z.number().int().nullable(),
    pay_range_max_cents: z.number().int().nullable(),
    pay_range_type: z.enum(["hourly", "salary", "contract", "project"])
      .nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    application_deadline: z.string().nullable(),
    number_of_openings: z.number().int().nullable(),
    is_featured: z.boolean().nullable(),
  })
  .openapi("Job");

// Pagination metadata schema
const paginationSchema = z
  .object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  })
  .openapi("Pagination");

// Jobs list response schema
const jobsListResponseSchema = z
  .object({
    data: z.array(jobSchema),
    pagination: paginationSchema,
  })
  .openapi("JobsListResponse");

// Single job response schema
const jobResponseSchema = z
  .object({
    data: jobSchema,
  })
  .openapi("JobResponse");

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Similar jobs query schema
const similarJobsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional().default(5)
    .openapi({
      description: "Number of similar jobs to return (max 20)",
      example: 5,
    }),
});

/**
 * GET /v1/jobs
 * List published jobs with filtering and pagination
 */
const getJobsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Jobs"],
  summary: "List published jobs",
  description:
    "Retrieve a paginated list of published jobs with optional filtering",
  request: {
    query: jobsQuerySchema,
  },
  responses: {
    200: {
      description: "List of jobs matching the query",
      content: {
        "application/json": {
          schema: jobsListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - missing or invalid authentication",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
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
});

app.openapi(getJobsRoute, async (c) => {
  const supabase = c.get("supabase");
  const query = c.req.valid("query");

  // Map 'published' to 'open' for backward compatibility (DB uses 'open' not 'published')
  const dbStatus = query.status === "published" ? "open" : query.status;

  // Build query
  let dbQuery = supabase
    .schema("core")
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("status", dbStatus)
    .range(query.offset, query.offset + query.limit - 1)
    .order("created_at", { ascending: false });

  // Apply filters
  if (query.organizationId) {
    dbQuery = dbQuery.eq("organization_id", query.organizationId);
  }
  if (query.location) {
    dbQuery = dbQuery.ilike("location", `%${query.location}%`);
  }
  if (query.employmentType) {
    dbQuery = dbQuery.eq("employment_type", query.employmentType);
  }
  if (query.remoteOption) {
    dbQuery = dbQuery.eq("remote_option", query.remoteOption);
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Error fetching jobs:", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json(
    {
      data: data || [],
      pagination: {
        total: count || 0,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < (count || 0),
      },
    },
    200,
  );
});

/**
 * GET /v1/jobs/slug/:slug
 * Get job by slug (public, for vanity URLs). Parity with tRPC jobs.bySlug.
 */
const getJobBySlugRoute = createRoute({
  method: "get",
  path: "/slug/{slug}",
  tags: ["Jobs"],
  summary: "Get job by slug",
  description:
    "Retrieve public job data by slug for vanity URLs. Only open jobs are returned.",
  request: {
    params: z.object({
      slug: z.string().min(3).max(50).openapi({
        description: "Job slug",
        example: "senior-engineer",
      }),
    }),
  },
  responses: {
    200: {
      description: "Job details",
      content: { "application/json": { schema: jobResponseSchema } },
    },
    404: {
      description: "Job not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getJobBySlugRoute, async (c) => {
  const supabase = c.get("supabase");
  const slug = c.req.param("slug").toLowerCase();

  const { data, error } = await supabase
    .schema("core")
    .from("jobs")
    .select(
      `
      id,
      title,
      slug,
      description,
      employment_type,
      location,
      pay_range_min_cents,
      pay_range_max_cents,
      pay_range_type,
      status,
      created_at,
      updated_at,
      organization:organizations(
        id,
        name,
        slug,
        logo_url
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "open")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json(
        { error: `Job with slug "${slug}" not found or not available` },
        404,
      );
    }
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data }, 200);
});

/**
 * GET /v1/jobs/external
 * List external jobs (parity with tRPC jobs.getExternalJobs).
 */
const getExternalJobsRoute = createRoute({
  method: "get",
  path: "/external",
  tags: ["Jobs"],
  summary: "List external jobs",
  description: "Returns active external jobs with industry information.",
  responses: {
    200: {
      description: "List of external jobs",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(z.record(z.unknown())),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getExternalJobsRoute, async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .schema("core")
    .from("external_jobs")
    .select(
      `
      id,
      title,
      company_name,
      company_logo,
      job_location,
      job_type,
      job_category,
      description,
      compensation_min,
      compensation_max,
      compensation_currency,
      posted_date,
      application_url,
      external_url,
      featured,
      external_job_industries(
        industry:industries(id, name),
        confidence_score
      )
    `,
    )
    .eq("is_active", true)
    .order("posted_date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching external jobs:", error);
    return c.json({ error: error.message }, 500);
  }

  const jobs = (data || []).map(
    (job: {
      id: string;
      title?: string | null;
      company_name?: string | null;
      company_logo?: string | null;
      job_location?: string | null;
      job_type?: string | null;
      job_category?: string | null;
      description?: string | null;
      compensation_min?: number | null;
      compensation_max?: number | null;
      compensation_currency?: string | null;
      posted_date?: string | null;
      application_url?: string | null;
      external_url?: string | null;
      featured?: boolean | null;
      external_job_industries?: Array<
        {
          industry?: { name?: string } | null;
          confidence_score?: number | null;
        }
      >;
    }) => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      job_location: job.job_location,
      job_type: job.job_type,
      job_category: job.job_category,
      description: job.description,
      compensation_min: job.compensation_min,
      compensation_max: job.compensation_max,
      compensation_currency: job.compensation_currency,
      posted_date: job.posted_date,
      application_url: job.application_url,
      external_url: job.external_url,
      featured: job.featured,
      industries: Array.isArray(job.external_job_industries)
        ? job.external_job_industries.map((eji) => ({
          industry_name: eji.industry?.name ?? "",
          confidence_score: eji.confidence_score ?? 0,
        }))
        : [],
    }),
  );

  return c.json({ data: jobs }, 200);
});

/**
 * GET /v1/jobs/external/filter-options
 * Get filter options for external jobs (parity with tRPC jobs.getFilterOptions).
 */
const getExternalFilterOptionsRoute = createRoute({
  method: "get",
  path: "/external/filter-options",
  tags: ["Jobs"],
  summary: "Get external job filter options",
  description:
    "Returns unique job types, locations, and industries from external jobs.",
  responses: {
    200: {
      description: "Filter options",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              jobTypes: z.array(z.string()),
              locations: z.array(z.string()),
              industries: z.array(z.string()),
            }),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getExternalFilterOptionsRoute, async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .schema("core")
    .from("external_jobs")
    .select(
      `
      job_type,
      job_location,
      external_job_industries(industry:industries(name))
    `,
    )
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching external filter options:", error);
    return c.json({ error: error.message }, 500);
  }

  const jobTypes = new Set<string>();
  const locations = new Set<string>();
  const industries = new Set<string>();

  for (const job of data || []) {
    if (job.job_type) jobTypes.add(job.job_type);
    if (job.job_location) locations.add(job.job_location);
    if (Array.isArray(job.external_job_industries)) {
      for (const eji of job.external_job_industries) {
        const industry = Array.isArray(eji.industry)
          ? eji.industry[0]
          : eji.industry;
        if (industry?.name) industries.add(industry.name);
      }
    }
  }

  return c.json(
    {
      data: {
        jobTypes: Array.from(jobTypes).sort(),
        locations: Array.from(locations).sort(),
        industries: Array.from(industries).sort(),
      },
    },
    200,
  );
});

/**
 * GET /v1/jobs/soft-skills-match
 * List open jobs with soft skills match scores (parity with tRPC jobs.getJobsWithSoftSkillsMatch).
 */
const getJobsWithSoftSkillsMatchRoute = createRoute({
  method: "get",
  path: "/soft-skills-match",
  tags: ["Jobs"],
  summary: "List jobs with soft skills match",
  description:
    "Returns open jobs with soft skills match scores for the current user. Requires user auth.",
  request: {
    query: z.object({
      minMatchScore: z.coerce.number().int().min(0).max(100).optional(),
      sortBy: z.enum(["match_score"]).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(25),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: { description: "Jobs with match scores" },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getJobsWithSoftSkillsMatchRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const query = c.req.valid("query");
  if (!user?.id) {
    return c.json({
      error: "Unauthorized",
      message: "User authentication required",
    }, 401);
  }
  try {
    const { ratings, hasAssessment } = await loadUserSoftSkillsForMatching(
      supabase,
      user.id,
    );
    if (!hasAssessment) {
      return c.json(
        { data: { total: 0, needsSelfAssessment: true, jobs: [] } },
        200,
      );
    }
    const { data, error } = await supabase
      .schema("core")
      .from("jobs")
      .select(
        "id, title, slug, created_at, organization:organizations!jobs_organization_id_fkey(id, name, slug), required_soft_skills",
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const jobsWithRequirements = (data || []).map((
      job: { required_soft_skills?: unknown; [k: string]: unknown },
    ) => ({
      job,
      requirements: parseRequiredSoftSkills(job.required_soft_skills),
    }));
    const skillIds = Array.from(
      new Set(
        jobsWithRequirements.flatMap((
          e: { requirements: { skill_id: string }[] },
        ) => e.requirements.map((r) => r.skill_id)),
      ),
    );
    const metadata = await fetchSoftSkillMetadata(supabase, skillIds);
    const enriched = jobsWithRequirements
      .filter((e: { requirements: unknown[] }) => e.requirements.length > 0)
      .map(
        (e: {
          job: {
            id: string;
            title?: string | null;
            slug?: string | null;
            organization?: unknown;
          };
          requirements: SoftSkillRequirement[];
        }) => {
          const match = computeSoftSkillMatch(
            e.requirements,
            ratings,
            metadata,
          );
          return {
            jobId: e.job.id,
            title: e.job.title,
            slug: e.job.slug ?? null,
            organization: e.job.organization,
            matchScore: match.score,
            totalRequirements: e.requirements.length,
            details: match.details,
          };
        },
      )
      .filter((e: { matchScore: number | null }) => e.matchScore !== null);
    const minScore = query.minMatchScore ?? null;
    const filtered = minScore !== null
      ? enriched.filter((e: { matchScore: number | null }) =>
        (e.matchScore ?? 0) >= minScore
      )
      : enriched;
    if (query.sortBy === "match_score") {
      filtered.sort(
        (a: { matchScore: number | null }, b: { matchScore: number | null }) =>
          (b.matchScore ?? 0) - (a.matchScore ?? 0),
      );
    }
    const total = filtered.length;
    const jobs = filtered.slice(query.offset, query.offset + query.limit);
    return c.json({ data: { total, needsSelfAssessment: false, jobs } }, 200);
  } catch (err) {
    console.error("getJobsWithSoftSkillsMatch error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
});

/**
 * GET /v1/jobs/:jobId/soft-skills-match
 * Get soft skills match for a single job (parity with tRPC jobs.calculateSoftSkillsMatch).
 */
const calculateSoftSkillsMatchRoute = createRoute({
  method: "get",
  path: "/{jobId}/soft-skills-match",
  tags: ["Jobs"],
  summary: "Calculate soft skills match for job",
  description: "Returns soft skills match details for the given job and user.",
  request: {
    params: z.object({
      jobId: z.string().uuid().openapi({ description: "Job ID" }),
    }),
    query: z.object({
      userId: z.string().uuid().optional().openapi({
        description: "User ID (default: current user)",
      }),
    }),
  },
  responses: {
    200: { description: "Match result" },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Job not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(calculateSoftSkillsMatchRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { jobId } = c.req.valid("param");
  const { userId } = c.req.valid("query");
  const targetUserId = userId ?? user?.id;
  if (!targetUserId) {
    return c.json({
      error: "Unauthorized",
      message: "User authentication required",
    }, 401);
  }
  try {
    const { ratings, hasAssessment } = await loadUserSoftSkillsForMatching(
      supabase,
      targetUserId,
    );
    const { data: job, error } = await supabase
      .schema("core")
      .from("jobs")
      .select(
        "id, title, slug, organization:organizations!jobs_organization_id_fkey(id, name, slug), required_soft_skills",
      )
      .eq("id", jobId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) return c.json({ error: "Job not found" }, 404);
    const requirements = parseRequiredSoftSkills(job.required_soft_skills);
    if (requirements.length === 0) {
      return c.json(
        {
          data: {
            jobId: job.id,
            jobTitle: job.title,
            organization: job.organization,
            score: null,
            needsSelfAssessment: !hasAssessment,
            totalRequirements: 0,
            details: [],
          },
        },
        200,
      );
    }
    const metadata = await fetchSoftSkillMetadata(
      supabase,
      requirements.map((r) => r.skill_id),
    );
    const match = computeSoftSkillMatch(requirements, ratings, metadata);
    return c.json(
      {
        data: {
          jobId: job.id,
          jobTitle: job.title,
          organization: job.organization,
          score: match.score,
          needsSelfAssessment: !hasAssessment,
          totalRequirements: requirements.length,
          details: match.details,
        },
      },
      200,
    );
  } catch (err) {
    console.error("calculateSoftSkillsMatch error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
});

/**
 * GET /v1/jobs/:jobId/applications/me
 * Get current user's application for a job (parity with tRPC jobs.getMyApplicationForJob).
 */
const getMyApplicationForJobRoute = createRoute({
  method: "get",
  path: "/{jobId}/applications/me",
  tags: ["Jobs"],
  summary: "Get my application for job",
  description:
    "Returns the current user's application for the given job, or 404 if none.",
  request: {
    params: z.object({
      jobId: z.string().uuid().openapi({
        description: "Job ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
  },
  responses: {
    200: {
      description: "Application found",
      content: {
        "application/json": {
          schema: z.object({
            data: z.record(z.unknown()),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized - user authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "No application found for this job",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getMyApplicationForJobRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { jobId } = c.req.valid("param");

  if (!user?.id) {
    return c.json(
      { error: "Unauthorized", message: "User authentication required" },
      401,
    );
  }

  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching application:", error);
    return c.json({ error: error.message }, 500);
  }

  if (!application) {
    return c.json(
      { error: "Not found", message: "No application found for this job" },
      404,
    );
  }

  return c.json({ data: application }, 200);
});

/**
 * GET /v1/jobs/:id
 * Get job details by ID
 */
const getJobByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Jobs"],
  summary: "Get job details",
  description: "Retrieve detailed information about a specific job by ID",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Job ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
  },
  responses: {
    200: {
      description: "Job details",
      content: {
        "application/json": {
          schema: jobResponseSchema,
        },
      },
    },
    404: {
      description: "Job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
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
});

app.openapi(getJobByIdRoute, async (c) => {
  const supabase = c.get("supabase");
  const { id } = c.req.valid("param");

  const { data, error } = await supabase
    .schema("core")
    .from("jobs")
    .select(
      "*, organization:organizations!jobs_organization_id_fkey(id, name, slug, logo_url)",
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json({ error: "Job not found" }, 404);
    }
    console.error("Error fetching job:", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data }, 200);
});

/**
 * GET /v1/jobs/:id/similar
 * Get similar jobs based on job ID
 */
const getSimilarJobsRoute = createRoute({
  method: "get",
  path: "/{id}/similar",
  tags: ["Jobs"],
  summary: "Get similar jobs",
  description:
    "Retrieve jobs similar to the specified job based on organization, employment type, and location",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Job ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
    query: similarJobsQuerySchema,
  },
  responses: {
    200: {
      description: "List of similar jobs",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(jobSchema),
          }),
        },
      },
    },
    404: {
      description: "Source job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
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
});

app.openapi(getSimilarJobsRoute, async (c) => {
  const supabase = c.get("supabase");
  const { id } = c.req.valid("param");
  const query = c.req.valid("query");

  // First get the source job to find similar ones
  const { data: sourceJob, error: sourceError } = await supabase
    .schema("core")
    .from("jobs")
    .select("organization_id, employment_type, location")
    .eq("id", id)
    .single();

  if (sourceError) {
    if (sourceError.code === "PGRST116") {
      return c.json({ error: "Job not found" }, 404);
    }
    return c.json({ error: sourceError.message }, 500);
  }

  // Find similar jobs (same organization or type)
  const { data, error } = await supabase
    .schema("core")
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .neq("id", id)
    .or(
      `organization_id.eq.${sourceJob.organization_id},employment_type.eq.${sourceJob.employment_type}`,
    )
    .limit(query.limit);

  if (error) {
    console.error("Error fetching similar jobs:", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data: data || [] }, 200);
});

/**
 * GET /v1/jobs/filter-options
 * Get available filter values for published jobs
 */
const getFilterOptionsRoute = createRoute({
  method: "get",
  path: "/filter-options",
  tags: ["Jobs"],
  summary: "Get job filter options",
  description:
    "Retrieve unique values for employment types, locations, and remote options to use in job filters",
  responses: {
    200: {
      description: "Available filter options",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              employmentTypes: z.array(z.string()),
              locations: z.array(z.string()),
              remoteOptions: z.array(z.string()),
            }),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
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
});

app.openapi(getFilterOptionsRoute, async (c) => {
  const supabase = c.get("supabase");

  try {
    // Get unique employment types
    const { data: employmentData, error: employmentError } = await supabase
      .schema("core")
      .from("jobs")
      .select("employment_type")
      .eq("status", "open")
      .not("employment_type", "is", null);

    if (employmentError) throw employmentError;

    // Get unique locations
    const { data: locationData, error: locationError } = await supabase
      .schema("core")
      .from("jobs")
      .select("location")
      .eq("status", "open")
      .not("location", "is", null);

    if (locationError) throw locationError;

    // Get unique remote options
    const { data: remoteData, error: remoteError } = await supabase
      .schema("core")
      .from("jobs")
      .select("remote_option")
      .eq("status", "open")
      .not("remote_option", "is", null);

    if (remoteError) throw remoteError;

    // Extract unique values
    const employmentTypes = Array.from(
      new Set(
        (employmentData || []).map((row) => row.employment_type).filter(
          Boolean,
        ),
      ),
    );
    const locations = Array.from(
      new Set((locationData || []).map((row) => row.location).filter(Boolean)),
    );
    const remoteOptions = Array.from(
      new Set(
        (remoteData || []).map((row) => row.remote_option).filter(Boolean),
      ),
    );

    return c.json(
      {
        data: {
          employmentTypes,
          locations,
          remoteOptions,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return c.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

// Generate OpenAPI documentation
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Scaffald Jobs API",
    version: "1.0.0",
    description: "Public API for job discovery and filtering",
  },
  servers: [
    {
      url: Deno.env.get("SUPABASE_URL")
        ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/api`
        : "https://your-project.supabase.co/functions/v1/api",
      description: "Production API",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase JWT token obtained via authentication or OAuth",
      },
    },
  },
  tags: [
    {
      name: "Jobs",
      description: "Job listing and search endpoints",
    },
  ],
});

export default app;
