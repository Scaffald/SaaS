/**
 * Skill Analytics REST API — /v1/skills
 *
 * core.skill_snapshots and core.skill_evidence have existed for some time, and
 * packages/scf-core/features/skills-analytics renders five widgets against them
 * on the live /assessments route, plus ReviewImpactSummary inside the profile
 * ReviewsWidget. No router was ever mounted at this prefix, so all nine calls
 * 404'd and every one of those widgets showed its error state (#447).
 *
 * Literal paths are declared before the /{id} ones of the same method. This
 * router matches in declaration order, so a literal registered after a sibling
 * /{param} is unreachable: it gets captured by the param route and comes back
 * as a validation error about a param the caller never sent. GET
 * /v1/work-logs/public-feed reported "Invalid uuid: workLogId" for exactly that
 * reason until it was moved above GET /{workLogId} (verified against a live
 * stack — moving it was the whole fix).
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";
import {
  buildSummary,
  diffSnapshots,
  type SnapshotData,
  type SnapshotRow,
  summariseSoftSkills,
  toSkillSnapshot,
  toTimeline,
} from "../lib/skill-snapshots.ts";

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);

/**
 * Service client, used by exactly one endpoint.
 *
 * core.skill_evidence's update policy is `auth.uid() = user_id`, so the
 * user-scoped client can never write a row it does not own. Verification is
 * someone *else* vouching, so that policy and this feature are in direct
 * conflict — and relaxing the policy is worse, because RLS cannot restrict
 * which columns a writer touches, so a broader policy would also let a stranger
 * rewrite the title and description.
 *
 * The handler enforces the real rule before this client is used: the row must
 * exist, and the caller must not be its owner.
 */
function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

const errorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const EVIDENCE_TYPES = [
  "certification",
  "project",
  "review_excerpt",
  "work_log",
  "custom",
] as const;

const TRIGGER_TYPES = [
  "review_received",
  "self_assessment",
  "manual",
  "periodic",
] as const;

/** Evidence row -> the SDK's camelCase SkillEvidence. */
// deno-lint-ignore no-explicit-any
function toEvidence(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    softSkillId: row.soft_skill_id,
    skillTaxonomy: row.skill_taxonomy,
    skillRefId: row.skill_ref_id,
    evidenceType: row.evidence_type,
    title: row.title,
    description: row.description,
    url: row.url,
    verified: Boolean(row.verified),
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// Snapshots
// ============================================================================

/**
 * GET /v1/skills/snapshots
 *
 * Serves both listSnapshots and getLatestSnapshot — the SDK calls the same path
 * for each, differing only by `limit`.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/snapshots",
    tags: ["Skill Analytics"],
    summary: "List skill snapshots",
    request: {
      query: z.object({
        userId: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
      }),
    },
    responses: {
      200: {
        description: "Snapshots, newest first",
        content: {
          "application/json": {
            schema: z.object({ snapshots: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { userId, limit } = c.req.valid("query");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("skill_snapshots")
      .select("*")
      .eq("user_id", userId ?? user.id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);

    if (error) {
      return c.json(
        { error: "Failed to load snapshots", message: error.message },
        500,
      );
    }

    return c.json({
      snapshots: (data ?? []).map((r: SnapshotRow) => toSkillSnapshot(r)),
    });
  },
);

/**
 * GET /v1/skills/snapshots/timeline
 * Declared before /snapshots/{id} so "timeline" is not read as an id.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/snapshots/timeline",
    tags: ["Skill Analytics"],
    summary: "Snapshot timeline",
    request: {
      query: z.object({
        userId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(500).optional(),
      }),
    },
    responses: {
      200: {
        description: "Chart points, oldest first",
        content: {
          "application/json": {
            schema: z.object({ timeline: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { userId, startDate, endDate, limit } = c.req.valid("query");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    let query = supabase
      .schema("core")
      .from("skill_snapshots")
      .select("*")
      .eq("user_id", userId ?? user.id);

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);

    if (error) {
      return c.json(
        { error: "Failed to load timeline", message: error.message },
        500,
      );
    }

    return c.json({ timeline: toTimeline(data ?? []) });
  },
);

/**
 * POST /v1/skills/snapshots/compare
 * Declared before /snapshots/{id} for the same reason as timeline.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/snapshots/compare",
    tags: ["Skill Analytics"],
    summary: "Compare two snapshots",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              snapshotAId: z.string().uuid(),
              snapshotBId: z.string().uuid(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Difference of B relative to A",
        content: {
          "application/json": { schema: z.object({ diff: z.any() }) },
        },
      },
      404: {
        description: "One or both snapshots are not the caller's",
        content: { "application/json": { schema: errorSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { snapshotAId, snapshotBId } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Scoped to the caller: comparing two snapshots you do not own would leak
    // someone else's skill history.
    const { data, error } = await supabase
      .schema("core")
      .from("skill_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .in("id", [snapshotAId, snapshotBId]);

    if (error) {
      return c.json(
        { error: "Failed to load snapshots", message: error.message },
        500,
      );
    }

    const rows = (data ?? []) as SnapshotRow[];
    const a = rows.find((r) => r.id === snapshotAId);
    const b = rows.find((r) => r.id === snapshotBId);
    if (!a || !b) {
      return c.json(
        { error: "Not found", message: "Both snapshots must be your own" },
        404,
      );
    }

    return c.json({
      diff: diffSnapshots(
        a.snapshot_data ?? emptyData(),
        b.snapshot_data ?? emptyData(),
      ),
    });
  },
);

/**
 * POST /v1/skills/snapshots
 *
 * Builds the snapshot server-side from the caller's current soft-skill
 * self-ratings. The client sends only the trigger — letting it post its own
 * numbers would make the history a record of what a client believed rather than
 * of what the data said.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/snapshots",
    tags: ["Skill Analytics"],
    summary: "Create a skill snapshot",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              userId: z.string().uuid().optional(),
              triggerType: z.enum(TRIGGER_TYPES),
              triggerId: z.string().uuid().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Snapshot created",
        content: {
          "application/json": { schema: z.object({ snapshot: z.any() }) },
        },
      },
      403: {
        description: "Cannot snapshot another user",
        content: { "application/json": { schema: errorSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { userId, triggerType, triggerId } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Unlike the read paths, writing someone else's history is never valid.
    if (userId && userId !== user.id) {
      return c.json(
        {
          error: "Forbidden",
          message: "You can only snapshot your own skills",
        },
        403,
      );
    }
    const targetId = user.id;

    const [ratingsRes, evidenceRes, reviewsRes, previousRes] = await Promise
      .all(
        [
          supabase.schema("core").from("user_skills")
            .select("proficiency_level, soft_skills(category)")
            .eq("user_id", targetId).eq("skill_taxonomy", "soft_skills"),
          supabase.schema("core").from("skill_evidence")
            .select("id").eq("user_id", targetId),
          supabase.schema("core").from("reviews")
            .select("id").eq("subject_id", targetId),
          supabase.schema("core").from("skill_snapshots")
            .select("*").eq("user_id", targetId)
            .order("created_at", { ascending: false }).limit(1),
        ],
      );

    if (ratingsRes.error) {
      return c.json(
        { error: "Failed to read skills", message: ratingsRes.error.message },
        500,
      );
    }

    const ratings = (ratingsRes.data ?? [])
      // deno-lint-ignore no-explicit-any
      .map((r: any) => ({
        category: r.soft_skills?.category ?? "other",
        rating: r.proficiency_level ?? 0,
      }));

    const snapshotData: SnapshotData = {
      soft_skills: summariseSoftSkills(ratings),
      evidence_count: (evidenceRes.data ?? []).length,
      review_count: (reviewsRes.data ?? []).length,
    };

    const previous = (previousRes.data ?? [])[0] as SnapshotRow | undefined;
    const summary = buildSummary(previous?.snapshot_data ?? null, snapshotData);

    const { data, error } = await supabase
      .schema("core")
      .from("skill_snapshots")
      .insert({
        user_id: targetId,
        trigger_type: triggerType,
        trigger_id: triggerId ?? null,
        snapshot_data: snapshotData,
        summary,
      })
      .select()
      .single();

    if (error) {
      return c.json(
        { error: "Failed to create snapshot", message: error.message },
        500,
      );
    }

    return c.json({ snapshot: toSkillSnapshot(data as SnapshotRow) }, 201);
  },
);

/**
 * GET /v1/skills/snapshots/{snapshotId}
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/snapshots/{snapshotId}",
    tags: ["Skill Analytics"],
    summary: "Get one snapshot",
    request: { params: z.object({ snapshotId: z.string().uuid() }) },
    responses: {
      200: {
        description: "The snapshot",
        content: {
          "application/json": { schema: z.object({ snapshot: z.any() }) },
        },
      },
      404: {
        description: "Not the caller's snapshot",
        content: { "application/json": { schema: errorSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { snapshotId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("skill_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return c.json(
        { error: "Failed to load snapshot", message: error.message },
        500,
      );
    }
    if (!data) {
      return c.json(
        { error: "Not found", message: "No snapshot with that id is yours" },
        404,
      );
    }

    return c.json({ snapshot: toSkillSnapshot(data as SnapshotRow) });
  },
);

// ============================================================================
// Evidence
// ============================================================================

/**
 * GET /v1/skills/evidence
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/evidence",
    tags: ["Skill Analytics"],
    summary: "List skill evidence",
    request: {
      query: z.object({
        userId: z.string().uuid().optional(),
        softSkillId: z.string().uuid().optional(),
        skillTaxonomy: z.string().max(32).optional(),
        skillRefId: z.string().uuid().optional(),
      }),
    },
    responses: {
      200: {
        description: "Evidence entries",
        content: {
          "application/json": {
            schema: z.object({ evidence: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const q = c.req.valid("query");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    let query = supabase
      .schema("core")
      .from("skill_evidence")
      .select("*")
      .eq("user_id", q.userId ?? user.id);

    if (q.softSkillId) query = query.eq("soft_skill_id", q.softSkillId);
    if (q.skillTaxonomy) query = query.eq("skill_taxonomy", q.skillTaxonomy);
    if (q.skillRefId) query = query.eq("skill_ref_id", q.skillRefId);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return c.json(
        { error: "Failed to load evidence", message: error.message },
        500,
      );
    }

    return c.json({ evidence: (data ?? []).map(toEvidence) });
  },
);

/**
 * POST /v1/skills/evidence
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/evidence",
    tags: ["Skill Analytics"],
    summary: "Add skill evidence",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              softSkillId: z.string().uuid().optional(),
              skillTaxonomy: z.string().max(32).optional(),
              skillRefId: z.string().uuid().optional(),
              evidenceType: z.enum(EVIDENCE_TYPES),
              title: z.string().min(1).max(200),
              description: z.string().max(2000).optional(),
              url: z.string().url().max(2000).optional(),
            }).refine(
              // Mirrors core.skill_evidence's skill_evidence_has_skill check:
              //   soft_skill_id IS NOT NULL
              //   OR (skill_taxonomy IS NOT NULL AND skill_ref_id IS NOT NULL)
              // Without this the row is still rejected, just as a 500 from the
              // database rather than a 400 naming what the caller left out —
              // evidence has to be evidence *of* something.
              (v) =>
                Boolean(v.softSkillId) ||
                Boolean(v.skillTaxonomy && v.skillRefId),
              {
                message:
                  "Provide softSkillId, or both skillTaxonomy and skillRefId",
              },
            ),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Evidence created",
        content: {
          "application/json": { schema: z.object({ evidence: z.any() }) },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("skill_evidence")
      .insert({
        user_id: user.id,
        soft_skill_id: body.softSkillId ?? null,
        skill_taxonomy: body.skillTaxonomy ?? null,
        skill_ref_id: body.skillRefId ?? null,
        evidence_type: body.evidenceType,
        title: body.title,
        description: body.description ?? null,
        url: body.url ?? null,
        // Self-added evidence is unverified by definition; only the verify
        // endpoint may set this.
        verified: false,
      })
      .select()
      .single();

    if (error) {
      return c.json(
        { error: "Failed to create evidence", message: error.message },
        500,
      );
    }

    return c.json({ evidence: toEvidence(data) }, 201);
  },
);

/**
 * PATCH /v1/skills/evidence/{evidenceId}
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/evidence/{evidenceId}",
    tags: ["Skill Analytics"],
    summary: "Update skill evidence",
    request: {
      params: z.object({ evidenceId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              title: z.string().min(1).max(200).optional(),
              description: z.string().max(2000).nullable().optional(),
              url: z.string().url().max(2000).nullable().optional(),
            }).strict(),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated",
        content: {
          "application/json": { schema: z.object({ evidence: z.any() }) },
        },
      },
      404: {
        description: "Not the caller's evidence",
        content: { "application/json": { schema: errorSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { evidenceId } = c.req.valid("param");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Only the listed fields are writable. `verified` in particular is not —
    // a user editing their own evidence must not be able to mark it verified.
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.url !== undefined) patch.url = body.url;

    const { data, error } = await supabase
      .schema("core")
      .from("skill_evidence")
      .update(patch)
      .eq("id", evidenceId)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      return c.json(
        { error: "Failed to update evidence", message: error.message },
        500,
      );
    }
    if (!data) {
      return c.json(
        { error: "Not found", message: "No evidence with that id is yours" },
        404,
      );
    }

    return c.json({ evidence: toEvidence(data) });
  },
);

/**
 * POST /v1/skills/evidence/{evidenceId}/verify
 *
 * Verification is somebody else vouching for the evidence, so the caller must
 * not be its owner — self-verification would make the flag meaningless.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/evidence/{evidenceId}/verify",
    tags: ["Skill Analytics"],
    summary: "Verify someone else's skill evidence",
    request: { params: z.object({ evidenceId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Verified",
        content: {
          "application/json": { schema: z.object({ evidence: z.any() }) },
        },
      },
      403: {
        description: "Cannot verify your own evidence",
        content: { "application/json": { schema: errorSchema } },
      },
      404: {
        description: "No such evidence",
        content: { "application/json": { schema: errorSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { evidenceId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data: existing, error: loadError } = await supabase
      .schema("core")
      .from("skill_evidence")
      .select("id, user_id")
      .eq("id", evidenceId)
      .maybeSingle();

    if (loadError) {
      return c.json(
        { error: "Failed to load evidence", message: loadError.message },
        500,
      );
    }
    if (!existing) {
      return c.json(
        { error: "Not found", message: "No evidence with that id" },
        404,
      );
    }
    if (existing.user_id === user.id) {
      return c.json(
        {
          error: "Forbidden",
          message: "Evidence must be verified by someone else",
        },
        403,
      );
    }

    // Service client: see getServiceClient above. Ownership and not-self are
    // already checked, and only these four columns are written.
    const { data, error } = await getServiceClient()
      .schema("core")
      .from("skill_evidence")
      .update({
        verified: true,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", evidenceId)
      .select()
      .maybeSingle();

    if (error) {
      return c.json(
        { error: "Failed to verify evidence", message: error.message },
        500,
      );
    }

    return c.json({ evidence: toEvidence(data) });
  },
);

function emptyData(): SnapshotData {
  return {
    soft_skills: { categories: {}, overall_average: 0 },
    evidence_count: 0,
    review_count: 0,
  };
}

export default app;
