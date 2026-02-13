import { Text, Stack } from '@scaffald/ui'
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
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="$gray11">Technical Skills</Text>
        <Text color="$gray11">How would you rate this person's technical skills?</Text>
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
      <Text color="$gray11" fontStyle="italic">
        Rate each skill from 1-5 stars based on their proficiency level
      </Text>
    </Stack>
  )
}
