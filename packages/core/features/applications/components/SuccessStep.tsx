import { Button, Text, XStack, YStack } from 'tamagui'
import { Check, ExternalLink, Home } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { ROUTES } from '@app/core/constants/routes'

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
  onViewApplication?: (applicationId: string) => void

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
  const router = useRouter()

  // Format application ID (e.g., #APP-12345)
  const formatApplicationId = (id: string): string => {
    // Extract numeric part or use last 5 characters
    const numericPart = id.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')
    return `#APP-${numericPart}`
  }

  const formattedId = formatApplicationId(applicationId)

  // Handle navigation to dashboard
  const handleReturnToDashboard = () => {
    router.push(ROUTES.DASHBOARD.path)
  }


  return (
    <YStack
      gap="$6"
      width="100%"
      maxW={600}
      p="$6"
      items="center"
      aria-live="polite"
      aria-label="Application submitted successfully"
    >
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
        aria-hidden={true}
      >
        <Check size={48} color="$green10" />
      </YStack>

      {/* Success Message */}
      <YStack gap="$2" items="center">
        <Text fontSize="$9" fontWeight="700" color="$color12" text="center">
          Application Submitted Successfully!
        </Text>
        <Text fontSize="$4" color="$gray11" text="center">
          Thank you for applying to {jobTitle} at {organizationName}
        </Text>
        <Text fontSize="$4" color="$gray11" text="center" mt="$2">
          Your application has been received and is under review
        </Text>
      </YStack>

      {/* Application ID */}
      <YStack gap="$2" items="center" mt="$4">
        <Text fontSize="$3" fontWeight="600" color="$blue10">
          Application ID: {formattedId}
        </Text>
        <Text fontSize="$2" color="$gray11" text="center">
          You will receive an email confirmation shortly
        </Text>
      </YStack>

      {/* What Happens Next */}
      <YStack
        gap="$3"
        p="$4"
        bg="$background"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        width="100%"
        mt="$8"
      >
        <Text fontSize="$4" fontWeight="600" color="$color12">
          What happens next:
        </Text>

        <YStack gap="$3" mt="$2">
          <NextStepItem text="Our team will review your application within 3-5 business days" />
          <NextStepItem text="You'll receive an email update on your application status" />
          <NextStepItem text="If selected, we'll contact you to schedule an interview" />
        </YStack>
      </YStack>

      {/* Action Buttons */}
      <XStack
        gap="$3"
        width="100%"
        mt="$8"
        flexWrap="wrap"
        justify="center"
        $sm={{ flexDirection: 'column' }}
      >
        {onViewApplication && (
          <Button
            size="$5"
            theme="info"
            icon={ExternalLink}
            onPress={() => onViewApplication(applicationId)}
            flex={1}
            minW={200}
            $sm={{ width: '100%' }}
          >
            View Application Status
          </Button>
        )}

        {onReturnToJobs && (
          <Button
            size="$5"
            variant="outlined"
            onPress={onReturnToJobs}
            flex={1}
            minW={200}
            $sm={{ width: '100%' }}
          >
            Browse More Jobs
          </Button>
        )}

        <Button
          size="$5"
          variant="outlined"
          icon={Home}
          onPress={handleReturnToDashboard}
          flex={1}
          minW={200}
          $sm={{ width: '100%' }}
        >
          Return to Dashboard
        </Button>
      </XStack>
    </YStack>
  )
}

/**
 * Helper component for next step items (bullet list format)
 */
function NextStepItem({ text }: { text: string }) {
  return (
    <XStack gap="$3" items="flex-start">
      <Text fontSize="$3" color="$gray11" mt="$1">
        •
      </Text>
      <Text fontSize="$3" color="$gray11" flex={1} lineHeight="$1">
        {text}
      </Text>
    </XStack>
  )
}
