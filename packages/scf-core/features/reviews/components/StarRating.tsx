import { Star } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, Row, Stack } from '@scaffald/ui'

interface StarRatingProps {
  label: string
  value: number
  onChange: (rating: number) => void
  readonly?: boolean
}

export function StarRating({ label, value, onChange, readonly = false }: StarRatingProps) {
  return (
    <Stack gap={8}>
      <Text color="$gray11">{label}</Text>
      <Row gap={8} align="center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={`star-${star}`}
            onPress={readonly ? undefined : () => onChange(star)}
            disabled={readonly}
          >
            <Star size={32} color="$yellow10" fill={star <= value ? '$yellow10' : 'transparent'} />
          </Pressable>
        ))}
        <Text style={{ color: '#414e62', marginLeft: 8 }}>
          {value}/5
        </Text>
      </Row>
    </Stack>
  )
}
