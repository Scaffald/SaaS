import { Text, XStack, YStack } from '@unicornlove/ui'
import { HelpCircle, Info } from '@tamagui/lucide-icons'

export function InquiryHelpSidebar() {
  return (
    <YStack gap="$4">
      <XStack items="center" gap="$2">
        <HelpCircle size={20} color="$color11" />
        <Text fontSize="$5" fontWeight="700">
          Help & Tips
        </Text>
      </XStack>

      <YStack gap="$4">
        {/* Employment Section Help */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Employment Terms
          </Text>
          <Text fontSize="$3" color="$color11">
            Specify the employment type, schedule, and working hours. Mark fields as non-negotiable
            to indicate they cannot be changed.
          </Text>
        </YStack>

        {/* Compensation Section Help */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Compensation
          </Text>
          <Text fontSize="$3" color="$color11">
            Enter a single rate or a range (e.g., $30-40). The candidate will see your proposed
            compensation terms.
          </Text>
        </YStack>

        {/* Capabilities Section Help */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Capabilities
          </Text>
          <Text fontSize="$3" color="$color11">
            Indicate required capabilities such as endurance. The candidate will need to respond to
            these questions.
          </Text>
        </YStack>

        {/* Other Section Help */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Additional Terms
          </Text>
          <Text fontSize="$3" color="$color11">
            Specify any additional requirements such as travel, overtime, or driver's license. Add
            notes to provide context.
          </Text>
        </YStack>

        {/* Negotiation Help */}
        <YStack gap="$2" p="$3" bg="$blue2" rounded="$3">
          <XStack items="center" gap="$2">
            <Info size={16} color="$blue10" />
            <Text fontSize="$4" fontWeight="600" color="$blue11">
              About Negotiation
            </Text>
          </XStack>
          <Text fontSize="$3" color="$blue11">
            Fields marked as negotiable can be discussed with the candidate. Non-negotiable fields
            are fixed and cannot be changed.
          </Text>
        </YStack>
      </YStack>
    </YStack>
  )
}
