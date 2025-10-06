import { XStack, YStack, Text } from 'tamagui'
import { Star } from '@tamagui/lucide-icons'

interface StarRatingProps {
  label: string
  value: number
  onChange: (rating: number) => void
  readonly?: boolean
}

export function StarRating({ label, value, onChange, readonly = false }: StarRatingProps) {
  return (
    <YStack gap="$2">
      <Text fontSize="$5" fontWeight="600" color="$color12">
        {label}
      </Text>
      <XStack gap="$2" items="center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={`star-${star}`}
            size={32}
            color="$yellow10"
            fill={star <= value ? '$yellow10' : 'transparent'}
            cursor={readonly ? 'default' : 'pointer'}
            onPress={
              readonly
                ? undefined
                : () => {
                    onChange(star)
                  }
            }
          />
        ))}
        <Text fontSize="$6" fontWeight="700" color="$color11" ml="$2">
          {value}/5
        </Text>
      </XStack>
    </YStack>
  )
}
