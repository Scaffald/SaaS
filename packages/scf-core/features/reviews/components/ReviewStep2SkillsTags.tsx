import { CheckCircle2, Circle } from 'lucide-react-native'
import { Text, Row, Stack } from '@scaffald/ui'

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
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="$gray11">Technical Skills - Details</Text>
        <Text color="$gray11">Select their key strengths and areas to improve</Text>
      </Stack>

      {/* Strengths Section */}
      <Stack gap={12}>
        <Text color="$green11">✓ Strengths</Text>
        <Row gap={8} wrap>
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = strengths.includes(skill.id)
            return (
              <Row
                key={`strength-${skill.id}`}
                paddingHorizontal={12}
                paddingVertical={8}
                backgroundColor={isSelected ? '$green3' : '$color3'}
                borderWidth={2}
                borderColor={isSelected ? '$green8' : '$color5'}
                borderRadius={12}
                gap={8}
                align="center"
                cursor="pointer"
                hoverStyle={{ backgroundColor: isSelected ? '$green4' : '$color4' }}
                pressStyle={{ scale: 0.97 }}
                onPress={() => onToggleStrength(skill.id)}
              >
                {isSelected ? (
                  <CheckCircle2 size="md" color="$green11" />
                ) : (
                  <Circle size="md" color="$gray11" />
                )}
                <Text color={isSelected ? '$green11' : '$color11'}>{skill.name}</Text>
              </Row>
            )
          })}
        </Row>
      </Stack>

      {/* Areas to Improve Section */}
      <Stack gap={12}>
        <Text color="$red11">→ Areas to Improve</Text>
        <Row gap={8} wrap>
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = improvements.includes(skill.id)
            return (
              <Row
                key={`improvement-${skill.id}`}
                paddingHorizontal={12}
                paddingVertical={8}
                backgroundColor={isSelected ? '$red3' : '$color3'}
                borderWidth={2}
                borderColor={isSelected ? '$red8' : '$color5'}
                borderRadius={12}
                gap={8}
                align="center"
                cursor="pointer"
                hoverStyle={{ backgroundColor: isSelected ? '$red4' : '$color4' }}
                pressStyle={{ scale: 0.97 }}
                onPress={() => onToggleImprovement(skill.id)}
              >
                {isSelected ? (
                  <CheckCircle2 size="md" color="$red11" />
                ) : (
                  <Circle size="md" color="$gray11" />
                )}
                <Text color={isSelected ? '$red11' : '$color11'}>{skill.name}</Text>
              </Row>
            )
          })}
        </Row>
      </Stack>

      {/* Helper Text */}
      <Text color="$gray11" fontStyle="italic">
        Select multiple skills for each category. Skills can only be in one category.
      </Text>
    </Stack>
  )
}
