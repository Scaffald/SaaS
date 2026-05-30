/**
 * Certifications REST API
 * Manages user certifications and certification catalog
 * Supports hierarchical certification structure (depth 0, 1, 2)
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
}).openapi("ErrorResponse");

const certificationCatalogSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  depth: z.number(),
  parent_id: z.string().uuid().nullable(),
  hierarchy_path: z.string(),
  sort_order: z.number(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  parent_title: z.string().nullable().optional(),
  parent_slug: z.string().nullable().optional(),
});

const userCertificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  certification_id: z.string().uuid().nullable(),
  name: z.string().nullable().optional(),
  issuing_organization: z.string().nullable().optional(),
  issue_date: z.string().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  credential_id: z.string().nullable().optional(),
  credential_url: z.string().nullable().optional(),
  certificate_file_path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  verification_status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Freeform legacy shape — matches packages/sdk/src/resources/certifications.ts
// LegacyCertification. id is optional on inserts (omitted on create, present
// on updates). is_active / verification_status default the same way the shared
// tRPC schema does so clients generated from that contract can omit them
// without getting a 400 from the newly-ported REST route.
const legacyCertificationSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  name: z.string().min(1),
  issuing_organization: z.string().min(1),
  issue_date: z.string().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  credential_id: z.string().nullable().optional(),
  credential_url: z.string().nullable().optional(),
  certificate_file_path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  verification_status: z.string().default("unverified"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/certifications/top-level
 * Get top-level certifications with search
 */
const getTopLevelRoute = createRoute({
  method: "get",
  path: "/top-level",
  tags: ["Certifications"],
  summary: "Get top-level certifications",
  request: {
    query: z.object({
      search: z.string().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Top-level certifications",
      content: {
        "application/json": {
          schema: z.object({
            certifications: z.array(certificationCatalogSchema),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getTopLevelRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { search, limit } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let query = supabase
    .schema("data")
    .from("certifications")
    .select("*")
    .eq("is_active", true);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (limit) {
    query = query.limit(limit);
  }

  query = query.order("sort_order");

  const { data, error } = await query;

  if (error) {
    return c.json({
      error: "Failed to fetch certifications",
      message: error.message,
    }, 500);
  }

  return c.json({ certifications: data || [] });
});

/**
 * GET /v1/profiles/certifications/children
 * Get certification children by parent ID
 */
const getChildrenRoute = createRoute({
  method: "get",
  path: "/children",
  tags: ["Certifications"],
  summary: "Get certification children",
  request: {
    query: z.object({
      parent_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Child certifications",
      content: {
        "application/json": {
          schema: z.object({
            certifications: z.array(certificationCatalogSchema),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getChildrenRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { parent_id } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("data")
    .from("certifications")
    .select("*")
    .eq("parent_id", parent_id)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    return c.json(
      { error: "Failed to fetch children", message: error.message },
      500,
    );
  }

  return c.json({ certifications: data || [] });
});

/**
 * GET /v1/profiles/certifications/tree
 * Get user's certification tree
 */
const getUserTreeRoute = createRoute({
  method: "get",
  path: "/tree",
  tags: ["Certifications"],
  summary: "Get user certification tree",
  responses: {
    200: {
      description: "User certification tree",
      content: {
        "application/json": {
          schema: z.object({
            depth0: z.array(userCertificationSchema),
            depth1ByParent: z.record(z.array(userCertificationSchema)),
            depth2ByParent: z.record(z.array(userCertificationSchema)),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getUserTreeRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: userCerts, error } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) {
    return c.json(
      { error: "Failed to fetch tree", message: error.message },
      500,
    );
  }

  // The catalog lives in data.certifications (FK: user_certifications.certification_id).
  // Fetched in a second query rather than a PostgREST embed because the base table is
  // in `core` and the catalog in `data`, and `core.certifications` is an unrelated table
  // whose name would make an embed hint ambiguous.
  type CatalogRow = { id: string; depth: number; parent_id?: string | null };
  const certIds = [
    ...new Set(
      ((userCerts || []) as Array<{ certification_id?: string }>)
        .map((u) => u.certification_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const catalogById: Record<string, CatalogRow> = {};
  if (certIds.length > 0) {
    const { data: catalogRows, error: catalogError } = await supabase
      .schema("data")
      .from("certifications")
      .select("*")
      .in("id", certIds);

    if (catalogError) {
      return c.json(
        { error: "Failed to fetch tree", message: catalogError.message },
        500,
      );
    }

    for (const row of (catalogRows || []) as CatalogRow[]) {
      catalogById[row.id] = row;
    }
  }

  // Organize by depth
  type CertWithCatalog = {
    certification_id?: string;
    catalog?: { depth: number; parent_id?: string | null };
  };
  const depth0: CertWithCatalog[] = [];
  const depth1ByParent: Record<string, CertWithCatalog[]> = {};
  const depth2ByParent: Record<string, CertWithCatalog[]> = {};

  for (const baseCert of (userCerts || []) as CertWithCatalog[]) {
    const catalog = baseCert.certification_id
      ? catalogById[baseCert.certification_id]
      : undefined;
    if (!catalog) continue;
    const cert: CertWithCatalog = { ...baseCert, catalog };

    if (catalog.depth === 0) {
      depth0.push(cert);
    } else if (catalog.depth === 1 && catalog.parent_id) {
      if (!depth1ByParent[catalog.parent_id]) {
        depth1ByParent[catalog.parent_id] = [];
      }
      depth1ByParent[catalog.parent_id].push(cert);
    } else if (catalog.depth === 2 && catalog.parent_id) {
      if (!depth2ByParent[catalog.parent_id]) {
        depth2ByParent[catalog.parent_id] = [];
      }
      depth2ByParent[catalog.parent_id].push(cert);
    }
  }

  return c.json({ depth0, depth1ByParent, depth2ByParent });
});

/**
 * POST /v1/profiles/certifications/add
 * Add certification
 */
const addCertificationRoute = createRoute({
  method: "post",
  path: "/add",
  tags: ["Certifications"],
  summary: "Add certification",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            certification_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Certification added",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            certification: userCertificationSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(addCertificationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { certification_id } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("user_certifications")
    .insert({
      user_id: user.id,
      certification_id,
      is_active: true,
      verification_status: "unverified",
    })
    .select()
    .single();

  if (error) {
    return c.json({
      error: "Failed to add certification",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true, certification: data }, 201);
});

/**
 * GET /v1/profiles/certifications
 * Get user's certifications (legacy)
 */
const getCertificationsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Certifications"],
  summary: "Get user certifications",
  responses: {
    200: {
      description: "User certifications",
      content: {
        "application/json": {
          schema: z.array(userCertificationSchema),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getCertificationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) {
    return c.json({
      error: "Failed to fetch certifications",
      message: error.message,
    }, 500);
  }

  return c.json(data || []);
});

/**
 * POST /v1/profiles/certifications/add-category
 * Add depth-1 category cert when a parent (depth-0) is already present.
 */
const addCategoryRoute = createRoute({
  method: "post",
  path: "/add-category",
  tags: ["Certifications"],
  summary: "Add category certification",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            category_id: z.string().uuid(),
            parent_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Category added or already present",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            certification: userCertificationSchema,
            alreadyExists: z.boolean().optional(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(addCategoryRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { category_id, parent_id } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: parentCert } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("certification_id", parent_id)
    .eq("is_active", true)
    .single();

  if (!parentCert) {
    return c.json({
      error: "Bad Request",
      message: "Parent certification not found in your profile",
    }, 400);
  }

  const { data: cert, error: certError } = await supabase
    .schema("data")
    .from("certifications")
    .select("*")
    .eq("id", category_id)
    .eq("depth", 1)
    .eq("parent_id", parent_id)
    .eq("is_active", true)
    .single();

  if (certError || !cert) {
    return c.json({
      error: "Not Found",
      message: "Category certification not found",
    }, 404);
  }

  const { data: existing } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("certification_id", category_id)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    return c.json({ success: true, certification: existing, alreadyExists: true });
  }

  const { data, error } = await supabase
    .schema("core")
    .from("user_certifications")
    .insert({
      user_id: user.id,
      certification_id: category_id,
      is_active: true,
      verification_status: "unverified",
    })
    .select()
    .single();

  if (error) {
    return c.json({
      error: "Failed to add category",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true, certification: data, alreadyExists: false });
});

/**
 * POST /v1/profiles/certifications/toggle-specific
 * Toggle a depth-2 cert. When `checked`, auto-creates the parent chain
 * (depth-1 category and depth-0 top-level) if missing. When unchecked,
 * soft-deletes.
 */
const toggleSpecificRoute = createRoute({
  method: "post",
  path: "/toggle-specific",
  tags: ["Certifications"],
  summary: "Toggle specific certification",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            certification_id: z.string().uuid(),
            parent_id: z.string().uuid(),
            checked: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Certification toggled",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            certification: userCertificationSchema.nullable(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(toggleSpecificRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { certification_id, parent_id, checked } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // Ensure a parent-chain row exists & is active. Reactivates an inactive
  // existing row if one is present; otherwise inserts.
  const ensureActive = async (certId: string, context: string) => {
    const { data: existing, error: existingError } = await supabase
      .schema("core")
      .from("user_certifications")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("certification_id", certId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to verify ${context}: ${existingError.message}`);
    }

    if (existing?.is_active) return existing;

    if (existing && !existing.is_active) {
      const { data: reactivated, error: reactivateError } = await supabase
        .schema("core")
        .from("user_certifications")
        .update({ is_active: true })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (reactivateError) {
        throw new Error(`Failed to reactivate ${context}: ${reactivateError.message}`);
      }
      return reactivated;
    }

    const { data: created, error: createError } = await supabase
      .schema("core")
      .from("user_certifications")
      .insert({
        user_id: user.id,
        certification_id: certId,
        is_active: true,
        verification_status: "unverified",
      })
      .select("id")
      .single();
    if (createError) {
      throw new Error(`Failed to add ${context}: ${createError.message}`);
    }
    return created;
  };

  if (checked) {
    const { data: parentCatalog, error: parentCatalogError } = await supabase
      .schema("data")
      .from("certifications")
      .select("id, depth, parent_id, is_active")
      .eq("id", parent_id)
      .maybeSingle();

    if (
      parentCatalogError ||
      !parentCatalog ||
      parentCatalog.depth !== 1 ||
      !parentCatalog.is_active ||
      !parentCatalog.parent_id
    ) {
      return c.json({
        error: "Bad Request",
        message: "Parent category not found in catalog",
      }, 400);
    }

    try {
      await ensureActive(parentCatalog.parent_id, "top-level certification");
      await ensureActive(parentCatalog.id, "parent category");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: "Failed to ensure parent chain", message: msg }, 500);
    }

    const { data: cert, error: certError } = await supabase
      .schema("data")
      .from("certifications")
      .select("*")
      .eq("id", certification_id)
      .eq("depth", 2)
      .eq("parent_id", parent_id)
      .eq("is_active", true)
      .single();

    if (certError || !cert) {
      return c.json({ error: "Not Found", message: "Certification not found" }, 404);
    }

    const { data: existing } = await supabase
      .schema("core")
      .from("user_certifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("certification_id", certification_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) return c.json({ success: true, certification: existing });

    const { data, error } = await supabase
      .schema("core")
      .from("user_certifications")
      .insert({
        user_id: user.id,
        certification_id,
        is_active: true,
        verification_status: "unverified",
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to add certification",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true, certification: data });
  }

  // Unchecked → soft-delete.
  const { error } = await supabase
    .schema("core")
    .from("user_certifications")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("certification_id", certification_id);

  if (error) {
    return c.json({
      error: "Failed to remove certification",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true, certification: null });
});

/**
 * POST /v1/profiles/certifications/remove-top-level
 * Soft-delete a depth-0 cert + cascade to its descendants. Requires
 * confirmation if multiple descendants would be affected.
 */
const removeTopLevelRoute = createRoute({
  method: "post",
  path: "/remove-top-level",
  tags: ["Certifications"],
  summary: "Remove top-level certification (cascade)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            top_level_id: z.string().uuid(),
            confirmed: z.boolean().optional().default(false),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Removed, or needs confirmation",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            needsConfirmation: z.boolean().optional(),
            affectedCount: z.number().optional(),
            message: z.string().optional(),
            removedCount: z.number().optional(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(removeTopLevelRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { top_level_id, confirmed } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: topLevelCatalog, error: catalogError } = await supabase
    .schema("data")
    .from("certifications")
    .select("*")
    .eq("id", top_level_id)
    .eq("depth", 0)
    .single();

  if (catalogError || !topLevelCatalog) {
    return c.json({ error: "Not Found", message: "Top-level certification not found" }, 404);
  }

  const { data: descendants } = await supabase
    .schema("data")
    .from("certifications")
    .select("id")
    .ilike("hierarchy_path", `${topLevelCatalog.hierarchy_path}%`)
    .neq("id", top_level_id);

  const descendantIds = (descendants || []).map((d: { id: string }) => d.id);
  const allIdsToRemove = [top_level_id, ...descendantIds];

  const { data: affectedCerts, error: countError } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("id, certification_id")
    .eq("user_id", user.id)
    .in("certification_id", allIdsToRemove)
    .eq("is_active", true);

  if (countError) {
    return c.json({
      error: "Failed to count affected certifications",
      message: countError.message,
    }, 500);
  }

  const affectedCount = affectedCerts?.length || 0;

  if (!confirmed && affectedCount > 1) {
    return c.json({
      success: false,
      needsConfirmation: true,
      affectedCount: affectedCount - 1,
      message: `Removing this will also remove ${affectedCount - 1} related certification(s)`,
    });
  }

  const { error: deleteError } = await supabase
    .schema("core")
    .from("user_certifications")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .in("certification_id", allIdsToRemove);

  if (deleteError) {
    return c.json({
      error: "Failed to remove certifications",
      message: deleteError.message,
    }, 500);
  }

  return c.json({
    success: true,
    needsConfirmation: false,
    removedCount: affectedCount,
  });
});

/**
 * POST /v1/profiles/certifications/update-proof
 * Attach proof of certification — either a credential URL or an uploaded
 * file (base64-encoded). Verifies the user owns the row first.
 */
const updateProofRoute = createRoute({
  method: "post",
  path: "/update-proof",
  tags: ["Certifications"],
  summary: "Update certification proof (URL or file)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            user_certification_id: z.string().uuid(),
            proof_type: z.enum(["url", "file"]),
            credential_url: z.string().url().optional(),
            certificate_file: z.string().optional(),
            file_name: z.string().optional(),
            content_type: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Proof updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            proofType: z.enum(["url", "file"]),
            url: z.string().optional(),
            filePath: z.string().optional(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(updateProofRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const input = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: userCert, error: certError } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("id, user_id")
    .eq("id", input.user_certification_id)
    .eq("user_id", user.id)
    .single();

  if (certError || !userCert) {
    return c.json({ error: "Not Found", message: "Certification not found" }, 404);
  }

  if (input.proof_type === "url") {
    const { error } = await supabase
      .schema("core")
      .from("user_certifications")
      .update({
        credential_url: input.credential_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.user_certification_id);

    if (error) {
      return c.json({
        error: "Failed to update URL",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true, proofType: "url", url: input.credential_url });
  }

  // File proof.
  if (!input.certificate_file || !input.file_name) {
    return c.json({
      error: "Bad Request",
      message: "File data and name required for file upload",
    }, 400);
  }

  const base64Data = input.certificate_file.split(",")[1] ?? input.certificate_file;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const sanitizedFileName = input.file_name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
  const uniqueFileName = `${user.id}/cert-${Date.now()}-${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("certifications")
    .upload(uniqueFileName, bytes, {
      contentType: input.content_type || "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return c.json({
      error: "Failed to upload file",
      message: uploadError.message,
    }, 500);
  }

  const { error: updateError } = await supabase
    .schema("core")
    .from("user_certifications")
    .update({
      certificate_file_path: uniqueFileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.user_certification_id);

  if (updateError) {
    // Roll back the upload so we don't leak orphaned storage objects.
    await supabase.storage.from("certifications").remove([uniqueFileName]);
    return c.json({
      error: "Failed to update record",
      message: updateError.message,
    }, 500);
  }

  return c.json({ success: true, proofType: "file", filePath: uniqueFileName });
});

/**
 * POST /v1/profiles/certifications/save
 * Legacy bulk save of freeform certifications (name + issuing_organization,
 * not catalog-linked). Used by the "Add custom certification" UI path. Requires
 * migration 334 — without that the freeform columns don't exist.
 */
const saveCertificationsRoute = createRoute({
  method: "post",
  path: "/save",
  tags: ["Certifications"],
  summary: "Bulk save freeform certifications",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            certifications: z.array(legacyCertificationSchema),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Saved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            certifications: z.array(userCertificationSchema),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveCertificationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { certifications } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const saved: unknown[] = [];

  for (const cert of certifications) {
    const payload = {
      name: cert.name,
      issuing_organization: cert.issuing_organization,
      issue_date: cert.issue_date || null,
      expiration_date: cert.expiration_date || null,
      credential_id: cert.credential_id || null,
      credential_url: cert.credential_url || null,
      description: cert.description || null,
      is_active: cert.is_active,
      verification_status: cert.verification_status,
    };

    if (cert.id) {
      const { data, error } = await supabase
        .schema("core")
        .from("user_certifications")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", cert.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return c.json({
          error: "Failed to update certification",
          message: error.message,
        }, 500);
      }
      saved.push(data);
    } else {
      const { data, error } = await supabase
        .schema("core")
        .from("user_certifications")
        .insert({ user_id: user.id, ...payload })
        .select()
        .single();

      if (error) {
        return c.json({
          error: "Failed to create certification",
          message: error.message,
        }, 500);
      }
      saved.push(data);
    }
  }

  return c.json({ success: true, certifications: saved });
});

/**
 * POST /v1/profiles/certifications/upload-file
 * Legacy: upload a file for an existing freeform cert and stamp its path.
 */
const uploadCertificationFileRoute = createRoute({
  method: "post",
  path: "/upload-file",
  tags: ["Certifications"],
  summary: "Upload certification file (legacy)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            certificationId: z.string().uuid(),
            file: z.string(),
            fileName: z.string(),
            contentType: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Uploaded",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            filePath: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(uploadCertificationFileRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { certificationId, file, fileName, contentType } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: certification, error: certError } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("id, user_id")
    .eq("id", certificationId)
    .eq("user_id", user.id)
    .single();

  if (certError || !certification) {
    return c.json({
      error: "Not Found",
      message: "Certification not found or does not belong to user",
    }, 404);
  }

  const base64Data = file.split(",")[1] ?? file;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
  const uniqueFileName = `${user.id}/cert-${Date.now()}-${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("certifications")
    .upload(uniqueFileName, bytes, { contentType, upsert: true });

  if (uploadError) {
    return c.json({
      error: "Failed to upload certification file",
      message: uploadError.message,
    }, 500);
  }

  const { error: updateError } = await supabase
    .schema("core")
    .from("user_certifications")
    .update({
      certificate_file_path: uniqueFileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", certificationId)
    .eq("user_id", user.id);

  if (updateError) {
    await supabase.storage.from("certifications").remove([uniqueFileName]);
    return c.json({
      error: "Failed to update certification with file path",
      message: updateError.message,
    }, 500);
  }

  return c.json({ success: true, filePath: uniqueFileName });
});

/**
 * POST /v1/profiles/certifications/delete-file
 * Legacy: remove the stored file and clear certificate_file_path.
 */
const deleteCertificationFileRoute = createRoute({
  method: "post",
  path: "/delete-file",
  tags: ["Certifications"],
  summary: "Delete certification file (legacy)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            certificationId: z.string().uuid(),
            filePath: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "File deleted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(deleteCertificationFileRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { certificationId, filePath } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: certification, error: certError } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("id, user_id, certificate_file_path")
    .eq("id", certificationId)
    .eq("user_id", user.id)
    .single();

  if (certError || !certification) {
    return c.json({
      error: "Not Found",
      message: "Certification not found or does not belong to user",
    }, 404);
  }

  if (certification.certificate_file_path !== filePath) {
    return c.json({
      error: "Bad Request",
      message: "File path does not match certification record",
    }, 400);
  }

  // Storage delete failures aren't fatal — the DB record is what gates the UI;
  // a dangling file is preferable to a half-updated record.
  await supabase.storage.from("certifications").remove([filePath]);

  const { error: updateError } = await supabase
    .schema("core")
    .from("user_certifications")
    .update({
      certificate_file_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", certificationId)
    .eq("user_id", user.id);

  if (updateError) {
    return c.json({
      error: "Failed to update certification record",
      message: updateError.message,
    }, 500);
  }

  return c.json({ success: true });
});

/**
 * POST /v1/profiles/certifications/delete
 * Legacy: hard-delete a freeform certification + storage file. Use the
 * remove-top-level / toggle-specific endpoints for catalog-linked certs.
 */
const deleteCertificationRoute = createRoute({
  method: "post",
  path: "/delete",
  tags: ["Certifications"],
  summary: "Delete certification (legacy)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ certificationId: z.string().uuid() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Deleted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(deleteCertificationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { certificationId } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: cert, error: fetchError } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("certificate_file_path")
    .eq("id", certificationId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    return c.json({ error: "Not Found", message: "Certification not found" }, 404);
  }

  if (cert.certificate_file_path) {
    await supabase.storage
      .from("certifications")
      .remove([cert.certificate_file_path]);
  }

  const { error: deleteError } = await supabase
    .schema("core")
    .from("user_certifications")
    .delete()
    .eq("id", certificationId)
    .eq("user_id", user.id);

  if (deleteError) {
    return c.json({
      error: "Failed to delete certification",
      message: deleteError.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
