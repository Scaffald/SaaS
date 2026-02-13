import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import { HelpCircle, Info } from 'lucide-react-native'

export function InquiryHelpSidebar() {
  return (
    <Stack gap={16}>
      <Row align="center" gap={8}>
        <HelpCircle size={20} color="gray" />
        <Text>
          Help & Tips
        </Text>
      </Row>

      <Stack gap={16}>
        {/* Employment Section Help */}
        <Stack gap={8}>
          <Text>
            Employment Terms
          </Text>
          <Text color="gray">
            Specify the employment type, schedule, and working hours. Mark fields as non-negotiable
            to indicate they cannot be changed.
          </Text>
        </Stack>

        {/* Compensation Section Help */}
        <Stack gap={8}>
          <Text>
            Compensation
          </Text>
          <Text color="gray">
            Enter a single rate or a range (e.g., $30-40). The candidate will see your proposed
            compensation terms.
          </Text>
        </Stack>

        {/* Capabilities Section Help */}
        <Stack gap={8}>
          <Text>
            Capabilities
          </Text>
          <Text color="gray">
            Indicate required capabilities such as endurance. The candidate will need to respond to
            these questions.
          </Text>
        </Stack>

        {/* Other Section Help */}
        <Stack gap={8}>
          <Text>
            Additional Terms
          </Text>
          <Text color="gray">
            Specify any additional requirements such as travel, overtime, or driver's license. Add
            notes to provide context.
          </Text>
        </Stack>

        {/* Negotiation Help */}
        <Stack gap={8} padding={12} backgroundColor="$blue2" borderRadius={12}>
          <Row align="center" gap={8}>
            <Info size={16} color="$blue10" />
            <Text color="$blue11">
              About Negotiation
            </Text>
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
