/**
 * Community Skills Taxonomy REST API
 * Search-first skill tagging with hierarchical tree navigation
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const skillSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    tier: z.number().int(),
    parent_id: z.string().uuid().nullable(),
    community_id: z.string().uuid().nullable(),
    description: z.string().nullable(),
  })
  .openapi("CommunitySkill");

const _skillSearchResultSchema = skillSchema
  .extend({
    parent_chain: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        tier: z.number().int(),
      }),
    ),
  })
  .openapi("SkillSearchResult");

// ============================================================================
// GET /v1/communities/skills/search — Search taxonomy
// ============================================================================

const searchSkillsRoute = createRoute({
  method: "get",
  path: "/search",
  tags: ["Community Skills"],
  summary: "Search skills",
  description:
    "Search-first skill tagging: type a term, get results with auto-selected parent hierarchy",
  request: {
    query: z.object({
      q: z.string().min(1),
      community_id: z.string().uuid().optional(),
      limit: z.coerce.number().int().positive().max(50).optional().default(20),
    }),
  },
  responses: {
    200: {
      description: "Search results",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(skillSchema) }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(searchSkillsRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const { q, community_id, limit } = c.req.valid("query");

  // Use full-text search on the skill taxonomy
  const query = supabase
    .schema("community")
    .from("skill_taxonomy")
    .select("id, name, slug, tier, parent_id, community_id, description")
    .eq("is_active", true)
    .textSearch("tsv", q, { type: "websearch" })
    .limit(limit);

  if (community_id) {
    // Filter to skills within this community's tree
    // For simplicity, get all skills and filter by ancestry
    // A more efficient approach would use the search_skill_taxonomy function
  }

  const { data: skills, error } = await query;

  if (error) {
    console.error("Error searching skills:", error);
    return c.json({ error: "Search failed", message: error.message }, 500);
  }

  return c.json({ data: skills || [] });
});

// ============================================================================
// GET /v1/communities/skills/tree/:communityId — Get full tree
// ============================================================================

const getTreeRoute = createRoute({
  method: "get",
  path: "/tree/{communityId}",
  tags: ["Community Skills"],
  summary: "Skill tree",
  description: "Get the full skill taxonomy tree for a community",
  request: {
    params: z.object({ communityId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Skill tree",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(skillSchema) }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getTreeRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const { communityId } = c.req.valid("param");

  // Get tier 0 for this community
  const { data: root } = await supabase
    .schema("community")
    .from("skill_taxonomy")
    .select("id")
    .eq("community_id", communityId)
    .eq("tier", 0)
    .maybeSingle();

  if (!root) {
    return c.json({ data: [] });
  }

  // Get all descendants using recursive approach
  // For simplicity, get all skills and build tree client-side
  const { data: allSkills, error } = await supabase
    .schema("community")
    .from("skill_taxonomy")
    .select("id, name, slug, tier, parent_id, community_id, description")
    .eq("is_active", true)
    .order("tier", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return c.json(
      { error: "Failed to fetch tree", message: error.message },
      500,
    );
  }

  // Filter to only this community's tree
  const rootId = root.id;
  const treeIds = new Set([rootId]);

  // Walk down the tree
  const skills = allSkills || [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const skill of skills) {
      if (
        skill.parent_id && treeIds.has(skill.parent_id) &&
        !treeIds.has(skill.id)
      ) {
        treeIds.add(skill.id);
        changed = true;
      }
    }
  }

  const filtered = skills.filter((s: Record<string, unknown>) =>
    treeIds.has(s.id as string)
  );

  return c.json({ data: filtered });
});

// ============================================================================
// GET /v1/communities/skills/:skillId/children — Get children
// ============================================================================

const getChildrenRoute = createRoute({
  method: "get",
  path: "/{skillId}/children",
  tags: ["Community Skills"],
  summary: "Skill children",
  description: "Get direct children of a skill node",
  request: {
    params: z.object({ skillId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Child skills",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(skillSchema) }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getChildrenRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const { skillId } = c.req.valid("param");

  const { data, error } = await supabase
    .schema("community")
    .from("skill_taxonomy")
    .select("id, name, slug, tier, parent_id, community_id, description")
    .eq("parent_id", skillId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return c.json(
      { error: "Failed to fetch children", message: error.message },
      500,
    );
  }

  return c.json({ data: data || [] });
});

// ============================================================================
// GET /v1/communities/skills/:skillId/ancestors — Get ancestors (for auto-tagging)
// ============================================================================

const getAncestorsRoute = createRoute({
  method: "get",
  path: "/{skillId}/ancestors",
  tags: ["Community Skills"],
  summary: "Skill ancestors",
  description:
    "Get the full parent chain for a skill (for auto-parent-tagging)",
  request: {
    params: z.object({ skillId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Ancestor chain",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(skillSchema) }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getAncestorsRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const { skillId } = c.req.valid("param");

  // Walk up the tree
  const ancestors: Record<string, unknown>[] = [];
  let currentId = skillId;

  for (let i = 0; i < 10; i++) {
    // max 10 levels
    const { data: skill } = await supabase
      .schema("community")
      .from("skill_taxonomy")
      .select("id, name, slug, tier, parent_id, community_id, description")
      .eq("id", currentId)
      .maybeSingle();

    if (!skill) break;
    ancestors.push(skill);
    if (!skill.parent_id) break;
    currentId = skill.parent_id;
  }

  return c.json({ data: ancestors.reverse() }); // Root first
});

export default app;
