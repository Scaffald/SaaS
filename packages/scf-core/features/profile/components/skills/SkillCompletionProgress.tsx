import { Sparkles } from 'lucide-react-native'
import { Progress, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
export function SkillCompletionProgress() {
  const { theme } = useThemeContext()
{
  skillCount,
  hasMinimumSkills,
  completionPercent,
}: SkillCompletionProgressProps) {
  return (
    <Stack
      padding="md"
      gap={12}
      style={{ backgroundColor: colors.bg[theme].info }}
      borderWidth={1}
      borderColor="$blue5"
      borderRadius={16}
    >
      <Row gap={12} align="center">
        <Sparkles size="lg" style={{ color: colors.text[theme].info }} />
        <Stack gap={4} flex={1}>
          <Text style={{ color: colors.text[theme].info }}>
            {hasMinimumSkills
              ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
              : 'Experts recommend adding at least 5 skills to your profile.'}
          </Text>
          <Text style={{ color: colors.text[theme].info }}>
            Add role-specific, safety, and leadership skills to improve your match rate.
          </Text>
        </Stack>
      </Row>

      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text style={{ color: colors.text[theme].info }}>Skill section completeness</Text>
          <Text style={{ color: colors.text[theme].info }}>{completionPercent}%</Text>
        </Row>
        <Progress value={completionPercent} max={100} backgroundColor="$blue3" size="xs">
          <Progress.Indicator backgroundColor={completionPercent >= 100 ? '$green10' : colors.bg[theme].primary} />
        </Progress>
      </Stack>
    </Stack>
  )
}
