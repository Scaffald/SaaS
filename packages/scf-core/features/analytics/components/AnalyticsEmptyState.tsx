import { Card, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { TrendingUp } from 'lucide-react-native'

interface AnalyticsEmptyStateProps {
  title?: string
  message?: string
}

export function AnalyticsEmptyState({
  title = 'No data yet',
  message = 'Analytics data will appear here as you get more engagement on the platform.',
}: AnalyticsEmptyStateProps) {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  return (
    <Card variant="outlined" radius="lg" padding="xl">
      <Stack gap={12} align="center" style={{ paddingVertical: 32 }}>
        <TrendingUp size={40} color={colors.text[resolvedTheme].tertiary} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.text[resolvedTheme].secondary,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          {message}
        </Text>
      </Stack>
    </Card>
  )
}
