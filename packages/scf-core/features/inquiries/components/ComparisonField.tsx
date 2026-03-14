import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ComparisonFieldProps {
  label: string
  value: string
  isDifferent: boolean
  description?: string
}

export function ComparisonField({ label, value, isDifferent, description }: ComparisonFieldProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack
      backgroundColor={isDifferent ? colors.bg[t].muted : 'transparent'}
      padding="xs"
      borderRadius={8}
      gap={4}
    >
      <Row justify="space-between" align="center">
        <Text style={{ color: colors.text[t].secondary }}>{label}</Text>
        <Text style={{ color: isDifferent ? colors.text[t].secondary : colors.text[t].primary }}>{value}</Text>
      </Row>
      {description && <Text style={{ color: colors.text[t].secondary }}>{description}</Text>}
    </Stack>
  )
}
