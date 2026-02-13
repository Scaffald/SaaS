import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import { HelpCircle, Info } from 'lucide-react-native'

export function InquiryHelpSidebar() {
  return (
    <Stack gap={16}>
      <Row align="center" gap={8}>
        <HelpCircle size="lg" color="$gray11" />
        <Text>Help & Tips</Text>
      </Row>

      <Stack gap={16}>
        {/* Employment Section Help */}
        <Stack gap={8}>
          <Text>Employment Terms</Text>
          <Text color="$gray11">
            Specify the employment type, schedule, and working hours. Mark fields as non-negotiable
            to indicate they cannot be changed.
          </Text>
        </Stack>

        {/* Compensation Section Help */}
        <Stack gap={8}>
          <Text>Compensation</Text>
          <Text color="$gray11">
            Enter a single rate or a range (e.g., $30-40). The candidate will see your proposed
            compensation terms.
          </Text>
        </Stack>

        {/* Capabilities Section Help */}
        <Stack gap={8}>
          <Text>Capabilities</Text>
          <Text color="$gray11">
            Indicate required capabilities such as endurance. The candidate will need to respond to
            these questions.
          </Text>
        </Stack>

        {/* Other Section Help */}
        <Stack gap={8}>
          <Text>Additional Terms</Text>
          <Text color="$gray11">
            Specify any additional requirements such as travel, overtime, or driver's license. Add
            notes to provide context.
          </Text>
        </Stack>

        {/* Negotiation Help */}
        <Stack gap={8} padding="sm" backgroundColor="$blue2" borderRadius={12}>
          <Row align="center" gap={8}>
            <Info size="md" color="$blue10" />
            <Text color="$blue11">About Negotiation</Text>
          </Row>
          <Text color="$blue11">
            Fields marked as negotiable can be discussed with the candidate. Non-negotiable fields
            are fixed and cannot be changed.
          </Text>
        </Stack>
      </Stack>
    </Stack>
  )
}
