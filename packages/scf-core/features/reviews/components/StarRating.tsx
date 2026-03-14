import { Star } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface StarRatingProps {
  label: string
  value: number
  onChange: (rating: number) => void
  readonly?: boolean
}

export function StarRating({ label, value, onChange, readonly = false }: StarRatingProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={8}>
      <Text style={{ color: colors.text[t].secondary }}>{label}</Text>
      <Row gap={8} align="center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={`star-${star}`}
            onPress={readonly ? undefined : () => onChange(star)}
            disabled={readonly}
          >
            <Star size={32} color={colors.yellow[500]} fill={star <= value ? colors.yellow[500] : 'transparent'} />
          </Pressable>
        ))}
        <Text style={{ color: '#414e62', marginLeft: 8 }}>
          {value}/5
        </Text>
      </Row>
    </Stack>
  )
}
