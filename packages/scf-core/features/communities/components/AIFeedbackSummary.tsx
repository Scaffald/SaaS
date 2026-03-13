import { Text, Stack } from '@scaffald/ui'

interface Props {
  summary: string
}

export function AIFeedbackSummary({ summary }: Props) {
  return (
    <Stack
      gap={8}
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f0f9ff',
        borderWidth: 1,
        borderColor: '#bae6fd',
      }}
    >
      <Text style={{ fontWeight: '600', fontSize: 14, color: '#0369a1' }}>AI Feedback Summary</Text>
      <Text style={{ color: '#0c4a6e', lineHeight: 20 }}>{summary}</Text>
    </Stack>
  )
}
