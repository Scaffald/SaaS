/**
 * Background Checks Admin REST API
 * Office role required. Migrated from tRPC backgroundChecks.admin* procedures.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type ApiEnv, authMiddleware, requireRole } from "../middleware/auth.ts";

const app = new Hono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", requireRole("office", "platform"));

// Admin check-type schema (matches tRPC)
const adminCheckTypeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  provider_check_code: z.string().nullable(),
  validity_days: z.number().nullable(),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number().nullable(),
  estimated_completion_days: z.number().nullable(),
  required_documents: z.array(z.string()),
  provider_configuration: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

type AdminCheckType = z.infer<typeof adminCheckTypeSchema>;

const adminPackageSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  provider_package_code: z.string().nullable(),
  check_type_ids: z.array(z.string().uuid()),
  component_overrides: z.array(z.record(z.string(), z.unknown())).default([]),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number(),
  estimated_completion_days: z.number().nullable(),
  is_active: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
  components: z.array(
    adminCheckTypeSchema.pick({
      id: true,
      slug: true,
      display_name: true,
      category: true,
      validity_days: true,
      estimated_completion_days: true,
      platform_cost_cents: true,
      retail_cost_cents: true,
      is_active: true,
    }),
  ),
});

function mapAdminCheckType(row: Record<string, unknown>): AdminCheckType {
  const requiredDocuments = Array.isArray(row.required_documents)
    ? row.required_documents.filter((d: unknown): d is string =>
      typeof d === "string"
    )
    : [];
  const providerConfiguration = row.provider_configuration &&
      typeof row.provider_configuration === "object" &&
      !Array.isArray(row.provider_configuration)
    ? (row.provider_configuration as Record<string, unknown>)
    : {};
  const metadata = row.metadata && typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
  return adminCheckTypeSchema.parse({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? null,
    category: row.category ?? null,
    provider_check_code: row.provider_check_code ?? null,
    validity_days: row.validity_days ?? null,
    platform_cost_cents: row.platform_cost_cents,
    retail_cost_cents: row.retail_cost_cents ?? null,
    estimated_completion_days: row.estimated_completion_days ?? null,
    required_documents: requiredDocuments,
    provider_configuration: providerConfiguration,
    metadata,
    is_active: Boolean(row.is_active ?? true),
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

function mapAdminPackage(
  row: Record<string, unknown>,
  typeMap: Map<string, AdminCheckType>,
) {
  const metadata = row.metadata && typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
  const componentOverrides = Array.isArray(row.component_overrides)
    ? row.component_overrides
    : [];
  const checkTypeIds = (row.check_type_ids ?? []).filter((
    v: unknown,
  ): v is string => typeof v === "string");
  const components = checkTypeIds.map((id) => typeMap.get(id)).filter(
    Boolean,
  ) as AdminCheckType[];
  return adminPackageSchema.parse({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? null,
    provider_package_code: row.provider_package_code ?? null,
    check_type_ids: checkTypeIds,
    component_overrides: componentOverrides,
    platform_cost_cents: row.platform_cost_cents,
    retail_cost_cents: row.retail_cost_cents,
    estimated_completion_days: row.estimated_completion_days ?? null,
    is_active: Boolean(row.is_active ?? true),
    metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    components,
  });
}

// GET /admin/packages
app.get("/packages", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) {
    return c.json({ error: "Admin client not available" }, 500);
  }

  const { data: packageRows, error: pkgError } = await supabaseAdmin
    .schema("core")
    .from("background_check_packages")
    .select(
      "id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at",
    )
    .order("display_name", { ascending: true });

  if (pkgError) {
    return c.json({
      error: "Failed to fetch packages",
      message: pkgError.message,
    }, 500);
  }

  const rows = packageRows ?? [];
  if (rows.length === 0) return c.json({ data: [] });

  const typeIds = new Set<string>();
  for (const pkg of rows) {
    for (const id of pkg.check_type_ids ?? []) {
      if (typeof id === "string") typeIds.add(id);
    }
  }

  let typeMap = new Map<string, AdminCheckType>();
  if (typeIds.size > 0) {
    const { data: typeRows, error: typeError } = await supabaseAdmin
      .schema("core")
      .from("background_check_types")
      .select(
        "id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at",
      )
      .in("id", Array.from(typeIds));

    if (typeError) {
      return c.json({
        error: "Failed to fetch check types",
        message: typeError.message,
      }, 500);
    }
    typeMap = new Map(
      (typeRows ?? []).map((r) =>
        [r.id, mapAdminCheckType(r as Record<string, unknown>)] as [
          string,
          AdminCheckType,
        ]
      ),
    );
  }

  const packages = rows.map((r) =>
    mapAdminPackage(r as Record<string, unknown>, typeMap)
  );

  return c.json({ data: packages });
});

// GET /admin/check-types
app.get("/check-types", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) {
    return c.json({ error: "Admin client not available" }, 500);
  }

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("background_check_types")
    .select(
      "id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at",
    )
    .order("display_name", { ascending: true });

  if (error) {
    return c.json({
      error: "Failed to fetch check types",
      message: error.message,
    }, 500);
  }

  const types = (data ?? []).map((r) =>
    mapAdminCheckType(r as Record<string, unknown>)
  );
  return c.json({ data: types });
});

const upsertCheckTypeSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  display_name: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  provider_check_code: z.string().max(120).nullable().optional(),
  validity_days: z.number().int().positive().nullable().optional(),
  platform_cost_cents: z.number().int().min(0),
  retail_cost_cents: z.number().int().min(0).nullable().optional(),
  estimated_completion_days: z.number().int().min(0).nullable().optional(),
  required_documents: z.array(z.string().min(1)).optional(),
  provider_configuration: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

const upsertPackageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  display_name: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  provider_package_code: z.string().max(120).nullable().optional(),
  check_type_ids: z.array(z.string().uuid()).min(1),
  platform_cost_cents: z.number().int().min(0),
  retail_cost_cents: z.number().int().min(0),
  estimated_completion_days: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  component_overrides: z.array(z.record(z.string(), z.unknown())).optional(),
  is_active: z.boolean().optional(),
});

// POST /admin/check-types (upsert)
app.post(
  "/check-types",
  zValidator("json", upsertCheckTypeSchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json(
        { error: "Admin client not available" },
        500,
      );
    }

    const input = c.req.valid("json");
    const payload = {
      slug: input.slug,
      display_name: input.display_name,
      description: input.description ?? null,
      category: input.category ?? null,
      provider_check_code: input.provider_check_code ?? null,
      validity_days: input.validity_days ?? null,
      platform_cost_cents: input.platform_cost_cents,
      retail_cost_cents: input.retail_cost_cents ?? null,
      estimated_completion_days: input.estimated_completion_days ?? null,
      required_documents:
        input.required_documents?.filter((d) => d.trim().length > 0) ?? [],
      provider_configuration: input.provider_configuration ?? {},
      metadata: input.metadata ?? {},
      is_active: input.is_active ?? true,
    };

    const cols =
      "id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at";

    let result: { data: unknown; error: { message?: string } | null };
    if (input.id) {
      result = await supabaseAdmin
        .schema("core")
        .from("background_check_types")
        .update(payload)
        .eq("id", input.id)
        .select(cols)
        .maybeSingle();
    } else {
      result = await supabaseAdmin
        .schema("core")
        .from("background_check_types")
        .insert(payload)
        .select(cols)
        .maybeSingle();
    }

    if (result.error || !result.data) {
      return c.json({
        error: "Failed to save check type",
        message: result.error?.message,
      }, 500);
    }

    const mapped = mapAdminCheckType(result.data as Record<string, unknown>);
    return c.json({ data: mapped }, input.id ? 200 : 201);
  },
);

// POST /admin/packages (upsert)
app.post("/packages", zValidator("json", upsertPackageSchema), async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) {
    return c.json({ error: "Admin client not available" }, 500);
  }

  const input = c.req.valid("json");
  const payload = {
    slug: input.slug,
    display_name: input.display_name,
    description: input.description ?? null,
    provider_package_code: input.provider_package_code ?? null,
    check_type_ids: input.check_type_ids,
    component_overrides: Array.isArray(input.component_overrides)
      ? input.component_overrides
      : [],
    platform_cost_cents: input.platform_cost_cents,
    retail_cost_cents: input.retail_cost_cents,
    estimated_completion_days: input.estimated_completion_days ?? null,
    metadata: input.metadata ?? {},
    is_active: input.is_active ?? true,
  };

  const cols =
    "id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at";

  let result: { data: unknown; error: { message?: string } | null };
  if (input.id) {
    result = await supabaseAdmin
      .schema("core")
      .from("background_check_packages")
      .update(payload)
      .eq("id", input.id)
      .select(cols)
      .maybeSingle();
  } else {
    result = await supabaseAdmin
      .schema("core")
      .from("background_check_packages")
      .insert(payload)
      .select(cols)
      .maybeSingle();
  }

  if (result.error || !result.data) {
    return c.json({
      error: "Failed to save package",
      message: result.error?.message,
    }, 500);
  }

  const row = result.data as Record<string, unknown>;
  const checkTypeIds = (row.check_type_ids ?? []).filter((
    v: unknown,
  ): v is string => typeof v === "string");
  const { data: typeRows } = await supabaseAdmin
    .schema("core")
    .from("background_check_types")
    .select(
      "id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at",
    )
    .in(
      "id",
      checkTypeIds.length > 0
        ? checkTypeIds
        : ["00000000-0000-0000-0000-000000000000"],
    );

  const typeMap = new Map(
    (typeRows ?? []).map((r) =>
      [r.id, mapAdminCheckType(r as Record<string, unknown>)] as [
        string,
        AdminCheckType,
      ]
    ),
  );
  const mapped = mapAdminPackage(row, typeMap);

  return c.json({ data: mapped }, input.id ? 200 : 201);
});

// PATCH /admin/check-types/:id/active
app.patch(
  "/check-types/:id/active",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", z.object({ is_active: z.boolean() })),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json({ error: "Admin client not available" }, 500);
    }

    const { id } = c.req.valid("param");
    const { is_active } = c.req.valid("json");

    const { error } = await supabaseAdmin
      .schema("core")
      .from("background_check_types")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      return c.json({ error: "Failed to update", message: error.message }, 500);
    }
    return c.json({ data: { success: true } });
  },
);

// PATCH /admin/packages/:id/active
app.patch(
  "/packages/:id/active",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", z.object({ is_active: z.boolean() })),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json({ error: "Admin client not available" }, 500);
    }

    const { id } = c.req.valid("param");
    const { is_active } = c.req.valid("json");

    const { error } = await supabaseAdmin
      .schema("core")
      .from("background_check_packages")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      return c.json({ error: "Failed to update", message: error.message }, 500);
    }
    return c.json({ data: { success: true } });
  },
);

// ---------------------------------------------------------------------------
// Admin checks, disputes, metrics, access log (for AdminBackgroundChecksPage)
// ---------------------------------------------------------------------------

/** Shape the email lookup needs. Kept loose to match the other API libs: this
 *  runs under Deno with an untyped Supabase client (see #477). */
// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

/**
 * Emails for a set of user ids, from `auth.users`.
 *
 * These routes used to select `email` directly off `core.users`, which has no
 * such column — email lives in `auth.users`. PostgREST reported it as
 * `column users_1.email does not exist` and every admin background-check
 * endpoint returned 500, so the admin screening queue could never load a row
 * (#635).
 *
 * Dropping the field would have been the smaller change, but an admin
 * reviewing a screening needs to be able to contact the subject, and
 * `AdminCheckWorker` in the SDK declares `email` — so the shape is preserved
 * and the value fetched from where it actually lives.
 *
 * One extra round trip per request rather than per row: ids are collected
 * first and looked up in a single `in` query. Requires the service-role
 * client; `auth.users` is not reachable through a request-scoped one.
 */
async function emailsByUserId(
  supabaseAdmin: SupabaseLike,
  ids: Array<string | null | undefined>,
): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  // The Admin Auth API, not a PostgREST query: the `auth` schema is not
  // exposed through PostgREST, so `.schema("auth").from("users")` fails and
  // every email comes back null — a quieter version of the same bug.
  //
  // `getUserById` per id rather than `listUsers`, which is the pattern in
  // routes/auth.ts: that one pages through EVERY user in the project to find
  // one address. Here the ids are already known and bounded by the page size,
  // so targeted lookups are both cheaper and correct as the user table grows.
  const entries = await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
      if (error) {
        // A missing email is a degraded row, not a failed request: the queue
        // is still usable without it, and failing the whole call would
        // reintroduce exactly the outage this fixes.
        console.error(`Failed to resolve email for ${id}:`, error.message);
        return [id, null] as const;
      }
      return [id, (data?.user?.email as string | undefined) ?? null] as const;
    }),
  );

  return new Map(entries);
}

function mapWorker(rec: Record<string, unknown> | null, email: string | null = null) {
  if (!rec) return null;
  return {
    id: rec.id ?? null,
    display_name: rec.display_name ?? null,
    username: rec.username ?? null,
    // Passed in, not read off `rec`: `core.users` has no email column (#635).
    email,
    avatar_path: (rec as { avatar_path?: string | null }).avatar_path ?? null,
  };
}

function mapOrganization(rec: Record<string, unknown> | null) {
  if (!rec) return null;
  return {
    id: (rec as { id?: string | null }).id ?? null,
    name: (rec as { name?: string | null }).name ?? null,
  };
}

function mapPackage(rec: Record<string, unknown> | null) {
  if (!rec) return null;
  return {
    id: (rec as { id?: string | null }).id ?? null,
    display_name: (rec as { display_name?: string | null }).display_name ??
      null,
    slug: (rec as { slug?: string | null }).slug ?? null,
  };
}

// GET /checks
app.get(
  "/checks",
  zValidator(
    "query",
    z.object({
      status: z.string().optional(),
      limit: z.coerce.number().int().positive().max(200).optional().default(50),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }).optional(),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json(
        { error: "Admin client not available" },
        500,
      );
    }

    const input = c.req.valid("query") ?? {};
    let query = supabaseAdmin
      .schema("core")
      .from("background_checks")
      .select(`
      id, status, user_id, organization_id, job_id, requested_by_user_id,
      summary, findings, status_history, created_at, updated_at, invited_at, completed_at, expires_at,
      package:background_check_packages(id, display_name, slug),
      worker:users!background_checks_user_id_fkey(id, display_name, username, avatar_path),
      organization:organizations!background_checks_organization_id_fkey(id, name),
      requester:users!background_checks_requested_by_user_id_fkey(id, display_name)
    `)
      .order("created_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.status) query = query.eq("status", input.status);

    const { data, error } = await query;
    if (error) {
      return c.json({
        error: "Failed to fetch checks",
        message: error.message,
      }, 500);
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const emails = await emailsByUserId(supabaseAdmin, [
      ...rows.map((row) => row.user_id as string | null),
      ...rows.map((row) => row.requested_by_user_id as string | null),
    ]);

    const items = rows.map((row: Record<string, unknown>) => {
      const worker = row.worker as Record<string, unknown> | null;
      const org = row.organization as Record<string, unknown> | null;
      const requester = row.requester as Record<string, unknown> | null;
      return {
        id: row.id,
        status: row.status,
        user_id: row.user_id,
        organization_id: row.organization_id,
        job_id: row.job_id,
        requested_by_user_id: row.requested_by_user_id,
        summary: row.summary ?? null,
        findings: row.findings ?? null,
        status_history: row.status_history ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        invited_at: row.invited_at ?? null,
        completed_at: row.completed_at ?? null,
        expires_at: row.expires_at ?? null,
        package: mapPackage(row.package as Record<string, unknown> | null),
        worker: mapWorker(worker, emails.get(row.user_id as string) ?? null),
        organization: mapOrganization(org),
        requester: requester
          ? {
            id: requester.id ?? null,
            display_name: requester.display_name ?? null,
            email: emails.get(row.requested_by_user_id as string) ?? null,
          }
          : null,
      };
    });
    return c.json({ data: items });
  },
);

// GET /checks/:id
app.get(
  "/checks/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json(
        { error: "Admin client not available" },
        500,
      );
    }

    const { id } = c.req.valid("param");

    const { data: checkRecord, error: checkError } = await supabaseAdmin
      .schema("core")
      .from("background_checks")
      .select(`
      id, status, status_history, package_id, check_type_ids, provider_check_id,
      summary, findings, component_statuses, metadata, created_at, updated_at, expires_at, estimated_completion_date,
      user:users!background_checks_user_id_fkey(id, display_name, username, avatar_path),
      organization:organizations!background_checks_organization_id_fkey(id, name),
      package:background_check_packages(id, display_name, slug)
    `)
      .eq("id", id)
      .maybeSingle();

    if (checkError) {
      return c.json({
        error: "Failed to fetch check",
        message: checkError.message,
      }, 500);
    }
    if (!checkRecord) {
      return c.json({
        error: "Check not found",
        message: "Background check not found",
      }, 404);
    }

    const { data: documents } = await supabaseAdmin
      .schema("core")
      .from("background_check_documents")
      .select(
        "id, document_type, file_path, file_name, file_size, mime_type, uploaded_at, verified",
      )
      .eq("background_check_id", id)
      .order("uploaded_at", { ascending: false });

    const { data: disputes } = await supabaseAdmin
      .schema("core")
      .from("background_check_disputes")
      .select(
        "id, status, dispute_reason, dispute_details, supporting_documents, created_at, resolved_at, resolution, resolution_notes",
      )
      .eq("background_check_id", id)
      .order("created_at", { ascending: true });

    const rec = checkRecord as Record<string, unknown>;
    const detailEmails = await emailsByUserId(supabaseAdmin, [
      rec.user_id as string | null,
    ]);
    const check = {
      ...rec,
      metadata: rec.metadata && typeof rec.metadata === "object" &&
          !Array.isArray(rec.metadata)
        ? rec.metadata
        : null,
      worker: mapWorker(
        rec.user as Record<string, unknown> | null,
        detailEmails.get(rec.user_id as string) ?? null,
      ),
      organization: mapOrganization(
        rec.organization as Record<string, unknown> | null,
      ),
    };
    delete (check as Record<string, unknown>).user;

    return c.json({
      data: {
        check,
        documents: documents ?? [],
        disputes: disputes ?? [],
      },
    });
  },
);

const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "in_progress",
    "under_review",
    "completed_clear",
    "completed_consider",
    "completed_not_clear",
    "disputed",
    "refunded",
    "cancelled",
  ]),
  summary: z.string().nullable().optional(),
  findings: z.record(z.string(), z.unknown()).nullable().optional(),
  component_statuses: z.array(z.record(z.string(), z.unknown())).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// PATCH /checks/:id/status
app.patch(
  "/checks/:id/status",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", updateStatusSchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabaseAdmin) {
      return c.json({ error: "Admin client not available" }, 500);
    }
    if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    const { data: existing, error: fetchError } = await supabaseAdmin
      .schema("core")
      .from("background_checks")
      .select(
        "status_history, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)",
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return c.json({
        error: "Failed to load check",
        message: fetchError.message,
      }, 500);
    }
    if (!existing) {
      return c.json({
        error: "Check not found",
        message: "Background check not found",
      }, 404);
    }

    const history =
      Array.isArray((existing as Record<string, unknown>).status_history)
        ? ((existing as Record<string, unknown>).status_history as unknown[])
        : [];
    history.push({
      status: input.status,
      occurred_at: new Date().toISOString(),
      actor: "admin",
      notes: input.notes ?? null,
      reviewer_user_id: user.id,
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .schema("core")
      .from("background_checks")
      .update({
        status: input.status,
        summary: input.summary ?? null,
        findings: input.findings ?? null,
        component_statuses: input.component_statuses ?? null,
        status_history: history,
        expires_at: input.expires_at ?? null,
      })
      .eq("id", id)
      .select(
        "id, status, updated_at, summary, findings, component_statuses, status_history, expires_at, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)",
      )
      .single();

    if (updateError || !updated) {
      return c.json({
        error: "Failed to update status",
        message: updateError?.message,
      }, 500);
    }
    return c.json({ data: updated });
  },
);

const updatePrivacySchema = z.object({
  share_publicly: z.boolean(),
  shared_with_organization_ids: z.array(z.string().uuid()).default([]),
});

// PATCH /checks/:id/privacy
app.patch(
  "/checks/:id/privacy",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", updatePrivacySchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json({ error: "Admin client not available" }, 500);
    }

    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    const { data: existing, error: fetchError } = await supabaseAdmin
      .schema("core")
      .from("background_checks")
      .select("metadata")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return c.json({
        error: "Failed to load check",
        message: fetchError.message,
      }, 500);
    }
    if (!existing) {
      return c.json({
        error: "Check not found",
        message: "Background check not found",
      }, 404);
    }

    const existingMetadata = (existing as Record<string, unknown>).metadata &&
        typeof (existing as Record<string, unknown>).metadata === "object" &&
        !Array.isArray((existing as Record<string, unknown>).metadata)
      ? ((existing as Record<string, unknown>).metadata as Record<
        string,
        unknown
      >)
      : {};
    const updatedPrivacy = {
      share_publicly: input.share_publicly,
      shared_with_organization_ids: input.shared_with_organization_ids,
    };
    const privacy = (existingMetadata.privacy as Record<string, unknown>) ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      privacy: { ...privacy, ...updatedPrivacy },
    };

    const { error: updateError } = await supabaseAdmin
      .schema("core")
      .from("background_checks")
      .update({ metadata: updatedMetadata })
      .eq("id", id);

    if (updateError) {
      return c.json({
        error: "Failed to update privacy",
        message: updateError.message,
      }, 500);
    }
    return c.json({ data: { privacy: updatedPrivacy } });
  },
);

const BACKGROUND_CHECK_BUCKET_ID = "background-check-documents";
const SIGNED_DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

// POST /documents/:id/download-url
app.post(
  "/documents/:id/download-url",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabaseAdmin) {
      return c.json({ error: "Admin client not available" }, 500);
    }
    if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

    const { id: documentId } = c.req.valid("param");

    const { data: document, error: fetchError } = await supabaseAdmin
      .schema("core")
      .from("background_check_documents")
      .select("file_path, file_name, background_check_id")
      .eq("id", documentId)
      .maybeSingle();

    if (fetchError) {
      return c.json({
        error: "Failed to load document",
        message: fetchError.message,
      }, 500);
    }
    if (!document) {
      return c.json({
        error: "Document not found",
        message: "Document not found",
      }, 404);
    }

    const doc = document as {
      file_path: string;
      file_name?: string | null;
      background_check_id: string;
    };
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from(BACKGROUND_CHECK_BUCKET_ID)
      .createSignedUrl(doc.file_path, SIGNED_DOWNLOAD_URL_TTL_SECONDS, {
        download: doc.file_name ?? undefined,
      });

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return c.json({
        error: "Failed to generate download URL",
        message: signedUrlError?.message,
      }, 500);
    }

    await supabaseAdmin
      .schema("core")
      .from("background_check_access_log")
      .insert({
        background_check_id: doc.background_check_id,
        accessed_by_user_id: user.id,
        access_type: "document_download",
        accessed_data: { document_id: documentId },
      });

    return c.json({
      data: {
        url: signedUrlData.signedUrl,
        expires_at: new Date(
          Date.now() + SIGNED_DOWNLOAD_URL_TTL_SECONDS * 1000,
        ).toISOString(),
      },
    });
  },
);

// GET /disputes
app.get(
  "/disputes",
  zValidator(
    "query",
    z.object({
      status: z.enum([
        "pending",
        "under_review",
        "resolved",
        "upheld",
        "cancelled",
      ]).optional(),
    }).optional(),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json(
        { error: "Admin client not available" },
        500,
      );
    }

    const input = c.req.valid("query") ?? {};
    let query = supabaseAdmin
      .schema("core")
      .from("background_check_disputes")
      .select(`
      id, background_check_id, user_id, dispute_reason, dispute_details, supporting_documents, status,
      created_at, updated_at, resolved_at, resolved_by_user_id,
      background_check:background_checks(
        id, status, user_id, summary, findings, completed_at, expires_at,
        package:background_check_packages(id, display_name, slug),
        worker:users!background_checks_user_id_fkey(id, display_name, username),
        organization:organizations!background_checks_organization_id_fkey(id, name)
      )
    `)
      .order("created_at", { ascending: false });

    if (input.status) query = query.eq("status", input.status);

    const { data, error } = await query;
    if (error) {
      return c.json({
        error: "Failed to fetch disputes",
        message: error.message,
      }, 500);
    }

    const disputeRows = (data ?? []) as Array<Record<string, unknown>>;
    // The dispute's subject is the check's worker, which the embed carries as
    // `background_check.user_id`.
    const disputeEmails = await emailsByUserId(
      supabaseAdmin,
      disputeRows.map((row) => {
        const bc = row.background_check as Record<string, unknown> | null;
        return (bc?.user_id as string | null) ?? (row.user_id as string | null);
      }),
    );

    const items = disputeRows.map((row: Record<string, unknown>) => {
      const bc = row.background_check as Record<string, unknown> | null;
      const subjectId = (bc?.user_id as string | null) ?? (row.user_id as string | null);
      return {
        id: row.id,
        background_check_id: row.background_check_id,
        user_id: row.user_id,
        dispute_reason: row.dispute_reason ?? null,
        dispute_details: row.dispute_details ?? null,
        supporting_documents: row.supporting_documents ?? null,
        status: row.status ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        resolved_at: row.resolved_at ?? null,
        resolved_by_user_id: row.resolved_by_user_id ?? null,
        background_check: bc
          ? {
            id: bc.id ?? null,
            status: bc.status ?? null,
            summary: bc.summary ?? null,
            findings: bc.findings ?? null,
            completed_at: bc.completed_at ?? null,
            expires_at: bc.expires_at ?? null,
            package: mapPackage(bc.package as Record<string, unknown> | null),
            worker: mapWorker(
              bc.worker as Record<string, unknown> | null,
              subjectId ? (disputeEmails.get(subjectId) ?? null) : null,
            ),
            organization: mapOrganization(
              bc.organization as Record<string, unknown> | null,
            ),
          }
          : null,
      };
    });
    return c.json({ data: items });
  },
);

const resolveDisputeSchema = z.object({
  status: z.enum(["resolved", "upheld", "cancelled"]),
  resolution: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
});

// PATCH /disputes/:id/resolve
app.patch(
  "/disputes/:id/resolve",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", resolveDisputeSchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabaseAdmin) {
      return c.json({ error: "Admin client not available" }, 500);
    }
    if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("background_check_disputes")
      .update({
        status: input.status,
        resolution: input.resolution ?? null,
        resolution_notes: input.resolution_notes ?? null,
        resolved_at: new Date().toISOString(),
        resolved_by_user_id: user.id,
      })
      .eq("id", id)
      .select("id, status, resolved_at, resolution, resolution_notes")
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to resolve dispute",
        message: error?.message,
      }, 500);
    }
    return c.json({ data });
  },
);

// GET /metrics
app.get("/metrics", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) {
    return c.json({ error: "Admin client not available" }, 500);
  }

  const [checksRes, disputesRes] = await Promise.all([
    supabaseAdmin
      .schema("core")
      .from("background_checks")
      .select(
        "status, created_at, completed_at, package:background_check_packages(id, display_name, slug)",
      ),
    supabaseAdmin.schema("core").from("background_check_disputes").select(
      "status",
    ),
  ]);

  const checks = checksRes.data ?? [];
  const disputes = disputesRes.data ?? [];

  const statusTotals: Record<string, number> = {};
  const packageTotals: Record<string, number> = {};
  let completedCount = 0;
  let durationSumDays = 0;

  for (const record of checks as Array<Record<string, unknown>>) {
    const status = (record.status as string) ?? "unknown";
    statusTotals[status] = (statusTotals[status] ?? 0) + 1;

    const completedAt = record.completed_at as string | null | undefined;
    const createdAt = record.created_at as string | undefined;
    if (completedAt && createdAt) {
      const createdMs = new Date(createdAt).getTime();
      const completedMs = new Date(completedAt).getTime();
      if (
        !Number.isNaN(createdMs) && !Number.isNaN(completedMs) &&
        completedMs >= createdMs
      ) {
        durationSumDays += (completedMs - createdMs) / (1000 * 60 * 60 * 24);
        completedCount += 1;
      }
    }

    const pkg = record.package as Record<string, unknown> | null;
    const label = pkg?.display_name ?? pkg?.slug ?? "Uncategorized Package";
    packageTotals[label] = (packageTotals[label] ?? 0) + 1;
  }

  const disputeTotals: Record<string, number> = {};
  for (const record of disputes as Array<Record<string, unknown>>) {
    const status = (record.status as string) ?? "unknown";
    disputeTotals[status] = (disputeTotals[status] ?? 0) + 1;
  }

  const averageCompletionDays = completedCount > 0
    ? +(durationSumDays / completedCount).toFixed(1)
    : null;

  return c.json({
    data: {
      totals: {
        checks: checks.length,
        under_review: statusTotals["under_review"] ?? 0,
        disputed: statusTotals["disputed"] ?? 0,
        completed: (statusTotals["completed_clear"] ?? 0) +
          (statusTotals["completed_consider"] ?? 0) +
          (statusTotals["completed_not_clear"] ?? 0),
      },
      disputes: {
        pending: disputeTotals["pending"] ?? 0,
        under_review: disputeTotals["under_review"] ?? 0,
        resolved: disputeTotals["resolved"] ?? 0,
        upheld: disputeTotals["upheld"] ?? 0,
      },
      averageCompletionDays,
      packageDistribution: Object.entries(packageTotals).map((
        [label, count],
      ) => ({ label, count })),
    },
  });
});

// GET /access-log
app.get(
  "/access-log",
  zValidator(
    "query",
    z.object({
      limit: z.coerce.number().int().positive().max(500).optional().default(
        200,
      ),
    }).optional(),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) {
      return c.json(
        { error: "Admin client not available" },
        500,
      );
    }

    const input = c.req.valid("query") ?? {};
    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("background_check_access_log")
      .select(`
      id, background_check_id, accessed_by_user_id, access_type, accessed_at, ip_address, user_agent,
      background_check:background_checks(
        id, status,
        package:background_check_packages(id, display_name, slug),
        worker:users!background_checks_user_id_fkey(id, display_name, username)
      ),
      actor:users!background_check_access_log_accessed_by_user_id_fkey(id, display_name, username)
    `)
      .order("accessed_at", { ascending: false })
      .limit(input.limit);

    if (error) {
      return c.json({
        error: "Failed to fetch access log",
        message: error.message,
      }, 500);
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => {
      const bc = row.background_check as Record<string, unknown> | null;
      const actor = row.actor as Record<string, unknown> | null;
      const pkg = bc?.package as Record<string, unknown> | null;
      const worker = bc?.worker as Record<string, unknown> | null;
      const packageName = pkg?.display_name ?? pkg?.slug ?? null;
      const workerName = worker?.display_name ??
        worker?.username ??
        (worker?.id ? `User ${(worker.id as string).slice(0, 8)}` : null);
      const actorName = actor?.display_name ??
        actor?.username ??
        (actor?.id
          ? `User ${(actor.id as string).slice(0, 8)}`
          : "Administrator");
      return {
        id: row.id,
        background_check_id: row.background_check_id,
        accessed_by_user_id: row.accessed_by_user_id,
        access_type: row.access_type,
        accessed_at: row.accessed_at,
        ip_address: row.ip_address ?? null,
        user_agent: row.user_agent ?? null,
        background_check: bc
          ? {
            id: bc.id ?? null,
            status: bc.status ?? null,
            package_name: packageName,
            worker_name: workerName,
          }
          : null,
        actor: actor
          ? {
            id: actor.id ?? null,
            name: actorName,
            email: actor.email ?? null,
          }
          : null,
      };
    });
    return c.json({ data: items });
  },
);

export default app;
