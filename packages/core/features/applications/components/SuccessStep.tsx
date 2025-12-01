import { ROUTES } from '@app/core/constants/routes'
import { Check, ExternalLink, Home } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Button, Text, XStack, YStack } from '@unicornlove/ui'

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
    const numericPart = id
      .replace(/[^0-9]/g, '')
      .slice(-5)
      .padStart(5, '0')
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
      maxWidth={600}
      padding="$6"
      alignItems="center"
      aria-live="polite"
      aria-label="Application submitted successfully"
    >
      {/* Success Icon */}
      <YStack
        width={80}
        height={80}
        borderRadius="$12"
        backgroundColor="$green2"
        borderWidth={2}
        borderColor="$green9"
        alignItems="center"
        justifyContent="center"
        aria-hidden={true}
      >
        <Check size={48} color="$green10" />
      </YStack>

      {/* Success Message */}
      <YStack gap="$2" alignItems="center">
        <Text fontSize="$9" fontWeight="700" color="$color12" textAlign="center">
          Application Submitted Successfully!
        </Text>
        <Text fontSize="$4" color="$gray11" textAlign="center">
          Thank you for applying to {jobTitle} at {organizationName}
        </Text>
        <Text fontSize="$4" color="$gray11" textAlign="center" marginTop="$2">
          Your application has been received and is under review
        </Text>
      </YStack>

      {/* Application ID */}
      <YStack gap="$2" alignItems="center" marginTop="$4">
        <Text fontSize="$3" fontWeight="600" color="$blue10">
          Application ID: {formattedId}
        </Text>
        <Text fontSize="$2" color="$gray11" textAlign="center">
          You will receive an email confirmation shortly
        </Text>
      </YStack>

      {/* What Happens Next */}
      <YStack
        gap="$3"
        padding="$4"
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        width="100%"
        marginTop="$8"
      >
        <Text fontSize="$4" fontWeight="600" color="$color12">
          What happens next:
        </Text>

        <YStack gap="$3" marginTop="$2">
          <NextStepItem textAlign="Our team will review your application within 3-5 business days" />
          <NextStepItem textAlign="You'll receive an email update on your application status" />
          <NextStepItem textAlign="If selected, we'll contact you to schedule an interview" />
        </YStack>
      </YStack>

      {/* Action Buttons */}
      <XStack
        gap="$3"
        width="100%"
        marginTop="$8"
        flexWrap="wrap"
        justifyContent="center"
        $sm={{ flexDirection: 'column' }}
      >
        {onViewApplication && (
          <Button
            size="$5"
            theme="info"
            icon={ExternalLink}
            onPress={() => onViewApplication(applicationId)}
            flex={1}
            minWidth={200}
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
            minWidth={200}
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
          minWidth={200}
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
    <XStack gap="$3" alignItems="flex-start">
      <Text fontSize="$3" color="$gray11" marginTop="$1">
        •
      </Text>
      <Text fontSize="$3" color="$gray11" flex={1} lineHeight="$1">
        {text}
      </Text>
    </XStack>
  )
}
