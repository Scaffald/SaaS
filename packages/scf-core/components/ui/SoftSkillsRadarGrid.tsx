import { type FC, useMemo } from 'react'
import { IndividualSkillRadarChart } from '@unicornlove/beyond-ui'
import type {
  SoftSkill,
  SoftSkillCategory,
} from '@scf/core/features/profile/components/SoftSkillsCategoryTabs'
import { Text, View, Row, Stack } from '@unicornlove/beyond-ui'

export interface SoftSkillsRadarGridProps {
  skills: SoftSkill[]
  activeCategory: SoftSkillCategory
  isLoading?: boolean
  onSkillPress?: (skillId: string) => void
}

/**
 * SoftSkillsRadarGrid component
 *
 * Responsive grid layout for displaying multiple individual skill radar charts
 * organized by category with tabbed navigation.
 *
 * Features:
 * - Responsive grid: 1 column (mobile), 2-3 columns (desktop)
 * - Category-based filtering via tabs
 * - Loading and empty states
 * - Smooth transitions between categories
 *
 * @param skills - Array of all soft skills
 * @param activeCategory - Currently active category to filter
 * @param isLoading - Whether data is loading
 * @param onSkillPress - Optional callback when a skill chart is pressed
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <SoftSkillsRadarGrid
 *   skills={allSkills}
 *   activeCategory="reliability"
 *   onCategoryChange={(cat) => setCategory(cat)}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const SoftSkillsRadarGrid: FC<SoftSkillsRadarGridProps> = ({
  skills,
  activeCategory,
  isLoading = false,
  onSkillPress,
}) => {
  // Filter skills by active category
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => skill.category === activeCategory)
  }, [skills, activeCategory])

  // Loading state
  if (isLoading) {
    return (
      <Stack gap={16} padding={16}>
        <Row flexWrap="wrap" gap={12}>
          {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
            <View
              key={key}
              width="100%"
              height={200}
              backgroundColor="$color3"
              borderRadius={16}
              borderWidth={1}
              borderColor="$color5"
            >
              {/* Skeleton loader */}
            </View>
          ))}
        </Row>
      </Stack>
    )
  }

  // Empty state
  if (filteredSkills.length === 0) {
    return (
      <Stack gap={16} padding={16} align="center" justify="center" minHeight={300}>
        <Text color="gray">
          No skills in this category
        </Text>
        <Text color="gray">
          Skills will appear here once they're added to this category.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16} padding={16}>
      <Row
        flexWrap="wrap"
        gap={12}
      >
        {filteredSkills.map((skill) => (
          <View
            key={skill.id}
            width="100%"
          >
            <IndividualSkillRadarChart
              skillName={skill.name}
              selfRating={skill.selfRating}
              peerRating={skill.peerRating}
              versionHistory={skill.versionHistory}
              showTrend={skill.versionHistory && skill.versionHistory.length > 1}
              size="md"
              onPress={onSkillPress ? () => onSkillPress(skill.id) : undefined}
            />
          </View>
        ))}
      </Row>
    </Stack>
  )
}
