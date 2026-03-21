import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { StarRating } from './StarRating'

// Mock skills data - will be replaced with real data from API
const MOCK_SKILLS = [
  { id: '1', name: 'Framing', category: 'Carpentry' },
  { id: '2', name: 'Electrical Wiring', category: 'Electrical' },
  { id: '3', name: 'Plumbing', category: 'Plumbing' },
]

interface ReviewStep1SkillsProps {
  ratings: Record<string, number>
  onChange: (skillId: string, rating: number) => void
}

export function ReviewStep1Skills({ ratings, onChange }: ReviewStep1SkillsProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Technical Skills</Text>
        <Text style={{ color: colors.text[t].secondary }}>How would you rate this person's technical skills?</Text>
      </Stack>

      {/* Skills List */}
      <Stack gap={16}>
        {MOCK_SKILLS.map((skill) => (
          <StarRating
            key={skill.id}
            label={skill.name}
            value={ratings[skill.id] || 0}
            onChange={(rating) => onChange(skill.id, rating)}
          />
        ))}
      </Stack>

      {/* Helper Text */}
      <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
        Rate each skill from 1-5 stars based on their proficiency level
      </Text>
    </Stack>
  )
}
