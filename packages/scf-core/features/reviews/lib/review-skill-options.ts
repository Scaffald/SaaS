/**
 * What the review wizard asks a reviewer to rate and tag.
 *
 * The wizard used to rate everyone on the same three trades (Framing,
 * Electrical Wiring, Plumbing) and tag them from hardcoded soft-skill lists
 * with made-up ids, whoever was being reviewed (#1247). The trades now come
 * from the subject's own skills and the tags from the core.soft_skills
 * catalog the API already serves, so an id stored in a draft names something
 * real. Kept free of React Native so vitest can load it.
 */

export interface RatableSkill {
  id: string
  name: string
}

export interface TaggableSkill {
  id: string
  name: string
  category: string
}

/** The fields of an enriched user skill (GET /user-profiles/:id/skills) used here. */
export interface SubjectSkillLike {
  id: string
  skill_details?: { name?: string | null } | null
}

/** The fields of a core.soft_skills row used here. */
export interface SoftSkillLike {
  id: string
  name: string
  category: string
  order_index?: number | null
}

/**
 * The subject's own skills, as the rows the first step rates. Keyed by the
 * user_skills row, so a rating belongs to that person's listed skill. A row
 * whose taxonomy entry has no name is left out rather than shown blank.
 */
export function ratableSkillsFromSubject(
  skills: readonly SubjectSkillLike[] | null | undefined
): RatableSkill[] {
  const seen = new Set<string>()
  const out: RatableSkill[] = []
  for (const skill of skills ?? []) {
    const name = skill.skill_details?.name?.trim()
    if (!name || seen.has(skill.id)) continue
    seen.add(skill.id)
    out.push({ id: skill.id, name })
  }
  return out
}

/**
 * One category of the soft-skill catalog, in catalog order. The response of
 * GET /reviews/soft-skills/by-category is already ordered, but the order is
 * re-applied so the chips do not depend on that.
 */
export function softSkillsInCategory(
  byCategory: Readonly<Record<string, readonly SoftSkillLike[]>> | null | undefined,
  category: string
): TaggableSkill[] {
  const rows = byCategory?.[category] ?? []
  return [...rows]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((row) => ({ id: row.id, name: row.name, category: row.category }))
}
