import { Sparkles } from '@tamagui/lucide-icons'
import { Progress, Text, XStack, YStack } from 'tamagui'

interface SkillCompletionProgressProps {
  /** Current skill count */
  skillCount: number
  /** Whether minimum skills threshold is met */
  hasMinimumSkills: boolean
  /** Completion percentage (0-100) */
  completionPercent: number
}

/**
 * Skill Completion Progress Component
 * Displays skill completion progress and messaging
 */
export function SkillCompletionProgress({
  skillCount,
  hasMinimumSkills,
  completionPercent,
}: SkillCompletionProgressProps) {
  return (
    <YStack p="$4" gap="$3" bg="$blue2" borderWidth={1} borderColor="$blue5" rounded="$4">
      <XStack gap="$3" items="center">
        <Sparkles size={20} color="$blue10" />
        <YStack gap="$1" flex={1}>
          <Text fontWeight="600" color="$blue11">
            {hasMinimumSkills
              ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
              : 'Experts recommend adding at least 5 skills to your profile.'}
          </Text>
          <Text fontSize="$2" color="$blue11">
            Add role-specific, safety, and leadership skills to improve your match rate.
          </Text>
        </YStack>
      </XStack>

      <YStack gap="$2">
        <XStack justify="space-between" items="center">
          <Text fontSize="$2" color="$blue11">
            Skill section completeness
          </Text>
          <Text fontSize="$2" fontWeight="600" color="$blue11">
            {completionPercent}%
          </Text>
        </XStack>
        <Progress value={completionPercent} max={100} bg="$blue3" size="$2">
          <Progress.Indicator bg={completionPercent >= 100 ? '$green10' : '$blue9'} />
        </Progress>
      </YStack>
    </YStack>
  )
}

