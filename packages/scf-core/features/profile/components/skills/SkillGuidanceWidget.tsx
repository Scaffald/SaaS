import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  // Don't render if there are no tips
  if (skillGuidance.tips.length === 0) {
    return null
  }

  return (
    <Stack gap={12}>
      <Stack gap={4}>
        {skillGuidance.tips.map((tip) => (
          <Text key={tip} style={{ color: colors.text[t].secondary }}>
            • {tip}
          </Text>
        ))}
      </Stack>
    </Stack>
  )
}
