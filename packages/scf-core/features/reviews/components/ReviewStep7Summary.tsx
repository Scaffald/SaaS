import { Text, TextArea, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ReviewStep7SummaryProps {
  comment: string
  onChange: (comment: string) => void
}

export function ReviewStep7Summary({ comment, onChange }: ReviewStep7SummaryProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Summary (Optional)</Text>
        <Text style={{ color: colors.text[t].secondary }}>Add any additional comments about working with this person</Text>
      </Stack>

      {/* Text Area */}
      <TextArea
        placeholder="Share your experience working with this person..."
        value={comment}
        onChangeText={onChange}
        style={{ minHeight: 200 }}
      />

      {/* Helper Text */}
      <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
        This field is optional. You can skip it or add details about your experience working
        together.
      </Text>
    </Stack>
  )
}
