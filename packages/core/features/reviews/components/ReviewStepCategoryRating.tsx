import { YStack, Text } from 'tamagui'
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
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          {title}
        </Text>
        <Text fontSize="$5" color="$color11">
          {description}
        </Text>
      </YStack>

      {/* Category Rating */}
      <StarRating label={`Overall ${category}`} value={rating} onChange={onChange} />

      {/* Helper Text */}
      <Text fontSize="$3" color="$color10" fontStyle="italic">
        Rate from 1-5 stars based on your overall assessment
      </Text>
    </YStack>
  )
}
