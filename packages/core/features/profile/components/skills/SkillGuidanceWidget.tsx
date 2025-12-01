import { Text, YStack } from '@unicornlove/ui'
import type { SkillSuggestion } from '../../constants/skill-guidance'

interface SkillGuidanceWidgetProps {
  /** Industry display name */
  industryDisplayName: string
  /** Skill guidance data */
  skillGuidance: {
    recommended: SkillSuggestion[]
    examples: SkillSuggestion[]
    tips: string[]
  }
  /** Callback when a suggestion is selected */
  onSuggestionSelect: (suggestion: SkillSuggestion) => void
}

/**
 * Skill Guidance Widget Component
 * Displays skill recommendations, examples, and tips for an industry
 */
export function SkillGuidanceWidget({ skillGuidance }: SkillGuidanceWidgetProps) {
  // Don't render if there are no tips
  if (skillGuidance.tips.length === 0) {
    return null
  }

  return (
    <YStack gap="$3">
      <YStack gap="$1">
        {skillGuidance.tips.map((tip) => (
          <Text key={tip} fontSize="$2" color="$color11">
            • {tip}
          </Text>
        ))}
      </YStack>
    </YStack>
  )
}
