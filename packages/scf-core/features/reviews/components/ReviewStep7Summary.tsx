import { Text, TextArea, Stack } from '@scaffald/ui'

interface ReviewStep7SummaryProps {
  comment: string
  onChange: (comment: string) => void
}

export function ReviewStep7Summary({ comment, onChange }: ReviewStep7SummaryProps) {
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="$gray11">Summary (Optional)</Text>
        <Text color="$gray11">Add any additional comments about working with this person</Text>
      </Stack>

      {/* Text Area */}
      <TextArea
        placeholder="Share your experience working with this person..."
        value={comment}
        onChangeText={onChange}
        style={{ minHeight: 200 }}
      />

      {/* Helper Text */}
      <Text style={{ color: '#414e62', fontStyle: 'italic' }}>
        This field is optional. You can skip it or add details about your experience working
        together.
      </Text>
    </Stack>
  )
}
