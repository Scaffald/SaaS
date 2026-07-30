/**
 * O*NET REST API
 * O*NET occupational data queries
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";
import { orIlike } from "../../_shared/utils/postgrest.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

// GET /v1/onet/riasec/status - RIASEC assessment status (SDK: getRIASECStatus)
app.get("/riasec/status", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await supabase
    .schema("core")
    .from("preferences")
    .select("riasec_scores, career_assessment_completed_at")
    .eq("user_id", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    return c.json(
      { error: "Failed to fetch status", message: error.message },
      500,
    );
  }
  const scores = data?.riasec_scores as
    | Record<string, number>
    | null
    | undefined;
  const hasAll = scores &&
    typeof scores.realistic === "number" &&
    typeof scores.investigative === "number" &&
    typeof scores.artistic === "number" &&
    typeof scores.social === "number" &&
    typeof scores.enterprising === "number" &&
    typeof scores.conventional === "number";
  return c.json({
    isCompleted: !!hasAll,
    complete: !!hasAll,
    scores: scores ?? null,
    completed_at: data?.career_assessment_completed_at ?? null,
  });
});

// GET /v1/onet/occupation/status - Occupation selection status (SDK: getOccupationStatus)
app.get("/occupation/status", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await supabase
    .schema("core")
    .from("preferences")
    .select("current_occupation_code, target_occupation_codes, updated_at")
    .eq("user_id", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    return c.json(
      { error: "Failed to fetch status", message: error.message },
      500,
    );
  }
  const current = data?.current_occupation_code;
  const targets = data?.target_occupation_codes ?? [];
  const codes = [
    ...(current ? [current] : []),
    ...(Array.isArray(targets) ? targets : []),
  ];
  let occupations: Array<
    { onet_code: string; title: string; description?: string }
  > = [];
  if (codes.length > 0) {
    const { data: occs } = await supabase
      .schema("core")
      .from("onet_occupations")
      .select("onet_code, title, description")
      .in("onet_code", codes);
    occupations = (occs ?? []).map((
      o: { onet_code: string; title: string; description?: string },
    ) => ({
      onet_code: o.onet_code,
      title: o.title,
      description: o.description,
    }));
  }
  const selected =
    !!(current || (Array.isArray(targets) && targets.length > 0));
  return c.json({
    isCompleted: selected,
    selected,
    occupations,
    updated_at: data?.updated_at ?? null,
  });
});

/**
 * GET /v1/onet/search
 * Search occupations by keyword
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/search",
    tags: ["ONET"],
    summary: "Search occupations",
    request: {
      query: z.object({
        keyword: z.string(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: "Occupation search results",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(z.any()),
              pagination: z.object({
                total: z.number(),
                page: z.number(),
                limit: z.number(),
                total_pages: z.number(),
              }),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { keyword, page = 1, limit = 20 } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .schema("core")
      .from("onet_occupations")
      .select("*", { count: "exact" })
      .or(orIlike(["title", "description"], keyword))
      .range(offset, offset + limit - 1);

    if (error) {
      return c.json({
        error: "Failed to search occupations",
        message: error.message,
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  },
);

/**
 * GET /v1/onet/occupations/:onetCode
 * Get occupation details
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/occupations/{onetCode}",
    tags: ["ONET"],
    summary: "Get occupation details",
    request: {
      params: z.object({ onetCode: z.string() }),
    },
    responses: {
      200: {
        description: "Occupation details",
        content: {
          "application/json": {
            schema: z.object({ data: z.any() }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { onetCode } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("onet_occupations")
      .select("*")
      .eq("onet_code", onetCode)
      .single();

    if (error || !data) {
      return c.json({ error: "Occupation not found" }, 404);
    }

    return c.json({ data });
  },
);

/**
 * GET /v1/onet/occupations/:onetCode/skills
 * Get skills for occupation
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/occupations/{onetCode}/skills",
    tags: ["ONET"],
    summary: "Get occupation skills",
    request: {
      params: z.object({ onetCode: z.string() }),
      query: z.object({
        min_importance: z.coerce.number().optional(),
        category: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: "Occupation skills",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { onetCode } = c.req.valid("param");
    const { min_importance, category } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let query = supabase.schema("core").from("onet_skills").select("*").eq(
      "onet_code",
      onetCode,
    );

    if (min_importance) {
      query = query.gte("importance", min_importance);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("importance", {
      ascending: false,
    });

    if (error) {
      return c.json(
        { error: "Failed to fetch skills", message: error.message },
        500,
      );
    }

    return c.json({ data: data || [] });
  },
);

/**
 * GET /v1/onet/autocomplete
 * Autocomplete occupation titles
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/autocomplete",
    tags: ["ONET"],
    summary: "Autocomplete occupations",
    request: {
      query: z.object({
        query: z.string(),
        limit: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: "Autocomplete suggestions",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(z.object({
                onet_code: z.string(),
                title: z.string(),
              })),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { query: searchQuery, limit = 10 } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("onet_occupations")
      .select("onet_code, title")
      .ilike("title", `${searchQuery}%`)
      .limit(limit);

    if (error) {
      return c.json(
        { error: "Failed to autocomplete", message: error.message },
        500,
      );
    }

    return c.json({ data: data || [] });
  },
);

export default app;
