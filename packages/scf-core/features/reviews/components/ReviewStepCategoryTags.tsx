import { Pressable } from 'react-native'
import { CheckCircle2, Circle } from 'lucide-react-native'
import { Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: '#414e62' }}>{title}</Text>
        <Text style={{ color: '#414e62' }}>{description}</Text>
      </Stack>

      {/* Strengths Section */}
      <Stack gap={12}>
        <Text style={{ color: '#16a34a' }}>✓ Strengths</Text>
        <Row gap={8} wrap>
          {skills.map((skill) => {
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
        <Text style={{ color: '#ef4444' }}>→ Areas to Improve</Text>
        <Row gap={8} wrap>
          {skills.map((skill) => {
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
      <Text style={{ color: '#414e62', fontStyle: 'italic' }}>
        Select multiple items for each category. Items can only be in one category.
      </Text>
    </Stack>
  )
}
