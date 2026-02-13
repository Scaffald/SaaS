/**
 * Proficiency Levels Constants
 * Centralized definitions for skill proficiency levels
 */

/**
 * Proficiency level with full details
 */
export interface ProficiencyLevel {
  value: number
  label: string
  description: string
}

/**
 * All proficiency levels with details
 */
export const PROFICIENCY_LEVELS: readonly ProficiencyLevel[] = [
  { value: 1, label: 'Beginner', description: 'Learning the basics' },
  { value: 2, label: 'Novice', description: 'Some experience' },
  { value: 3, label: 'Intermediate', description: 'Comfortable with most tasks' },
  { value: 4, label: 'Advanced', description: 'Highly skilled' },
  { value: 5, label: 'Expert', description: 'Industry leader' },
] as const

/**
 * Proficiency labels map for quick lookup
 */
export const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
} as const

/**
 * Get proficiency level details by value
 */
export function getProficiencyLevel(value: number): ProficiencyLevel | undefined {
  return PROFICIENCY_LEVELS.find((level) => level.value === value)
}

/**
 * Get proficiency label by value
 */
export function getProficiencyLabel(value: number): string {
  return PROFICIENCY_LABELS[value] ?? 'Unknown'
}
