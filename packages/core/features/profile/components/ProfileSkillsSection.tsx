import { SoftSkillsComparisonWidget } from '../widgets/SoftSkillsComparisonWidget'
import { SoftSkillsRadarWidget } from '../widgets/SoftSkillsRadarWidget'
import { TechnicalSkillsWidget } from '../widgets/TechnicalSkillsWidget'
import type { ProfileWidgetProps } from '../widgets/types'
import { YStack } from 'tamagui'

/**
 * ProfileSkillsSection
 * Reusable component that displays both Soft Skills and Technical Skills widgets
 * in the correct order (Soft Skills first, then Technical Skills)
 *
 * Includes a comparison widget showing both SkillsChart and RadarChart side-by-side
 * for visual comparison of chart implementations.
 *
 * @param userId - User ID to display
 * @param showEdit - Show edit buttons for own profile
 * @param variant - Display variant (compact or full)
 */
export function ProfileSkillsSection({
  userId,
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
  return (
    <YStack gap="$4">
      <SoftSkillsComparisonWidget userId={userId} showEdit={showEdit} variant={variant} />
      <SoftSkillsRadarWidget userId={userId} showEdit={showEdit} variant={variant} />
      <TechnicalSkillsWidget userId={userId} showEdit={showEdit} variant={variant} />
    </YStack>
  )
}


