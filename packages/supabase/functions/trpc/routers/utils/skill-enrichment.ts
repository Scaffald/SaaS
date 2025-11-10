import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../_shared/database.types.ts";

type DbClient = SupabaseClient<Database>;
type UserSkillRow = Database["core"]["Tables"]["user_skills"]["Row"];
type MasterformatRow = Database["data"]["Tables"]["masterformat"]["Row"];
type OnetOccupationRow = Database["onet"]["Tables"]["occupation_data"]["Row"];

export interface EnrichedUserSkill {
  id: string;
  taxonomy: "csi" | "onet";
  csiSkillId: string | null;
  onetOccupationId: string | null;
  name: string;
  code: string | null;
  displayCode: string | null;
  label: string;
  taxonomyLabel: "CSI MasterFormat" | "O*NET Occupation";
  description: string | null;
  proficiency: number;
  yearsExperience: number | null;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

const UNKNOWN_CSI_LABEL = "Unknown CSI Skill";
const UNKNOWN_ONET_LABEL = "Unknown Occupation";

const UNKNOWN_DESCRIPTION = "Metadata not available for this skill.";

function normaliseOnetCode(code: string | null | undefined): string {
  if (!code) return "";
  return code.trim();
}

export async function enrichUserSkills(
  supabase: DbClient,
  skills: UserSkillRow[] | null | undefined,
): Promise<EnrichedUserSkill[]> {
  if (!skills || skills.length === 0) {
    return [];
  }

  const csiIds = skills
    .filter((skill) => skill.skill_taxonomy === "csi" && skill.csi_skill_id)
    .map((skill) => skill.csi_skill_id as string);

  const onetIds = skills
    .filter((skill) => skill.skill_taxonomy === "onet" && skill.onet_occupation_id)
    .map((skill) => normaliseOnetCode(skill.onet_occupation_id));

  const [csiResult, onetResult] = await Promise.all([
    csiIds.length > 0
      ? supabase
        .schema("data")
        .from("masterformat")
        .select("id, code_key, code_display, name, depth")
        .in("id", csiIds)
      : Promise.resolve({ data: [] as MasterformatRow[], error: null }),
    onetIds.length > 0
      ? supabase
        .schema("onet")
        .from("occupation_data")
        .select("onetsoc_code, title, description")
        .in("onetsoc_code", onetIds)
      : Promise.resolve({ data: [] as OnetOccupationRow[], error: null }),
  ]);

  if (csiResult.error) {
    throw new Error(`Failed to load CSI skills: ${csiResult.error.message}`);
  }

  if (onetResult.error) {
    throw new Error(`Failed to load O*NET occupations: ${onetResult.error.message}`);
  }

  const csiMap = new Map<string, MasterformatRow>(
    (csiResult.data ?? []).map((row) => [row.id, row]),
  );

  const onetMap = new Map<string, OnetOccupationRow>(
    (onetResult.data ?? []).map((row) => [normaliseOnetCode(row.onetsoc_code), row]),
  );

  return skills.map((skill) => {
    const taxonomy = skill.skill_taxonomy === "csi" ? "csi" : "onet";

    if (taxonomy === "csi") {
      const csi = csiMap.get(skill.csi_skill_id ?? "");
      const name = csi?.name ?? UNKNOWN_CSI_LABEL;
      const displayCode = csi?.code_display ?? null;
      const label = displayCode ? `${displayCode} · ${name}` : name;

      return {
        id: skill.id,
        taxonomy,
        csiSkillId: skill.csi_skill_id,
        onetOccupationId: null,
        name,
        code: csi?.code_key ?? null,
        displayCode,
        label,
        taxonomyLabel: "CSI MasterFormat",
        description: csi ? `CSI division depth ${csi.depth ?? 0}` : UNKNOWN_DESCRIPTION,
        proficiency: skill.proficiency_level ?? 0,
        yearsExperience: skill.years_experience ?? null,
        verified: Boolean(skill.verified),
        verifiedAt: skill.verified_at ?? null,
        createdAt: skill.created_at,
        metadata: (skill.metadata ?? {}) as Record<string, unknown>,
      };
    }

    const onet = onetMap.get(normaliseOnetCode(skill.onet_occupation_id));
    const name = onet?.title ?? UNKNOWN_ONET_LABEL;
    const code = onet?.onetsoc_code ? normaliseOnetCode(onet.onetsoc_code) : null;
    const label = code ? `${code} · ${name}` : name;

    return {
      id: skill.id,
      taxonomy,
      csiSkillId: null,
      onetOccupationId: skill.onet_occupation_id,
      name,
      code,
      displayCode: code,
      label,
      taxonomyLabel: "O*NET Occupation",
      description: onet?.description ?? UNKNOWN_DESCRIPTION,
      proficiency: skill.proficiency_level ?? 0,
      yearsExperience: skill.years_experience ?? null,
      verified: Boolean(skill.verified),
      verifiedAt: skill.verified_at ?? null,
      createdAt: skill.created_at,
      metadata: (skill.metadata ?? {}) as Record<string, unknown>,
    };
  });
}

