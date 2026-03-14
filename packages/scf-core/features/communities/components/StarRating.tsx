import { Pressable } from 'react-native'
import { Text, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface Props {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
  label?: string
}

export function StarRating({ value, onChange, readonly = false, size = 20, label }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const stars = [1, 2, 3, 4, 5]

  return (
    <Row align="center" gap={4}>
      {label && (
        <Text style={{ fontSize: 13, marginRight: 4, color: colors.text[t].secondary }}>
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
        <Text style={{ fontSize: size * 0.65, marginLeft: 2, color: colors.text[t].secondary }}>
          {value.toFixed(1)}
        </Text>
      )}
    </Row>
  )
}
