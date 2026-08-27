/**
 * Office Users REST API
 * Office role required. Migrated from tRPC office user procedures.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth.ts";

const app = new Hono();
app.use("*", authMiddleware);
app.use("*", requireRole("office", "platform"));

// ============================================================================
// Schemas
// ============================================================================

const updateUserBodySchema = z.object({
  profile: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      display_name: z.string().optional(),
      bio: z.string().optional(),
    })
    .optional(),
  privateData: z
    .object({
      email: z.string().optional(),
      phone_number: z.string().optional(),
      birth_date: z.string().optional(),
      location: z.string().optional(),
      employment_status: z.string().optional(),
      job_search_status: z.string().optional(),
      years_of_experience: z.number().optional(),
      current_title: z.string().optional(),
      current_employer: z.string().optional(),
    })
    .optional(),
});

const updateUserGeneralBodySchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  about: z.string().optional(),
  avatar_path: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});

const updateUserEmploymentBodySchema = z.object({
  preferred_work_locations: z.array(z.unknown()).optional(),
  open_to_travel: z.boolean().optional(),
  travel_distance_miles: z.number().optional(),
  us_resident: z.boolean().optional(),
  us_passport: z.boolean().optional(),
  drivers_license_classes: z.array(z.string()).optional(),
  military_status: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  hourly_rate: z.number().nullable().optional(),
});

// ============================================================================
// GET / - List users
// ============================================================================

app.get("/", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");

  if (!supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: usersData, error: usersError, count } = await supabaseAdmin
    .schema("core")
    .from("users")
    .select("id, username, display_name, avatar_path, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(50);

  if (usersError) {
    return c.json({
      error: "Failed to fetch users",
      message: usersError.message,
    }, 500);
  }

  const userIds = usersData?.map((u: { id: string }) => u.id) || [];
  const { data: profilesData } = await supabaseAdmin
    .schema("core")
    .from("profile")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);

  const profilesMap = new Map(
    profilesData?.map(
      (
        p: {
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
        },
      ) => [
        p.user_id,
        p,
      ],
    ) || [],
  );

  const users = (usersData ?? []).map(
    (user: {
      id: string;
      username?: string | null;
      display_name?: string | null;
      avatar_path?: string | null;
      created_at?: string;
      updated_at?: string;
    }) => {
      const profile = profilesMap.get(user.id);
      return {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        first_name:
          (profile as { first_name?: string | null } | undefined)?.first_name ||
          "",
        last_name:
          (profile as { last_name?: string | null } | undefined)?.last_name ||
          "",
        avatar_path: user.avatar_path,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    },
  );

  return c.json({ users, total: count ?? 0 });
});

// ============================================================================
// DELETE /:id - Delete user
// ============================================================================

/**
 * Relations that block deleting a user, and cannot be resolved automatically.
 *
 * Each is a RESTRICT foreign key over content the user owns rather than a
 * pointer to them — an organization document, a task, a punchlist. Removing the
 * person should not silently remove work other people depend on, and the column
 * is NOT NULL so it cannot be released either. These need a human decision
 * (reassign or delete the content first), so the endpoint reports them instead
 * of guessing.
 */
const BLOCKING_RELATIONS: ReadonlyArray<{ table: string; column: string }> = [
  { table: "tasks", column: "created_by_user_id" },
  { table: "punchlists", column: "created_by_user_id" },
  { table: "organization_documents", column: "created_by" },
  { table: "organization_document_versions", column: "uploaded_by" },
  { table: "organization_document_shares", column: "created_by" },
  { table: "organization_folders", column: "created_by" },
  { table: "organization_locations", column: "created_by" },
];

/**
 * Verification pointers that can be released.
 *
 * These are nullable audit references — "this skill was verified by X". Once X
 * is gone, null is the honest value, and holding the deletion hostage to an
 * audit pointer would make any reviewer undeletable.
 */
const RELEASABLE_REFERENCES: ReadonlyArray<{ table: string; column: string }> = [
  { table: "work_logs", column: "verified_by_user_id" },
  { table: "user_skills", column: "verified_by" },
  { table: "skill_evidence", column: "verified_by" },
];

app.delete("/:id", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const { id } = c.req.param();

  if (!supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // This handler used to delete eight tables by hand before removing the user.
  // Six of those statements were no-ops — `.schema("core")` applies only to the
  // statement it is written on, so everything after the first addressed
  // `public`, where those tables do not exist — and no result was checked, so
  // the errors were discarded.
  //
  // They were also unnecessary. core.users cascades to user_skills,
  // user_certifications, user_education, user_experience, applications,
  // reviews, role_assignments, profile and work_logs, and auth.users cascades
  // to core.users. Deleting the auth user removes all of it.
  //
  // What the hand-written cascade did do was destroy data on a path that then
  // failed: the two statements that worked (core.user_skills, core.profile) ran
  // before the core.users delete, which is blocked by RESTRICT references for
  // any user who has verified a work log or created a task. The operator saw
  // "Failed to delete user profile" while that user's skills and personal
  // details were already gone, with no transaction to roll back.
  //
  // So the blocking check runs before anything is written, and nothing the user
  // owns is ever deleted outside the cascade. The one write that precedes the
  // delete is releasing nullable verification pointers; if the delete then
  // fails for an unrelated reason those stay released, which loses an audit
  // attribution but destroys no record and is safe to retry.

  const blocked: Array<{ table: string; count: number }> = [];
  for (const rel of BLOCKING_RELATIONS) {
    const { count, error } = await supabaseAdmin
      .schema("core")
      .from(rel.table)
      .select("*", { count: "exact", head: true })
      .eq(rel.column, id);

    // A head-count against a table that cannot be read comes back with a null
    // count and no error, so null is the failure signal — not `error`.
    if (count === null) {
      return c.json({
        error: "Failed to check whether the user can be deleted",
        message: `Could not count core.${rel.table}.${rel.column}: ${
          error?.message ?? "no count returned"
        }`,
      }, 500);
    }
    if (count > 0) blocked.push({ table: rel.table, count });
  }

  if (blocked.length > 0) {
    return c.json({
      error: "User owns content that must be reassigned first",
      message:
        "Deleting this user would remove work other people depend on. Reassign or delete it, then retry.",
      blockedBy: blocked,
    }, 409);
  }

  for (const ref of RELEASABLE_REFERENCES) {
    const { error } = await supabaseAdmin
      .schema("core")
      .from(ref.table)
      .update({ [ref.column]: null })
      .eq(ref.column, id);

    if (error) {
      return c.json({
        error: "Failed to release verification references",
        message: `core.${ref.table}.${ref.column}: ${error.message}`,
      }, 500);
    }
  }

  // Cascades: auth.users -> core.users -> the user's profile, skills,
  // education, experience, certifications, applications, work logs, reviews
  // they wrote, and role assignments.
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (authError) {
    return c.json({
      error: "Failed to delete user",
      message: authError.message,
    }, 500);
  }

  return c.json({ success: true });
});

// ============================================================================
// PATCH /:id - Update user
// ============================================================================

app.patch("/:id", zValidator("json", updateUserBodySchema), async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const { id } = c.req.param();
  const { profile, privateData } = c.req.valid("json");

  if (!supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (profile) {
    const { error: profileError } = await supabaseAdmin
      .schema("core")
      .from("users")
      .update(profile)
      .eq("id", id);

    if (profileError) {
      return c.json({
        error: "Failed to update profile",
        message: profileError.message,
      }, 500);
    }
  }

  if (privateData) {
    const { error: privateError } = await supabaseAdmin
      .schema("core")
      .from("profile")
      .update(privateData)
      .eq("user_id", id);

    if (privateError) {
      return c.json({
        error: "Failed to update private data",
        message: privateError.message,
      }, 500);
    }
  }

  return c.json({ success: true });
});

// ============================================================================
// GET /:id/general - Get user general profile (admin view)
// ============================================================================

app.get("/:id/general", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const { id } = c.req.param();

  if (!supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .schema("core")
    .from("users")
    .select("first_name, last_name, about, avatar_path")
    .eq("id", id)
    .single();

  if (profileError) {
    return c.json({
      error: "User profile not found",
      message: profileError.message,
    }, 404);
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin
    .getUserById(id);
  if (authError) {
    console.error("Error fetching auth user:", authError);
  }

  const { data: privateData } = await supabaseAdmin
    .schema("core")
    .from("profile")
    .select(
      "street_address, city, state, zip_code, country, latitude, longitude",
    )
    .eq("user_id", id)
    .single();

  return c.json({
    first_name: (profile as { first_name?: string | null }).first_name || "",
    last_name: (profile as { last_name?: string | null }).last_name || "",
    about: (profile as { about?: string | null }).about || "",
    avatar_path: (profile as { avatar_path?: string | null }).avatar_path || "",
    email: authUser?.user?.email || "",
    phone: authUser?.user?.phone || "",
    address: {
      street: (privateData as { street_address?: string | null } | null)
        ?.street_address || "",
      city: (privateData as { city?: string | null } | null)?.city || "",
      state: (privateData as { state?: string | null } | null)?.state || "",
      zip: (privateData as { zip_code?: string | null } | null)?.zip_code || "",
      country: (privateData as { country?: string | null } | null)?.country ||
        "United States",
      latitude: (privateData as { latitude?: number | null } | null)?.latitude,
      longitude: (privateData as { longitude?: number | null } | null)
        ?.longitude,
    },
  });
});

// ============================================================================
// PATCH /:id/general - Update user general profile (admin)
// ============================================================================

app.patch(
  "/:id/general",
  zValidator("json", updateUserGeneralBodySchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const { id } = c.req.param();
    const data = c.req.valid("json");

    if (!supabaseAdmin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profileUpdate: Record<string, string> = {};
    if (data.first_name) profileUpdate.first_name = data.first_name;
    if (data.last_name) profileUpdate.last_name = data.last_name;
    if (data.about !== undefined) profileUpdate.about = data.about;
    if (data.avatar_path !== undefined) {
      profileUpdate.avatar_path = data.avatar_path;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .schema("core")
        .from("users")
        .update(profileUpdate)
        .eq("id", id);

      if (profileError) {
        return c.json({
          error: "Failed to update profile",
          message: profileError.message,
        }, 500);
      }
    }

    const privateUpdate: Record<string, string | number | null> = {};
    if (data.address) {
      if (data.address.street !== undefined) {
        privateUpdate.street_address = data.address.street;
      }
      if (data.address.city !== undefined) {
        privateUpdate.city = data.address.city;
      }
      if (data.address.state !== undefined) {
        privateUpdate.state = data.address.state;
      }
      if (data.address.zip !== undefined) {
        privateUpdate.zip_code = data.address.zip;
      }
      if (data.address.country !== undefined) {
        privateUpdate.country = data.address.country;
      }
      if (data.address.latitude !== undefined) {
        privateUpdate.latitude = data.address.latitude ?? null;
      }
      if (data.address.longitude !== undefined) {
        privateUpdate.longitude = data.address.longitude ?? null;
      }
    }

    if (Object.keys(privateUpdate).length > 0) {
      const { error: privateError } = await supabaseAdmin
        .schema("core")
        .from("profile")
        .update(privateUpdate)
        .eq("user_id", id);

      if (privateError) {
        return c.json({
          error: "Failed to update private data",
          message: privateError.message,
        }, 500);
      }
    }

    return c.json({ success: true });
  },
);

// ============================================================================
// GET /:id/employment - Get user employment data (admin)
// ============================================================================

app.get("/:id/employment", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const { id } = c.req.param();

  if (!supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("profile")
    .select(
      "preferred_work_locations, open_to_travel, travel_distance_miles, us_resident, us_passport, drivers_license_classes, military_status, availability, hourly_rate",
    )
    .eq("user_id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    return c.json({
      error: "User employment data not found",
      message: error.message,
    }, 404);
  }

  return c.json({
    preferred_work_locations:
      (data as { preferred_work_locations?: unknown[] } | null)
        ?.preferred_work_locations || [],
    open_to_travel:
      (data as { open_to_travel?: boolean } | null)?.open_to_travel ?? true,
    travel_distance_miles: (data as { travel_distance_miles?: number } | null)
      ?.travel_distance_miles || 25,
    us_resident: (data as { us_resident?: boolean } | null)?.us_resident ||
      false,
    us_passport: (data as { us_passport?: boolean } | null)?.us_passport ||
      false,
    drivers_license_classes:
      (data as { drivers_license_classes?: string[] } | null)
        ?.drivers_license_classes || [],
    military_status:
      (data as { military_status?: string[] } | null)?.military_status || [],
    availability: (data as { availability?: string[] } | null)?.availability ||
      [],
    hourly_rate: (data as { hourly_rate?: number | null } | null)?.hourly_rate,
  });
});

// ============================================================================
// PATCH /:id/employment - Update user employment data (admin)
// ============================================================================

app.patch(
  "/:id/employment",
  zValidator("json", updateUserEmploymentBodySchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const { id } = c.req.param();
    const data = c.req.valid("json");

    if (!supabaseAdmin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { error } = await supabaseAdmin
      .schema("core")
      .from("profile")
      .update(data)
      .eq("user_id", id);

    if (error) {
      return c.json({
        error: "Failed to update employment data",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true });
  },
);

export default app;
