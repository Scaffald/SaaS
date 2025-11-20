import { CheckCircle2, Circle } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from 'tamagui'

// Mock soft skills - will be replaced with real data from API
const MOCK_SOFT_SKILLS = [
  { id: '1', name: 'Deadline management', category: 'reliability' },
  { id: '2', name: 'Prioritization', category: 'reliability' },
  { id: '3', name: 'Communication', category: 'collaboration' },
  { id: '4', name: 'Teamwork', category: 'collaboration' },
  { id: '5', name: 'Problem-solving', category: 'technical' },
  { id: '6', name: 'Attention to detail', category: 'technical' },
]

interface ReviewStep2SkillsTagsProps {
  strengths: string[]
  improvements: string[]
  onToggleStrength: (skillId: string) => void
  onToggleImprovement: (skillId: string) => void
}

export function ReviewStep2SkillsTags({
  strengths,
  improvements,
  onToggleStrength,
  onToggleImprovement,
}: ReviewStep2SkillsTagsProps) {
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          Technical Skills - Details
        </Text>
        <Text fontSize="$5" color="$color11">
          Select their key strengths and areas to improve
        </Text>
      </YStack>

      {/* Strengths Section */}
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="600" color="$green11">
          ✓ Strengths
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = strengths.includes(skill.id)
            return (
              <XStack
                key={`strength-${skill.id}`}
                px="$3"
                py="$2"
                bg={isSelected ? '$green3' : '$color3'}
                borderWidth={2}
                borderColor={isSelected ? '$green8' : '$color5'}
                rounded="$3"
                gap="$2"
                items="center"
                cursor="pointer"
                hoverStyle={{ bg: isSelected ? '$green4' : '$color4' }}
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
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = improvements.includes(skill.id)
            return (
              <XStack
                key={`improvement-${skill.id}`}
                px="$3"
                py="$2"
                bg={isSelected ? '$red3' : '$color3'}
                borderWidth={2}
                borderColor={isSelected ? '$red8' : '$color5'}
                rounded="$3"
                gap="$2"
                items="center"
                cursor="pointer"
                hoverStyle={{ bg: isSelected ? '$red4' : '$color4' }}
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
        Select multiple skills for each category. Skills can only be in one category.
      </Text>
    </YStack>
  )
}
