/**
 * Shared name/code lookups for rows in core.user_skills.
 *
 * core.user_skills stores only a taxonomy discriminator and a foreign key —
 * `csi_skill_id` into data.masterformat, or `onet_occupation_id` into
 * onet.occupation_data. Nothing human-readable. Any endpoint returning skills to
 * a client has to resolve those, and two of them were doing it independently:
 * /v1/profiles/skills/multi-taxonomy resolved them inline, while
 * /v1/profiles/widgets/skills did `select("*")` and returned raw rows whose
 * `name` and `displayCode` its own SDK type (SkillWidgetEntry) promised but
 * never contained (#603).
 *
 * The two endpoints shape their responses differently on purpose — one nests
 * under `skill_details`, the other is flat — so this shares the lookup rather
 * than the response. Sharing the lookup is what stops them drifting on the part
 * that matters: which table a taxonomy resolves against.
 */

export interface UserSkillRow {
  skill_taxonomy?: string | null;
  csi_skill_id?: string | null;
  onet_occupation_id?: string | null;
}

export interface CsiEntry {
  id: string;
  name: string;
  code_key: string;
  code_display: string;
  depth: number | null;
}

export interface OnetEntry {
  onetsoc_code: string;
  title: string;
}

export interface SkillLookups {
  csi: Map<string, CsiEntry>;
  onet: Map<string, OnetEntry>;
}

/** O*NET codes carry stray whitespace in some rows; compare them trimmed. */
export function normaliseOnetCode(code: string | null | undefined): string {
  return (code ?? "").trim();
}

/**
 * Resolve every csi/onet reference in `rows` in two queries.
 *
 * Returns empty maps rather than throwing when a lookup fails: a skill whose
 * catalog row is missing should render as an unresolved skill, not take the
 * whole profile down with it. Callers decide what to do with a miss.
 */
export async function loadSkillLookups(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  rows: UserSkillRow[],
): Promise<SkillLookups> {
  const csiIds = [
    ...new Set(
      rows
        .filter((r) => r.skill_taxonomy === "csi" && r.csi_skill_id)
        .map((r) => r.csi_skill_id as string),
    ),
  ];
  const onetIds = [
    ...new Set(
      rows
        .filter((r) => r.skill_taxonomy === "onet" && r.onet_occupation_id)
        .map((r) => normaliseOnetCode(r.onet_occupation_id))
        .filter(Boolean),
    ),
  ];

  const csi = new Map<string, CsiEntry>();
  const onet = new Map<string, OnetEntry>();

  const [csiResult, onetResult] = await Promise.all([
    csiIds.length > 0
      ? supabase
        .schema("data")
        .from("masterformat")
        .select("id, name, code_key, code_display, depth")
        .in("id", csiIds)
      : Promise.resolve({ data: [], error: null }),
    onetIds.length > 0
      ? supabase
        .schema("onet")
        .from("occupation_data")
        .select("onetsoc_code, title")
        .in("onetsoc_code", onetIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const row of (csiResult?.data ?? []) as CsiEntry[]) {
    csi.set(row.id, row);
  }
  for (const row of (onetResult?.data ?? []) as OnetEntry[]) {
    onet.set(normaliseOnetCode(row.onetsoc_code), row);
  }

  return { csi, onet };
}

export interface SkillWidgetEntry {
  id: string;
  taxonomy: "csi" | "onet";
  name: string;
  label: string;
  displayCode: string | null;
  proficiency: number;
  yearsExperience: number | null;
  verified: boolean;
  metadata: Record<string, unknown> | null;
}

/**
 * Shape a user_skills row into the flat entry the profile widgets render.
 *
 * Matches SkillWidgetEntry in packages/sdk/src/resources/profile-widgets.ts —
 * the type the widget endpoint has always been declared to return.
 */
export function toSkillWidgetEntry(
  // deno-lint-ignore no-explicit-any
  row: any,
  lookups: SkillLookups,
): SkillWidgetEntry {
  const taxonomy = row.skill_taxonomy === "onet" ? "onet" : "csi";

  let name = "";
  let displayCode: string | null = null;

  if (taxonomy === "csi" && row.csi_skill_id) {
    const entry = lookups.csi.get(row.csi_skill_id);
    if (entry) {
      name = entry.name;
      displayCode = entry.code_display;
    }
  } else if (taxonomy === "onet" && row.onet_occupation_id) {
    const code = normaliseOnetCode(row.onet_occupation_id);
    const entry = lookups.onet.get(code);
    if (entry) {
      name = entry.title;
      displayCode = code;
    }
  }

  return {
    id: row.id,
    taxonomy,
    name,
    // `label` is what the UI prints. Falling back to the code keeps an
    // unresolved skill visible instead of rendering an empty row.
    label: name || displayCode || "Unnamed skill",
    displayCode,
    proficiency: row.proficiency_level ?? 0,
    yearsExperience: row.years_experience ?? null,
    verified: Boolean(row.verified ?? row.is_verified ?? false),
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}
