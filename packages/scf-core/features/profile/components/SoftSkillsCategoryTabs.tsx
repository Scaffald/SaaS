import type { FC } from 'react'
import { Tabs } from '@scaffald/ui'

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
    <Tabs
      value={activeCategory}
      onValueChange={(value) => {
        onCategoryChange(value as SoftSkillCategory)
      }}
      type="line"
      orientation="horizontal"
    >
      {categories.map((category) => (
        <Tabs.Item key={category} value={category}>
          <Tabs.Trigger>{CATEGORY_LABELS[category]}</Tabs.Trigger>
        </Tabs.Item>
      ))}
    </Tabs>
  )
}
