import { Sparkles } from '@tamagui/lucide-icons'
import { Progress, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <Stack
      padding="$4"
      gap="$3"
      backgroundColor="$blue2"
      borderWidth={1}
      borderColor="$blue5"
      borderRadius="$4"
    >
      <Row gap="$3" alignItems="center">
        <Sparkles size={20} color="$blue10" />
        <Stack gap="$1" flex={1}>
          <Text fontWeight="600" color="$blue11">
            {hasMinimumSkills
              ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
              : 'Experts recommend adding at least 5 skills to your profile.'}
          </Text>
          <Text fontSize="$2" color="$blue11">
            Add role-specific, safety, and leadership skills to improve your match rate.
          </Text>
        </Stack>
      </Row>

      <Stack gap="$2">
        <Row justifyContent="space-between" alignItems="center">
          <Text fontSize="$2" color="$blue11">
            Skill section completeness
          </Text>
          <Text fontSize="$2" fontWeight="600" color="$blue11">
            {completionPercent}%
          </Text>
        </Row>
        <Progress value={completionPercent} max={100} backgroundColor="$blue3" size="$2">
          <Progress.Indicator backgroundColor={completionPercent >= 100 ? '$green10' : '$blue9'} />
        </Progress>
      </Stack>
    </Stack>
  )
}
