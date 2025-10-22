import { ScrollView, Text, YStack, H4, Paragraph } from 'tamagui'
import type { ReviewCategory, OnetElementRating } from '../data/mock-onet-elements'
import { OnetElementRatingComponent } from './OnetElementRating'

interface OnetCategoryStepProps {
  category: ReviewCategory
  ratings: Record<string, OnetElementRating>
  onRate: (rating: OnetElementRating) => void
}

export function OnetCategoryStep({ category, ratings, onRate }: OnetCategoryStepProps) {
  return (
    <YStack gap="$4" flex={1}>
      <YStack gap="$2">
        <H4>{category.name}</H4>
        <Paragraph color="$color11" fontSize="$4">
          {category.description}
        </Paragraph>
      </YStack>

      <ScrollView height={500}>
        <YStack gap="$3">
          {category.elements.map((element) => (
            <OnetElementRatingComponent
              key={element.id}
              element={element}
              rating={ratings[element.id]}
              onRate={onRate}
            />
          ))}
        </YStack>
      </ScrollView>

      <YStack bg="$blue2" p="$3" style={{ borderRadius: 12 }}>
        <Text fontSize="$3" color="$blue11">
          💡 <Text fontWeight="600">Tip:</Text> Rate each item 1-5 stars. For ratings of 3+, you can
          mark them as strengths or areas to improve.
        </Text>
      </YStack>
    </YStack>
  )
}
