import { Text, TextArea, Stack } from '@unicornlove/beyond-ui'

interface ReviewStep7SummaryProps {
  comment: string
  onChange: (comment: string) => void
}

export function ReviewStep7Summary({ comment, onChange }: ReviewStep7SummaryProps) {
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="gray">Summary (Optional)</Text>
        <Text color="gray">Add any additional comments about working with this person</Text>
      </Stack>

      {/* Text Area */}
      <TextArea
        placeholder="Share your experience working with this person..."
        value={comment}
        onChangeText={onChange}
        minHeight={200}
        padding={16}
        borderWidth={2}
        borderColor="$color5"
        focusStyle={{ borderColor: '$blue8' }}
      />

      {/* Helper Text */}
      <Text color="gray" fontStyle="italic">
        This field is optional. You can skip it or add details about your experience working
        together.
      </Text>
    </Stack>
  )
}
