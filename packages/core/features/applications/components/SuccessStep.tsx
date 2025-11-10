import { Button, Text, YStack } from 'tamagui'
import { Check, ExternalLink } from '@tamagui/lucide-icons'

export interface SuccessStepProps {
  /**
   * Application ID for reference
   */
  applicationId: string

  /**
   * Job title applied to
   */
  jobTitle: string

  /**
   * Organization name
   */
  organizationName: string

  /**
   * Callback when user wants to view their application
   */
  onViewApplication?: () => void

  /**
   * Callback when user wants to return to jobs
   */
  onReturnToJobs?: () => void
}

/**
 * SuccessStep - Confirmation screen after successful application submission
 *
 * Displays:
 * - Success message
 * - Application reference ID
 * - Next steps information
 * - Timeline expectations
 * - Action buttons
 */
export function SuccessStep({
  applicationId,
  jobTitle,
  organizationName,
  onViewApplication,
  onReturnToJobs,
}: SuccessStepProps) {
  return (
    <YStack gap="$6" width="100%" maxW={600} p="$6" items="center">
      {/* Success Icon */}
      <YStack
        width={80}
        height={80}
        rounded="$12"
        bg="$green2"
        borderWidth={2}
        borderColor="$green9"
        items="center"
        justify="center"
      >
        <Check size={48} color="$green10" />
      </YStack>

      {/* Success Message */}
      <YStack gap="$2" items="center">
        <Text fontSize="$9" fontWeight="bold" color="$color12" text="center">
          Application Submitted!
        </Text>
        <Text fontSize="$5" color="$color11" text="center">
          Thank you for applying to {jobTitle} at {organizationName}
        </Text>
      </YStack>

      {/* Application ID */}
      <YStack
        gap="$2"
        items="center"
        p="$4"
        bg="$background"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        width="100%"
      >
        <Text fontSize="$3" fontWeight="600" color="$color11">
          Application Reference
        </Text>
        <Text fontSize="$4" fontWeight="bold" color="$blue10">
          {applicationId.slice(0, 8).toUpperCase()}
        </Text>
        <Text fontSize="$2" color="$color10" text="center">
          Save this reference number for your records
        </Text>
      </YStack>

      {/* What Happens Next */}
      <YStack
        gap="$3"
        p="$4"
        bg="$blue2"
        rounded="$4"
        borderWidth={1}
        borderColor="$blue7"
        width="100%"
      >
        <Text fontSize="$5" fontWeight="bold" color="$color12">
          What happens next?
        </Text>

        <YStack gap="$2">
          <StepItem
            number={1}
            text="Our team will review your application within 3-5 business days"
          />
          <StepItem
            number={2}
            text="You'll receive an email notification about your application status"
          />
          <StepItem number={3} text="If selected, we'll reach out to schedule an interview" />
        </YStack>
      </YStack>

      {/* Tips */}
      <YStack
        gap="$2"
        p="$4"
        bg="$background"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        width="100%"
      >
        <Text fontSize="$4" fontWeight="600" color="$color12">
          💡 Tips while you wait
        </Text>
        <YStack gap="$1">
          <Text fontSize="$3" color="$color11">
            • Check your email regularly for updates
          </Text>
          <Text fontSize="$3" color="$color11">
            • Keep your profile information up to date
          </Text>
          <Text fontSize="$3" color="$color11">
            • Explore other opportunities that match your skills
          </Text>
        </YStack>
      </YStack>

      {/* Action Buttons */}
      <YStack gap="$3" width="100%" mt="$4">
        {onViewApplication && (
          <Button size="$5" theme="info" icon={ExternalLink} onPress={onViewApplication}>
            View My Application
          </Button>
        )}

        {onReturnToJobs && (
          <Button size="$5" variant="outlined" onPress={onReturnToJobs}>
            Browse More Jobs
          </Button>
        )}
      </YStack>
    </YStack>
  )
}

/**
 * Helper component for numbered steps
 */
function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <YStack flexDirection="row" gap="$3" items="flex-start">
      <YStack width={24} height={24} rounded="$12" bg="$blue9" items="center" justify="center">
        <Text fontSize="$2" fontWeight="bold" color="white">
          {number}
        </Text>
      </YStack>
      <Text fontSize="$3" color="$color12" flex={1}>
        {text}
      </Text>
    </YStack>
  )
}
