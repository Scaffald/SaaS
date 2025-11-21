import { Text, YStack } from 'tamagui'
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
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          Technical Skills
        </Text>
        <Text fontSize="$5" color="$color11">
          How would you rate this person's technical skills?
        </Text>
      </YStack>

      {/* Skills List */}
      <YStack gap="$4">
        {MOCK_SKILLS.map((skill) => (
          <StarRating
            key={skill.id}
            label={skill.name}
            value={ratings[skill.id] || 0}
            onChange={(rating) => onChange(skill.id, rating)}
          />
        ))}
      </YStack>

      {/* Helper Text */}
      <Text fontSize="$3" color="$color10" fontStyle="italic">
        Rate each skill from 1-5 stars based on their proficiency level
      </Text>
    </YStack>
  )
}
