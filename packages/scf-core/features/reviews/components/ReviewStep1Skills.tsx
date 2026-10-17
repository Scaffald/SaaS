import { EmptyState, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { RatableSkill } from '../lib/review-skill-options'
import { StarRating } from './StarRating'

interface ReviewStep1SkillsProps {
  /** The subject's own skills (#1247). This was a fixed Framing / Electrical
   *  Wiring / Plumbing list shown for everyone, whatever their trade. */
  skills: RatableSkill[]
  subjectName: string
  ratings: Record<string, number>
  onChange: (skillId: string, rating: number) => void
}

export function ReviewStep1Skills({
  skills,
  subjectName,
  ratings,
  onChange,
}: ReviewStep1SkillsProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Technical Skills</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          How would you rate this person's technical skills?
        </Text>
      </Stack>

      {skills.length === 0 ? (
        <EmptyState
          title="No skills listed yet"
          description={`${subjectName} hasn't added any skills to their profile, so there is nothing to rate here. Continue to the next step.`}
        />
      ) : (
        <>
          <Stack gap={16}>
            {skills.map((skill) => (
              <StarRating
                key={skill.id}
                label={skill.name}
                value={ratings[skill.id] || 0}
                onChange={(rating) => onChange(skill.id, rating)}
              />
            ))}
          </Stack>

          <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
            Rate each skill from 1-5 stars based on their proficiency level
          </Text>
        </>
      )}
    </Stack>
  )
}
