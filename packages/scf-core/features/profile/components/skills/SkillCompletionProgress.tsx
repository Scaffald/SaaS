import { Sparkles } from 'lucide-react-native'
import { ProgressBar, Text, Row, Stack, getIconSize, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack
      padding="md"
      gap={12}
      style={{
        backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50],
        borderWidth: 1,
        borderColor: t === 'dark' ? colors.blue[700] : colors.blue[200],
      }}
      borderRadius={16}
    >
      <Row gap={12} align="center">
        <Sparkles size={getIconSize('lg')} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
        <Stack gap={4} flex={1}>
          <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>
            {hasMinimumSkills
              ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
              : 'Experts recommend adding at least 5 skills to your profile.'}
          </Text>
          <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>
            Add role-specific, safety, and leadership skills to improve your match rate.
          </Text>
        </Stack>
      </Row>

      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>Skill section completeness</Text>
          <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>{completionPercent}%</Text>
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
