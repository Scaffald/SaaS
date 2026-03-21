import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface Props {
  summary: string
}

export function AIFeedbackSummary({ summary }: Props) {
  const { theme } = useThemeContext()
  return (
    <Stack
      gap={8}
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme === 'dark' ? colors.info[900] : colors.info[50],
        borderWidth: 1,
        borderColor: colors.info[200],
      }}
    >
      <Text style={{ fontWeight: '600', fontSize: 14, color: colors.info[700] }}>AI Feedback Summary</Text>
      <Text style={{ color: colors.info[700], lineHeight: 20 }}>{summary}</Text>
    </Stack>
  )
}
