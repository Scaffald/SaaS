import type { SkillSuggestion } from '../../constants/skill-guidance'
import { Button, Text, XStack, YStack } from 'tamagui'

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
export function SkillGuidanceWidget({
  industryDisplayName,
  skillGuidance,
  onSuggestionSelect,
}: SkillGuidanceWidgetProps) {
  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <Text fontWeight="600">Commonly added skills in {industryDisplayName}:</Text>
        <XStack gap="$2" flexWrap="wrap">
          {skillGuidance.recommended.map((suggestion) => (
            <Button
              key={suggestion.label}
              size="$2"
              variant="outlined"
              borderColor="$blue6"
              bg="$blue1"
              onPress={() => onSuggestionSelect(suggestion)}
            >
              {suggestion.label}
            </Button>
          ))}
        </XStack>
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Users in {industryDisplayName} often add:</Text>
        <XStack gap="$2" flexWrap="wrap">
          {skillGuidance.examples.map((suggestion) => (
            <Button
              key={suggestion.label}
              size="$2"
              variant="outlined"
              bg="$color2"
              onPress={() => onSuggestionSelect(suggestion)}
            >
              {suggestion.label}
            </Button>
          ))}
        </XStack>
      </YStack>

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

