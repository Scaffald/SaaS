import { CheckCircle2, Circle } from 'lucide-react-native'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <Stack gap="$4">
      <Stack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          Technical Skills - Details
        </Text>
        <Text fontSize="$5" color="$color11">
          Select their key strengths and areas to improve
        </Text>
      </Stack>

      {/* Strengths Section */}
      <Stack gap="$3">
        <Text fontSize="$6" fontWeight="600" color="$green11">
          ✓ Strengths
        </Text>
        <Row gap="$2" flexWrap="wrap">
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = strengths.includes(skill.id)
            return (
              <Row
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
              </Row>
            )
          })}
        </Row>
      </Stack>

      {/* Areas to Improve Section */}
      <Stack gap="$3">
        <Text fontSize="$6" fontWeight="600" color="$red11">
          → Areas to Improve
        </Text>
        <Row gap="$2" flexWrap="wrap">
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = improvements.includes(skill.id)
            return (
              <Row
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
              </Row>
            )
          })}
        </Row>
      </Stack>

      {/* Helper Text */}
      <Text fontSize="$3" color="$color10" fontStyle="italic">
        Select multiple skills for each category. Skills can only be in one category.
      </Text>
    </Stack>
  )
}
