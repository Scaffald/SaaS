/**
 * Helper utilities for working with polymorphic skills
 */

/**
 * Transform polymorphic job skills from database format to API format
 * Returns just IDs and taxonomy - names can be looked up separately if needed
 */
interface JobSkillRecord {
  skill_taxonomy?: string
  csi_skill_id?: string | null
  onet_occupation_id?: string | null
}

export function transformJobSkills(jobSkills: unknown[]): Array<{
  id: string
  taxonomy: 'csi' | 'onet'
}> {
  if (!Array.isArray(jobSkills)) {
    return []
  }

  return jobSkills
    .map((js: unknown) => {
      const skill = js as JobSkillRecord
      if (!skill.skill_taxonomy) return null

      if (skill.skill_taxonomy === 'csi' && skill.csi_skill_id) {
        return {
          id: skill.csi_skill_id,
          taxonomy: 'csi' as const,
        }
      }

      if (skill.skill_taxonomy === 'onet' && skill.onet_occupation_id) {
        return {
          id: skill.onet_occupation_id,
          taxonomy: 'onet' as const,
        }
      }

      return null
    })
    .filter(
      (
        skill
      ): skill is {
        id: string
        taxonomy: 'csi' | 'onet'
      } => skill !== null && skill.id !== ''
    )
}

/**
 * Get the select string for polymorphic job skills
 * Note: Use this in string concatenation, not template literals
 */
export const JOB_SKILLS_SELECT = `job_skills(
  skill_taxonomy,
  csi_skill_id,
  onet_occupation_id
)`
