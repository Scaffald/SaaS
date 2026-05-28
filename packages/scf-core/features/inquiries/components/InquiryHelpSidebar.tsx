import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { HelpCircle, Info } from 'lucide-react-native'

export function InquiryHelpSidebar() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack gap={16}>
      <Row align="center" gap={8}>
        <HelpCircle size={24} color={colors.text[t].tertiary} />
        <Text>Help & Tips</Text>
      </Row>

      <Stack gap={16}>
        {/* Employment Section Help */}
        <Stack gap={8}>
          <Text>Employment Terms</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            Specify the employment type, schedule, and working hours. Mark fields as non-negotiable
            to indicate they cannot be changed.
          </Text>
        </Stack>

        {/* Compensation Section Help */}
        <Stack gap={8}>
          <Text>Compensation</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            Enter a single rate or a range (e.g., $30-40). The candidate will see your proposed
            compensation terms.
          </Text>
        </Stack>

        {/* Capabilities Section Help */}
        <Stack gap={8}>
          <Text>Capabilities</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            Indicate required capabilities such as endurance. The candidate will need to respond to
            these questions.
          </Text>
        </Stack>

        {/* Other Section Help */}
        <Stack gap={8}>
          <Text>Additional Terms</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            Specify any additional requirements such as travel, overtime, or driver's license. Add
            notes to provide context.
          </Text>
        </Stack>

        {/* Negotiation Help */}
        <Stack gap={8} padding="sm" style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50], borderRadius: 12 }}>
          <Row align="center" gap={8}>
            <Info size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
            <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>About Negotiation</Text>
          </Row>
          <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>
            Fields marked as negotiable can be discussed with the candidate. Non-negotiable fields
            are fixed and cannot be changed.
          </Text>
        </Stack>
      </Stack>
    </Stack>
  )
}
