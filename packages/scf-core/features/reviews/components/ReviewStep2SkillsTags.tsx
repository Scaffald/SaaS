import { Pressable } from 'react-native'
import { CheckCircle2, Circle } from 'lucide-react-native'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Technical Skills - Details</Text>
        <Text style={{ color: colors.text[t].secondary }}>Select their key strengths and areas to improve</Text>
      </Stack>

      {/* Strengths Section */}
      <Stack gap={12}>
        <Text style={{ color: colors.success[600] }}>✓ Strengths</Text>
        <Row gap={8} wrap>
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = strengths.includes(skill.id)
            return (
              <Pressable
                key={`strength-${skill.id}`}
                onPress={() => onToggleStrength(skill.id)}
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: isSelected ? colors.green[100] : colors.gray[100],
                  borderWidth: 2,
                  borderColor: isSelected ? colors.green[300] : colors.gray[200],
                  borderRadius: 12,
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                {isSelected ? (
                  <CheckCircle2 size={16} color={colors.green[700]} />
                ) : (
                  <Circle size={16} color={colors.gray[500]} />
                )}
                <Text style={{ color: isSelected ? colors.green[700] : colors.gray[700] }}>{skill.name}</Text>
              </Pressable>
            )
          })}
        </Row>
      </Stack>

      {/* Areas to Improve Section */}
      <Stack gap={12}>
        <Text style={{ color: colors.error[600] }}>→ Areas to Improve</Text>
        <Row gap={8} wrap>
          {MOCK_SOFT_SKILLS.map((skill) => {
            const isSelected = improvements.includes(skill.id)
            return (
              <Pressable
                key={`improvement-${skill.id}`}
                onPress={() => onToggleImprovement(skill.id)}
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: isSelected ? colors.error[50] : colors.gray[100],
                  borderWidth: 2,
                  borderColor: isSelected ? colors.error[300] : colors.gray[200],
                  borderRadius: 12,
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                {isSelected ? (
                  <CheckCircle2 size={16} color={colors.error[700]} />
                ) : (
                  <Circle size={16} color={colors.gray[500]} />
                )}
                <Text style={{ color: isSelected ? colors.error[700] : colors.gray[700] }}>{skill.name}</Text>
              </Pressable>
            )
          })}
        </Row>
      </Stack>

      {/* Helper Text */}
      <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
        Select multiple skills for each category. Skills can only be in one category.
      </Text>
    </Stack>
  )
}
