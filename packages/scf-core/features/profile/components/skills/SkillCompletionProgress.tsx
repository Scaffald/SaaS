import { Sparkles } from 'lucide-react-native'
import { ProgressBar, Text, Row, Stack, getIconSize, useThemeContext } from '@scaffald/ui'
import { workerPalette } from '@scf/core/components/ui/styles'

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
  const pal = workerPalette[t]

  return (
    <Stack
      padding="md"
      gap={12}
      style={{
        backgroundColor: pal.pillBg,
        borderWidth: 1,
        borderColor: pal.pillText,
      }}
      borderRadius={16}
    >
      <Row gap={12} align="center">
        <Sparkles size={getIconSize('lg')} color={pal.accent} />
        <Stack gap={4} flex={1}>
          <Text style={{ color: pal.pillText }}>
            {hasMinimumSkills
              ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
              : 'Experts recommend adding at least 5 skills to your profile.'}
          </Text>
          <Text style={{ color: pal.pillText }}>
            Add role-specific, safety, and leadership skills to improve your match rate.
          </Text>
        </Stack>
      </Row>

      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text style={{ color: pal.pillText }}>Skill section completeness</Text>
          <Text style={{ color: pal.pillText }}>{completionPercent}%</Text>
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
