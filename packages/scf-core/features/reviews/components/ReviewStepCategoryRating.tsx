import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { StarRating } from './StarRating'

interface ReviewStepCategoryRatingProps {
  title: string
  description: string
  category: string
  rating: number
  onChange: (rating: number) => void
}

export function ReviewStepCategoryRating({
  title,
  description,
  category,
  rating,
  onChange,
}: ReviewStepCategoryRatingProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>{title}</Text>
        <Text style={{ color: colors.text[t].secondary }}>{description}</Text>
      </Stack>

      {/* Category Rating */}
      <StarRating label={`Overall ${category}`} value={rating} onChange={onChange} />

      {/* Helper Text */}
      <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
        Rate from 1-5 stars based on your overall assessment
      </Text>
    </Stack>
  )
}
