import { Text, Stack } from '@scaffald/ui'
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
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="$gray11">{title}</Text>
        <Text color="$gray11">{description}</Text>
      </Stack>

      {/* Category Rating */}
      <StarRating label={`Overall ${category}`} value={rating} onChange={onChange} />

      {/* Helper Text */}
      <Text color="$gray11" fontStyle="italic">
        Rate from 1-5 stars based on your overall assessment
      </Text>
    </Stack>
  )
}
