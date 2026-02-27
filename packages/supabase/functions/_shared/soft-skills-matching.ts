/**
 * Shared soft skills matching logic for jobs.
 * Used by both tRPC jobs router and REST API.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { jobSoftSkillRequirementSchema } from './profile-schemas.ts'

export type SoftSkillRequirement = z.infer<typeof jobSoftSkillRequirementSchema>

export interface SoftSkillMetadata {
  name: string | null
  category: string | null
}

export interface SoftSkillMatchDetail {
  skillId: string
  skillName: string | null
  category: string | null
  requiredImportance: number
  userRating: number | null
  meetsRequirement: boolean | null
  contribution: number
}

const softSkillRequirementArraySchema = z.array(jobSoftSkillRequirementSchema)

export function parseRequiredSoftSkills(value: unknown): SoftSkillRequirement[] {
  if (!value) return []
  if (typeof value === 'string') {
    try {
      return parseRequiredSoftSkills(JSON.parse(value))
    } catch {
      return []
    }
  }
  const parsed = softSkillRequirementArraySchema.safeParse(value)
  return parsed.success ? parsed.data : []
}

export async function fetchSoftSkillMetadata(
  supabase: SupabaseClient,
  skillIds: string[]
): Promise<Map<string, SoftSkillMetadata>> {
  if (skillIds.length === 0) return new Map()
  const uniqueIds = Array.from(new Set(skillIds))
  const { data, error } = await supabase
    .schema('core')
    .from('soft_skills')
    .select('id, name, category')
    .in('id', uniqueIds)
  if (error) throw new Error(`Failed to load soft skills metadata: ${error.message}`)
  const map = new Map<string, SoftSkillMetadata>()
  for (const row of data ?? []) {
    if (!row.id) continue
    map.set(row.id, { name: row.name ?? null, category: row.category ?? null })
  }
  return map
}

export async function loadUserSoftSkillsForMatching(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ratings: Map<string, number>; hasAssessment: boolean }> {
  const { data: latestVersionRow, error: versionError } = await supabase
    .schema('core')
    .from('user_skills')
    .select('version')
    .eq('user_id', userId)
    .eq('skill_taxonomy', 'soft_skills')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (versionError && versionError.code !== 'PGRST116') {
    throw new Error(`Failed to load latest soft skill version: ${versionError.message}`)
  }

  const version = latestVersionRow?.version ?? null
  if (!version) return { ratings: new Map(), hasAssessment: false }

  const { data, error } = await supabase
    .schema('core')
    .from('user_skills')
    .select('soft_skill_id, proficiency_level')
    .eq('user_id', userId)
    .eq('skill_taxonomy', 'soft_skills')
    .eq('version', version)

  if (error) throw new Error(`Failed to load soft skill ratings: ${error.message}`)

  const ratings = new Map<string, number>()
  for (const row of data ?? []) {
    if (!row.soft_skill_id) continue
    if (typeof row.proficiency_level === 'number') {
      ratings.set(row.soft_skill_id, row.proficiency_level)
    }
  }
  return { ratings, hasAssessment: ratings.size > 0 }
}

export function computeSoftSkillMatch(
  requirements: SoftSkillRequirement[],
  ratings: Map<string, number>,
  metadata: Map<string, SoftSkillMetadata>
): { score: number | null; details: SoftSkillMatchDetail[] } {
  if (requirements.length === 0) return { score: null, details: [] }

  const details = requirements.map<SoftSkillMatchDetail>((req) => {
    const info = metadata.get(req.skill_id)
    const userRating = ratings.get(req.skill_id)
    const cappedRating = typeof userRating === 'number' ? Math.min(userRating, req.importance) : 0
    const contributionRatio = req.importance > 0 ? cappedRating / req.importance : 0
    return {
      skillId: req.skill_id,
      skillName: info?.name ?? null,
      category: info?.category ?? null,
      requiredImportance: req.importance,
      userRating: userRating ?? null,
      meetsRequirement: typeof userRating === 'number' ? userRating >= req.importance : null,
      contribution: Number((contributionRatio * 100).toFixed(2)),
    }
  })

  if (ratings.size === 0) return { score: null, details }
  const averageRatio =
    details.reduce((sum, detail) => sum + detail.contribution / 100, 0) / requirements.length
  return { score: Math.round(averageRatio * 100), details }
}
