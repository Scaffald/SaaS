import { Sparkles } from 'lucide-react-native'
import { ProgressBar, Text, Row, Stack } from '@scaffald/ui'

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
      padding="md"
      gap={12}
      backgroundColor="$blue2"
      borderWidth={1}
      borderColor="$blue5"
      borderRadius={16}
    >
      <Row gap={12} align="center">
        <Sparkles size="lg" color="$blue10" />
        <Stack gap={4} flex={1}>
          <Text color="$blue11">
            {hasMinimumSkills
              ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
              : 'Experts recommend adding at least 5 skills to your profile.'}
          </Text>
          <Text color="$blue11">
            Add role-specific, safety, and leadership skills to improve your match rate.
          </Text>
        </Stack>
      </Row>

      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text color="$blue11">Skill section completeness</Text>
          <Text color="$blue11">{completionPercent}%</Text>
        </Row>
        <ProgressBar
          value={completionPercent}
          color={completionPercent >= 100 ? 'success' : 'primary'}
          showIndicator={false}
          showLabel={false}
          showHintMessage={false}
        />
      </Stack>
    </Stack>
  )
}
