import { PROFICIENCY_LEVELS, getProficiencyLevel } from '../../constants/proficiency-levels'
import type { ParentSkill } from '../../types/profile-skills-types'
import { Button, Card, CardHeader, Separator, Slider, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface SkillProficiencySelectorProps {
  /** Selected skill details */
  skill: ParentSkill
  /** Selected taxonomy */
  taxonomy: string
  /** Current proficiency level */
  proficiency: number
  /** Callback when proficiency changes */
  onProficiencyChange: (value: number) => void
  /** Callback when add button is clicked */
  onAdd: () => void
  /** Callback when cancel button is clicked */
  onCancel: () => void
}

/**
 * Skill Proficiency Selector Component
 * Displays proficiency slider and level guide for selecting skill proficiency
 */
export function SkillProficiencySelector({
  skill,
  taxonomy,
  proficiency,
  onProficiencyChange,
  onAdd,
  onCancel,
}: SkillProficiencySelectorProps) {
  const { theme } = useThemeContext()
  const currentLevel = getProficiencyLevel(proficiency)

  return (
    <Stack gap={16}>
      <Text>Set Proficiency Level</Text>

      {/* Selected Skill */}
      <Card bordered style={{ backgroundColor: colors.bg[theme].muted }}>
        <CardHeader>
          <Stack gap={4}>
            <Text>{skill.name}</Text>
            {skill.code && (
              <Text style={{ color: colors.text[theme].secondary }}>
                {skill.code} ({taxonomy.toUpperCase()})
              </Text>
            )}
          </Stack>
        </CardHeader>
      </Card>

      <Separator />

      {/* Proficiency Slider */}
      <Stack gap={12}>
        <Text>Proficiency</Text>

        <Slider
          value={proficiency}
          onValueChange={(value) => onProficiencyChange(value)}
          min={1}
          max={5}
          step={1}
        />

        {/* Current Level Display */}
        <Card bordered style={{ backgroundColor: colors.bg[theme].muted }}>
          <CardHeader>
            <Row justify="space-between" align="center">
              <Stack>
                <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }}>{currentLevel?.label}</Text>
                <Text style={{ color: colors.text[theme].secondary }}>{currentLevel?.description}</Text>
              </Stack>
              <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }}>{proficiency}</Text>
            </Row>
          </CardHeader>
        </Card>

        {/* Level Guide */}
        <Stack gap={8}>
          {PROFICIENCY_LEVELS.map((level) => (
            <Row
              key={level.value}
              gap={8}
              align="center"
              style={{ opacity: proficiency === level.value ? 1 : 0.5 }}
            >
              <Text style={{ minWidth: 30 }}>{level.value}</Text>
              <Text style={{ flex: 1 }}>
                {level.label} - {level.description}
              </Text>
            </Row>
          ))}
        </Stack>
      </Stack>

      {/* Actions */}
      <Row gap={12}>
        <Button style={{ flex: 1 }} variant="outline" onPress={onCancel}>
          Cancel
        </Button>
        <Button style={{ flex: 1 }} variant="filled" color="primary" onPress={onAdd}>
          Add Skill
        </Button>
      </Row>
    </Stack>
  )
}
