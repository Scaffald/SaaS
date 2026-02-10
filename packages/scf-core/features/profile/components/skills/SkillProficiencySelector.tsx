import { PROFICIENCY_LEVELS, getProficiencyLevel } from '../../constants/proficiency-levels'
import type { ParentSkill } from '../../types/profile-skills-types'
import { Button, Card, Separator, Slider, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  const currentLevel = getProficiencyLevel(proficiency)

  return (
    <Stack gap="$4">
      <Text fontWeight="600" fontSize="$4">
        Set Proficiency Level
      </Text>

      {/* Selected Skill */}
      <Card bordered backgroundColor="$color3">
        <Card.Header>
          <Stack gap="$1">
            <Text fontSize="$4" fontWeight="600">
              {skill.name}
            </Text>
            {skill.code && (
              <Text fontSize="$2" color="$color10">
                {skill.code} ({taxonomy.toUpperCase()})
              </Text>
            )}
          </Stack>
        </Card.Header>
      </Card>

      <Separator />

      {/* Proficiency Slider */}
      <Stack gap="$3">
        <Text fontWeight="600">Proficiency</Text>

        <Slider
          value={[proficiency]}
          onValueChange={(value) => onProficiencyChange(value[0])}
          min={1}
          max={5}
          step={1}
          size="$3"
        >
          <Slider.Track backgroundColor="$color4" height={6}>
            <Slider.TrackActive backgroundColor="$green9" />
          </Slider.Track>
          <Slider.Thumb index={0} circular size="$1" />
        </Slider>

        {/* Current Level Display */}
        <Card bordered backgroundColor="$color3">
          <Card.Header>
            <Row justifyContent="space-between" alignItems="center">
              <Stack>
                <Text fontWeight="600" fontSize="$4" color="$green9">
                  {currentLevel?.label}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {currentLevel?.description}
                </Text>
              </Stack>
              <Text fontSize="$8" fontWeight="bold" color="$green9">
                {proficiency}
              </Text>
            </Row>
          </Card.Header>
        </Card>

        {/* Level Guide */}
        <Stack gap="$2">
          {PROFICIENCY_LEVELS.map((level) => (
            <Row
              key={level.value}
              gap="$2"
              alignItems="center"
              opacity={proficiency === level.value ? 1 : 0.5}
            >
              <Text fontWeight="600" minWidth={30}>
                {level.value}
              </Text>
              <Text flex={1} fontSize="$2">
                {level.label} - {level.description}
              </Text>
            </Row>
          ))}
        </Stack>
      </Stack>

      {/* Actions */}
      <Row gap="$3">
        <Button flex={1} variant="outlined" onPress={onCancel}>
          Cancel
        </Button>
        <Button flex={1} themeInverse onPress={onAdd}>
          Add Skill
        </Button>
      </Row>
    </Stack>
  )
}
