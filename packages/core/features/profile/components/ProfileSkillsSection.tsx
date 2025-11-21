import { SoftSkillsRadarWidget, TechnicalSkillsWidget } from '../widgets'
import type { ProfileWidgetProps } from '../widgets/types'
import { YStack } from 'tamagui'

/**
 * ProfileSkillsSection
 * Reusable component that displays both Soft Skills and Technical Skills widgets
 * in the correct order (Soft Skills first, then Technical Skills)
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
      <SoftSkillsRadarWidget userId={userId} showEdit={showEdit} variant={variant} />
      <TechnicalSkillsWidget userId={userId} showEdit={showEdit} variant={variant} />
    </YStack>
  )
}


