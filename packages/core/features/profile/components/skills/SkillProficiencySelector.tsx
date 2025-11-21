import { PROFICIENCY_LEVELS, getProficiencyLevel } from '../../constants/proficiency-levels'
import type { ParentSkill } from '../../types/profile-skills-types'
import { Button, Card, Separator, Slider, Text, XStack, YStack } from 'tamagui'

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
    <YStack gap="$4">
      <Text fontWeight="600" fontSize="$4">
        Set Proficiency Level
      </Text>

      {/* Selected Skill */}
      <Card bordered bg="$color3">
        <Card.Header>
          <YStack gap="$1">
            <Text fontSize="$4" fontWeight="600">
              {skill.name}
            </Text>
            {skill.code && (
              <Text fontSize="$2" color="$color10">
                {skill.code} ({taxonomy.toUpperCase()})
              </Text>
            )}
          </YStack>
        </Card.Header>
      </Card>

      <Separator />

      {/* Proficiency Slider */}
      <YStack gap="$3">
        <Text fontWeight="600">Proficiency</Text>

        <Slider
          value={[proficiency]}
          onValueChange={(value) => onProficiencyChange(value[0])}
          min={1}
          max={5}
          step={1}
          size="$3"
        >
          <Slider.Track bg="$color4" height={6}>
            <Slider.TrackActive bg="$green9" />
          </Slider.Track>
          <Slider.Thumb index={0} circular size="$1" />
        </Slider>

        {/* Current Level Display */}
        <Card bordered bg="$color3">
          <Card.Header>
            <XStack justify="space-between" items="center">
              <YStack>
                <Text fontWeight="600" fontSize="$4" color="$green9">
                  {currentLevel?.label}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {currentLevel?.description}
                </Text>
              </YStack>
              <Text fontSize="$8" fontWeight="bold" color="$green9">
                {proficiency}
              </Text>
            </XStack>
          </Card.Header>
        </Card>

        {/* Level Guide */}
        <YStack gap="$2">
          {PROFICIENCY_LEVELS.map((level) => (
            <XStack
              key={level.value}
              gap="$2"
              items="center"
              opacity={proficiency === level.value ? 1 : 0.5}
            >
              <Text fontWeight="600" minW={30}>
                {level.value}
              </Text>
              <Text flex={1} fontSize="$2">
                {level.label} - {level.description}
              </Text>
            </XStack>
          ))}
        </YStack>
      </YStack>

      {/* Actions */}
      <XStack gap="$3">
        <Button flex={1} variant="outlined" onPress={onCancel}>
          Cancel
        </Button>
        <Button flex={1} themeInverse onPress={onAdd}>
          Add Skill
        </Button>
      </XStack>
    </YStack>
  )
}

