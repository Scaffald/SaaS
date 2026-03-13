import { Pressable } from 'react-native'
import { Text, Row } from '@scaffald/ui'

interface Props {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
  label?: string
}

export function StarRating({ value, onChange, readonly = false, size = 20, label }: Props) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <Row align="center" gap={4}>
      {label && (
        <Text color="$gray11" style={{ fontSize: 13, marginRight: 4 }}>
          {label}
        </Text>
      )}
      {stars.map((star) => (
        <Pressable key={star} onPress={() => !readonly && onChange?.(star)} disabled={readonly}>
          <Text
            style={{
              fontSize: size,
              color: star <= Math.round(value) ? '#f59e0b' : '#d4d4d8',
            }}
          >
            ★
          </Text>
        </Pressable>
      ))}
      {readonly && value > 0 && (
        <Text color="$gray11" style={{ fontSize: size * 0.65, marginLeft: 2 }}>
          {value.toFixed(1)}
        </Text>
      )}
    </Row>
  )
}
