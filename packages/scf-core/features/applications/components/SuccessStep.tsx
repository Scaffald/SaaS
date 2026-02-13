import { ROUTES } from '@scf/core/constants/routes'
import { Check, ExternalLink, Home } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Text, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()

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
    <Stack
      gap={24}
      width="100%"
      maxWidth={600}
      padding="xl"
      align="center"
      aria-live="polite"
      aria-label="Application submitted successfully"
    >
      {/* Success Icon */}
      <Stack
        width={80}
        height={80}
        borderRadius="$12"
        style={{ backgroundColor: colors.bg[theme].success }}
        borderWidth={2}
        style={{ borderColor: colors.border[theme].success }}
        align="center"
        justify="center"
        aria-hidden={true}
      >
        <Check size={48} style={{ color: colors.text[theme].success }} />
      </Stack>

      {/* Success Message */}
      <Stack gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
          Application Submitted Successfully!
        </Text>
        <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
          Thank you for applying to {jobTitle} at {organizationName}
        </Text>
        <Text style={{ color: colors.text[theme].secondary }} textAlign="center" marginTop={8}>
          Your application has been received and is under review
        </Text>
      </Stack>

      {/* Application ID */}
      <Stack gap={8} align="center" marginTop={16}>
        <Text style={{ color: colors.text[theme].info }}>Application ID: {formattedId}</Text>
        <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
          You will receive an email confirmation shortly
        </Text>
      </Stack>

      {/* What Happens Next */}
      <Stack
        gap={12}
        padding="md"
        style={{ backgroundColor: colors.bg[theme].default }}
        borderRadius={16}
        borderWidth={1}
        style={{ borderColor: colors.border[theme].default }}
        width="100%"
        marginTop={32}
      >
        <Text style={{ color: colors.text[theme].secondary }}>What happens next:</Text>

        <Stack gap={12} marginTop={8}>
          <NextStepItem text="Our team will review your application within 3-5 business days" />
          <NextStepItem text="You'll receive an email update on your application status" />
          <NextStepItem text="If selected, we'll contact you to schedule an interview" />
        </Stack>
      </Stack>

      {/* Action Buttons */}
      <Row gap={12} width="100%" marginTop={32} flexWrap="wrap" justify="center">
        {onViewApplication && (
          <Button
            size="lg"
            theme="info"
            iconStart={ExternalLink}
            onPress={() => onViewApplication(applicationId)}
            flex={1}
            minWidth={200}
          >
            View Application Status
          </Button>
        )}

        {onReturnToJobs && (
          <Button size="lg" variant="outline" onPress={onReturnToJobs} flex={1} minWidth={200}>
            Browse More Jobs
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          iconStart={Home}
          onPress={handleReturnToDashboard}
          flex={1}
          minWidth={200}
        >
          Return to Dashboard
        </Button>
      </Row>
    </Stack>
  )
}

/**
 * Helper component for next step items (bullet list format)
 */
function NextStepItem({ text }: { text: string }) {
  return (
    <Row gap={12} align="flex-start">
      <Text style={{ color: colors.text[theme].secondary }} marginTop={4}>
        •
      </Text>
      <Text style={{ color: colors.text[theme].secondary }} flex={1} lineHeight={4}>
        {text}
      </Text>
    </Row>
  )
}
