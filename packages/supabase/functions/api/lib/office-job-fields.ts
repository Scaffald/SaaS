/**
 * Everything the office job form edits beyond the basics, and the join tables
 * behind its pickers (#1342).
 *
 * POST/PATCH /v1/office/jobs used to validate the body against schemas that
 * listed ten fields. zod strips unknown keys, so the rest of the form (address,
 * screening, hiring team, metadata, requirements, compensation, skills,
 * certificates, teams) was dropped without an error on every save.
 */

import { z } from "zod";

// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type SupabaseLike = any;

const text = (max = 2000) => z.string().max(max).nullable().optional();
const flag = z.boolean().nullable().optional();
const timestamp = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Must be a date-time")
  .nullable()
  .optional();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, "Must be a date (YYYY-MM-DD)")
  .transform((v) => v.slice(0, 10))
  .nullable()
  .optional();
const uuidList = z.array(z.string().uuid()).max(200).optional();

/** Columns of core.jobs the form edits, other than the ten basic fields. */
export const jobDetailFieldsSchema = z.object({
  address: z
    .object({
      street: z.string().max(500).optional(),
      city: z.string().max(200).optional(),
      state: z.string().max(100).optional(),
      zip: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .nullable()
    .optional(),

  // Hiring team
  hiring_manager_id: z.string().uuid().nullable().optional(),
  recruiter_id: z.string().uuid().nullable().optional(),

  // Application screening
  require_current_location: flag,
  require_relocation_willingness: flag,
  minimum_years_experience: z.number().int().min(0).max(60).nullable()
    .optional(),
  require_work_authorization: flag,
  require_earliest_start_date: flag,

  // Auto-rejection and score
  enable_auto_reject: flag,
  auto_reject_criteria: z
    .object({
      score_minimum: z.number().int().min(0).max(100).optional(),
      require_work_authorization: z.boolean().optional(),
      require_all_skills: z.boolean().optional(),
      require_all_certifications: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  minimum_score: z.number().int().min(0).max(100).nullable().optional(),

  // Metadata
  internal_job_code: text(200),
  department: text(200),
  cost_center: text(200),
  number_of_openings: z.number().int().positive().nullable().optional(),
  priority_level: z.enum(["urgent", "high", "normal", "low"]).nullable()
    .optional(),
  requisition_number: text(200),
  job_category: text(200),
  is_confidential: flag,
  application_deadline: timestamp,
  target_start_date: date,
  estimated_hire_date: date,
  scheduled_publish_at: timestamp,

  // Requirements
  minimum_education_level: z
    .enum(["none", "high_school", "associate", "bachelor", "master", "phd"])
    .nullable()
    .optional(),
  require_background_check: flag,
  background_check_type: text(200),
  require_drug_test: flag,
  require_drivers_license: flag,
  drivers_license_type: text(100),
  security_clearance_required: text(200),
  travel_percentage: z.number().int().min(0).max(100).nullable().optional(),
  shift_requirements: text(),

  // Compensation and benefits
  benefits_summary: text(5000),
  has_bonus_structure: flag,
  bonus_details: text(),
  has_equity: flag,
  equity_details: text(),
  sign_on_bonus_cents: z.number().int().min(0).nullable().optional(),
  has_relocation_package: flag,
  relocation_package_details: text(),
  overtime_eligible: flag,
  pay_frequency: z
    .enum(["hourly", "weekly", "biweekly", "semimonthly", "monthly"])
    .nullable()
    .optional(),

  // Application process
  requires_assessment: flag,
  assessment_details: text(),
  requires_video_interview: flag,
  estimated_application_time_minutes: z.number().int().positive().nullable()
    .optional(),
  application_expiry_days: z.number().int().positive().nullable().optional(),
  inquiry_capability_questions: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        label: z.string().min(1).max(500),
        type: z.enum(["boolean", "number", "text"]),
        unit: z.string().max(50).optional(),
        required: z.boolean(),
      }),
    )
    .max(50)
    .nullable()
    .optional(),

  // Location and scheduling
  relocation_assistance_offered: flag,
  relocation_assistance_details: text(),
  work_schedule_details: text(),
  timezone: text(100),

  // Distribution and visibility
  is_featured: flag,
  featured_until: timestamp,
  seo_keywords: z.array(z.string().max(100)).max(50).nullable().optional(),
  external_application_url: z.string().url().max(2000).nullable().optional(),

  // Compliance and analytics
  eeo_job_category: text(200),
  is_veteran_friendly: flag,
  is_disability_friendly: flag,
  affirmative_action_plan: flag,
  source_tracking_enabled: flag,

  // Soft skills (the column is NOT NULL; null means "none")
  required_soft_skills: z
    .array(
      z.object({
        skill_id: z.string().max(200),
        importance: z.number().min(0).max(10),
      }),
    )
    .max(50)
    .nullable()
    .optional(),
});

/** The join tables behind the form's pickers. Omitted = leave unchanged. */
export const jobRelationFieldsSchema = z.object({
  /** CSI MasterFormat ids (data.masterformat), saved as required skills. */
  skill_ids: uuidList,
  /** CSI MasterFormat ids saved as optional skills (is_required = false). */
  optional_skill_ids: uuidList,
  /** data.certifications ids (migration 394), saved as required. */
  certification_ids: uuidList,
  /** core.teams ids in the job's organisation. */
  team_ids: uuidList,
  primary_team_id: z.string().uuid().nullable().optional(),
});

export type JobDetailFields = z.infer<typeof jobDetailFieldsSchema>;
export type JobRelationFields = z.infer<typeof jobRelationFieldsSchema>;

const DETAIL_KEYS = Object.keys(jobDetailFieldsSchema.shape) as Array<
  keyof JobDetailFields
>;

/** The detail fields present in `input`, ready for an insert or update. */
export function jobDetailColumns(
  input: JobDetailFields,
): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  for (const key of DETAIL_KEYS) {
    if (input[key] !== undefined) columns[key] = input[key];
  }
  if (columns.required_soft_skills === null) columns.required_soft_skills = [];
  return columns;
}

export type RelationCheck =
  | { ok: true; teamColumns: Record<string, unknown> }
  | { ok: false; message: string };

async function missingIds(
  query: Promise<{ data: Array<{ id: string }> | null; error: unknown }>,
  ids: string[],
): Promise<string[] | null> {
  const { data, error } = await query;
  if (error) return null;
  const found = new Set((data ?? []).map((row) => row.id));
  return ids.filter((id) => !found.has(id));
}

/**
 * Checks every id in the relation fields before anything is written, so a bad
 * id is a 400 rather than a job saved without its skills. Also returns the
 * core.jobs team columns (assigned_team_id, team_ids) to keep in step with
 * core.job_team_assignments.
 */
export async function checkJobRelations(
  admin: SupabaseLike,
  organizationId: string,
  input: JobRelationFields,
): Promise<RelationCheck> {
  const skillIds = [
    ...new Set([
      ...(input.skill_ids ?? []),
      ...(input.optional_skill_ids ?? []),
    ]),
  ];
  if (skillIds.length > 0) {
    const missing = await missingIds(
      admin.schema("data").from("masterformat").select("id").in("id", skillIds),
      skillIds,
    );
    if (missing === null) {
      return { ok: false, message: "Could not check the skills" };
    }
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Unknown skill ids (not CSI MasterFormat): ${
          missing.join(", ")
        }`,
      };
    }
  }

  const certIds = [...new Set(input.certification_ids ?? [])];
  if (certIds.length > 0) {
    const missing = await missingIds(
      admin.schema("data").from("certifications").select("id").in(
        "id",
        certIds,
      ),
      certIds,
    );
    if (missing === null) {
      return { ok: false, message: "Could not check the certificates" };
    }
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Unknown certification ids: ${missing.join(", ")}`,
      };
    }
  }

  const teamColumns: Record<string, unknown> = {};
  if (input.team_ids !== undefined || input.primary_team_id !== undefined) {
    const teamIds = [
      ...new Set([
        ...(input.team_ids ?? []),
        ...(input.primary_team_id ? [input.primary_team_id] : []),
      ]),
    ];
    if (teamIds.length > 0) {
      const missing = await missingIds(
        admin
          .schema("core")
          .from("teams")
          .select("id")
          .eq("organization_id", organizationId)
          .in("id", teamIds),
        teamIds,
      );
      if (missing === null) {
        return { ok: false, message: "Could not check the teams" };
      }
      if (missing.length > 0) {
        return {
          ok: false,
          message: `Teams not in this job's organization: ${
            missing.join(", ")
          }`,
        };
      }
    }
    teamColumns.team_ids = teamIds;
    teamColumns.assigned_team_id = input.primary_team_id ?? teamIds[0] ?? null;
  }

  return { ok: true, teamColumns };
}

/**
 * Replaces the job's skills, certificates and team assignments with the ones
 * in `input`. A field left undefined is left alone. Call checkJobRelations
 * first.
 */
export async function writeJobRelations(
  admin: SupabaseLike,
  job: { id: string; organization_id: string },
  userId: string,
  input: JobRelationFields,
): Promise<string | null> {
  if (input.skill_ids !== undefined || input.optional_skill_ids !== undefined) {
    const required = [...new Set(input.skill_ids ?? [])];
    const optional = [...new Set(input.optional_skill_ids ?? [])].filter((id) =>
      !required.includes(id)
    );
    const { error: clearError } = await admin
      .schema("core")
      .from("job_skills")
      .delete()
      .eq("job_id", job.id)
      .eq("skill_taxonomy", "csi");
    if (clearError) return `Failed to update skills: ${clearError.message}`;
    const rows = [
      ...required.map((id, i) => ({ id, isRequired: true, order: i })),
      ...optional.map((id, i) => ({
        id,
        isRequired: false,
        order: required.length + i,
      })),
    ].map(({ id, isRequired, order }) => ({
      job_id: job.id,
      skill_taxonomy: "csi",
      csi_skill_id: id,
      is_required: isRequired,
      priority_order: order,
    }));
    if (rows.length > 0) {
      const { error } = await admin.schema("core").from("job_skills").insert(
        rows,
      );
      if (error) return `Failed to save skills: ${error.message}`;
    }
  }

  if (input.certification_ids !== undefined) {
    const certIds = [...new Set(input.certification_ids)];
    const { error: clearError } = await admin
      .schema("core")
      .from("job_certifications")
      .delete()
      .eq("job_id", job.id);
    if (clearError) {
      return `Failed to update certificates: ${clearError.message}`;
    }
    if (certIds.length > 0) {
      const { error } = await admin
        .schema("core")
        .from("job_certifications")
        .insert(certIds.map((certification_id) => ({
          job_id: job.id,
          certification_id,
          is_required: true,
        })));
      if (error) return `Failed to save certificates: ${error.message}`;
    }
  }

  if (input.team_ids !== undefined || input.primary_team_id !== undefined) {
    const primary = input.primary_team_id ?? null;
    const teamIds = [
      ...new Set([...(input.team_ids ?? []), ...(primary ? [primary] : [])]),
    ];
    const { error: clearError } = await admin
      .schema("core")
      .from("job_team_assignments")
      .delete()
      .eq("job_id", job.id);
    if (clearError) return `Failed to update teams: ${clearError.message}`;
    if (teamIds.length > 0) {
      const effectivePrimary = primary ?? teamIds[0];
      const { error } = await admin
        .schema("core")
        .from("job_team_assignments")
        .insert(teamIds.map((team_id) => ({
          job_id: job.id,
          team_id,
          organization_id: job.organization_id,
          assigned_by: userId,
          is_primary: team_id === effectivePrimary,
        })));
      if (error) return `Failed to save teams: ${error.message}`;
    }
  }

  return null;
}

/** The job's skills, certificates and teams, with names, for the edit form. */
export async function readJobRelations(admin: SupabaseLike, jobId: string) {
  const [skills, certs, teams] = await Promise.all([
    admin
      .schema("core")
      .from("job_skills")
      .select("csi_skill_id, is_required, priority_order")
      .eq("job_id", jobId)
      .eq("skill_taxonomy", "csi")
      .order("priority_order", { ascending: true }),
    admin
      .schema("core")
      .from("job_certifications")
      .select("certification_id, is_required")
      .eq("job_id", jobId),
    admin
      .schema("core")
      .from("job_team_assignments")
      .select("team_id, is_primary")
      .eq("job_id", jobId),
  ]);

  const skillRows = (skills.data ?? []) as Array<
    { csi_skill_id: string; is_required: boolean | null }
  >;
  const certRows = (certs.data ?? []) as Array<{ certification_id: string }>;
  const teamRows = (teams.data ?? []) as Array<
    { team_id: string; is_primary: boolean }
  >;

  const [skillNames, certNames] = await Promise.all([
    skillRows.length
      ? admin
        .schema("data")
        .from("masterformat")
        .select("id, name, code_display")
        .in("id", skillRows.map((r) => r.csi_skill_id))
      : Promise.resolve({ data: [] }),
    certRows.length
      ? admin
        .schema("data")
        .from("certifications")
        .select("id, title")
        .in("id", certRows.map((r) => r.certification_id))
      : Promise.resolve({ data: [] }),
  ]);

  const skillById = new Map(
    ((skillNames.data ?? []) as Array<
      { id: string; name: string; code_display: string | null }
    >).map((s) => [s.id, s]),
  );
  const certById = new Map(
    ((certNames.data ?? []) as Array<{ id: string; title: string }>).map((
      c,
    ) => [c.id, c]),
  );

  return {
    skills: skillRows.map((r) => ({
      id: r.csi_skill_id,
      name: skillById.get(r.csi_skill_id)?.name ?? r.csi_skill_id,
      code: skillById.get(r.csi_skill_id)?.code_display ?? null,
      is_required: r.is_required !== false,
    })),
    certifications: certRows.map((r) => ({
      id: r.certification_id,
      name: certById.get(r.certification_id)?.title ?? r.certification_id,
    })),
    team_ids: teamRows.map((r) => r.team_id),
    primary_team_id: teamRows.find((r) => r.is_primary)?.team_id ?? null,
  };
}
