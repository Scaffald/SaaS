import { Text, TextArea, YStack } from '@unicornlove/ui'

interface ReviewStep7SummaryProps {
  comment: string
  onChange: (comment: string) => void
}

export function ReviewStep7Summary({ comment, onChange }: ReviewStep7SummaryProps) {
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          Summary (Optional)
        </Text>
        <Text fontSize="$5" color="$color11">
          Add any additional comments about working with this person
        </Text>
      </YStack>

      {/* Text Area */}
      <TextArea
        placeholder="Share your experience working with this person..."
        value={comment}
        onChangeText={onChange}
        minHeight={200}
        fontSize="$4"
        padding="$4"
        borderWidth={2}
        borderColor="$color5"
        focusStyle={{ borderColor: '$blue8' }}
      />

      {/* Helper Text */}
      <Text fontSize="$3" color="$color10" fontStyle="italic">
        This field is optional. You can skip it or add details about your experience working
        together.
      </Text>
    </YStack>
  )
}
