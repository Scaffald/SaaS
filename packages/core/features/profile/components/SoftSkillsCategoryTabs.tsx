import type { FC } from 'react'
import { Tab, TabGroup } from '@app/ui'

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
 * Shows soft skill categories without completion counts.
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
}) => {
  const categories: SoftSkillCategory[] = [
    'reliability',
    'collaboration',
    'professionalism',
    'technical',
  ]

  return (
    <TabGroup
      value={activeCategory}
      onValueChange={(value) => {
        onCategoryChange(value as SoftSkillCategory)
      }}
      ariaLabel="Soft skills categories"
      scrollable
      bordered={false}
      variant="underlined"
    >
      {categories.map((category) => (
        <Tab key={category} value={category} label={CATEGORY_LABELS[category]} />
      ))}
    </TabGroup>
  )
}
