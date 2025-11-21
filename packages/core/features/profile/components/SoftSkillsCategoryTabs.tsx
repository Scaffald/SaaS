import { type FC, useMemo } from 'react'
import { Tab, TabGroup } from '@app/ui'
import { Text, View, XStack } from 'tamagui'

export type SoftSkillCategory = 'reliability' | 'collaboration' | 'professionalism' | 'technical'

export interface SoftSkill {
  id: string
  name: string
  category: SoftSkillCategory
  selfRating: number
  peerRating?: number
  versionHistory?: Array<{ version: number; rating: number; date: string }>
}

export interface SoftSkillsCategoryTabsProps {
  activeCategory: SoftSkillCategory
  onCategoryChange: (category: SoftSkillCategory) => void
  skills: SoftSkill[]
}

const CATEGORY_LABELS: Record<SoftSkillCategory, string> = {
  reliability: 'Reliability',
  collaboration: 'Collaboration',
  professionalism: 'Professionalism',
  technical: 'Technical',
}

/**
 * SoftSkillsCategoryTabs component
 *
 * Category-based tab navigation for soft skills organized by category.
 * Shows completion counts (e.g., "5/7") for each category tab.
 *
 * @param activeCategory - Currently active category
 * @param onCategoryChange - Callback when category changes
 * @param skills - Array of all soft skills
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <SoftSkillsCategoryTabs
 *   activeCategory="reliability"
 *   onCategoryChange={(cat) => setCategory(cat)}
 *   skills={allSkills}
 * />
 * ```
 */
export const SoftSkillsCategoryTabs: FC<SoftSkillsCategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  skills,
}) => {
  // Calculate completion counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<SoftSkillCategory, { total: number; completed: number }> = {
      reliability: { total: 0, completed: 0 },
      collaboration: { total: 0, completed: 0 },
      professionalism: { total: 0, completed: 0 },
      technical: { total: 0, completed: 0 },
    }

    for (const skill of skills) {
      const category = skill.category
      counts[category].total += 1
      if (skill.selfRating > 0) {
        counts[category].completed += 1
      }
    }

    return counts
  }, [skills])

  const categories: SoftSkillCategory[] = ['reliability', 'collaboration', 'professionalism', 'technical']

  return (
    <TabGroup
      value={activeCategory}
      onValueChange={(value) => {
        onCategoryChange(value as SoftSkillCategory)
      }}
      ariaLabel="Soft skills categories"
      scrollable
      bordered={false}
    >
      {categories.map((category) => {
        const counts = categoryCounts[category]
        const badgeText =
          counts.total > 0 ? `${counts.completed}/${counts.total}` : undefined

        return (
          <Tab
            key={category}
            value={category}
            label={CATEGORY_LABELS[category]}
            badge={badgeText}
          />
        )
      })}
    </TabGroup>
  )
}

