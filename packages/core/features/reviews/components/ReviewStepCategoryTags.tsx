import { CheckCircle2, Circle } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from '@unicornlove/ui'

interface Skill {
  id: string
  name: string
  category: string
}

interface ReviewStepCategoryTagsProps {
  title: string
  description: string
  skills: Skill[]
  strengths: string[]
  improvements: string[]
  onToggleStrength: (skillId: string) => void
  onToggleImprovement: (skillId: string) => void
}

export function ReviewStepCategoryTags({
  title,
  description,
  skills,
  strengths,
  improvements,
  onToggleStrength,
  onToggleImprovement,
}: ReviewStepCategoryTagsProps) {
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          {title}
        </Text>
        <Text fontSize="$5" color="$color11">
          {description}
        </Text>
      </YStack>

      {/* Strengths Section */}
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="600" color="$green11">
          ✓ Strengths
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {skills.map((skill) => {
            const isSelected = strengths.includes(skill.id)
            return (
              <XStack
                key={`strength-${skill.id}`}
                paddingHorizontal="$3"
                paddingVertical="$2"
                backgroundColor={isSelected ? '$green3' : '$color3'}
                borderWidth={2}
                borderColor={isSelected ? '$green8' : '$color5'}
                borderRadius="$3"
                gap="$2"
                alignItems="center"
                cursor="pointer"
                hoverStyle={{ backgroundColor: isSelected ? '$green4' : '$color4' }}
                pressStyle={{ scale: 0.97 }}
                onPress={() => onToggleStrength(skill.id)}
              >
                {isSelected ? (
                  <CheckCircle2 size={16} color="$green11" />
                ) : (
                  <Circle size={16} color="$color10" />
                )}
                <Text
                  fontSize="$4"
                  fontWeight={isSelected ? '600' : '400'}
                  color={isSelected ? '$green11' : '$color11'}
                >
                  {skill.name}
                </Text>
              </XStack>
            )
          })}
        </XStack>
      </YStack>

      {/* Areas to Improve Section */}
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="600" color="$red11">
          → Areas to Improve
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {skills.map((skill) => {
            const isSelected = improvements.includes(skill.id)
            return (
              <XStack
                key={`improvement-${skill.id}`}
                paddingHorizontal="$3"
                paddingVertical="$2"
                backgroundColor={isSelected ? '$red3' : '$color3'}
                borderWidth={2}
                borderColor={isSelected ? '$red8' : '$color5'}
                borderRadius="$3"
                gap="$2"
                alignItems="center"
                cursor="pointer"
                hoverStyle={{ backgroundColor: isSelected ? '$red4' : '$color4' }}
                pressStyle={{ scale: 0.97 }}
                onPress={() => onToggleImprovement(skill.id)}
              >
                {isSelected ? (
                  <CheckCircle2 size={16} color="$red11" />
                ) : (
                  <Circle size={16} color="$color10" />
                )}
                <Text
                  fontSize="$4"
                  fontWeight={isSelected ? '600' : '400'}
                  color={isSelected ? '$red11' : '$color11'}
                >
                  {skill.name}
                </Text>
              </XStack>
            )
          })}
        </XStack>
      </YStack>

      {/* Helper Text */}
      <Text fontSize="$3" color="$color10" fontStyle="italic">
        Select multiple items for each category. Items can only be in one category.
      </Text>
    </YStack>
  )
}
