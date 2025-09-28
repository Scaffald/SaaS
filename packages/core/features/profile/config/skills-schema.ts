import { z } from 'zod'

/**
 * Skills Profile Form Schema
 * Enhanced skills management with proficiency levels
 */
export const skillsProfileSchema = z.object({
  // Skills array with proficiency
  skills: z
    .array(
      z.object({
        skill_id: z.string().uuid(),
        skill_name: z.string(),
        proficiency: z.number().min(1).max(5).default(3),
        years_experience: z.number().min(0).max(50).optional(),
        is_primary: z.boolean().default(false),
        endorsed_count: z.number().default(0).optional(),
      })
    )
    .optional(),

  // Industry focus
  primary_industry_id: z.string().uuid().optional(),
  secondary_industries: z.array(z.string().uuid()).max(3).optional(),

  // Skill categories of interest
  skill_categories: z.array(z.string()).optional(),
})

export type SkillsProfileFormData = z.infer<typeof skillsProfileSchema>

export const skillsProfileDefaults: Partial<SkillsProfileFormData> = {
  skills: [],
  primary_industry_id: undefined,
  secondary_industries: [],
  skill_categories: [],
}

// Proficiency level constants
export const PROFICIENCY_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Learning the basics' },
  { value: 2, label: 'Novice', description: 'Some experience' },
  { value: 3, label: 'Intermediate', description: 'Comfortable with most tasks' },
  { value: 4, label: 'Advanced', description: 'Highly skilled' },
  { value: 5, label: 'Expert', description: 'Industry leader' },
] as const

export const SKILL_CATEGORIES = [
  'Technical Skills',
  'Soft Skills',
  'Leadership',
  'Communication',
  'Problem Solving',
  'Project Management',
  'Safety & Compliance',
  'Equipment Operation',
  'Quality Control',
  'Training & Development',
] as const
