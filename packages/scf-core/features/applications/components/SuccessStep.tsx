import { ROUTES } from '@scf/core/constants/routes'
import { Check, ExternalLink, Home } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, H2, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
        width={72}
        height={72}
        borderRadius={999}
        borderWidth={1}
        borderColor={colors.border[theme].default}
        style={{ backgroundColor: colors.bg[theme].subtle }}
        align="center"
        justify="center"
        aria-hidden={true}
      >
        <Check size={36} color={colors.fg[theme].success} />
      </Stack>

      {/* Success Message */}
      <Stack gap={8} align="center">
        <H2 style={{ color: colors.text[theme].primary, textAlign: 'center' }}>
          Application Submitted Successfully!
        </H2>
        <Text style={{ color: colors.text[theme].secondary }} align="center">
          Thank you for applying to {jobTitle} at {organizationName}
        </Text>
        <Text style={{ color: colors.text[theme].secondary, marginTop: 8 }} align="center">
          Your application has been received and is under review
        </Text>
      </Stack>

      {/* Application ID */}
      <Stack gap={8} align="center" marginTop={16}>
        <Text style={{ color: colors.text[theme].emphasis }}>Application ID: {formattedId}</Text>
        <Text style={{ color: colors.text[theme].secondary }} align="center">
          You will receive an email confirmation shortly
        </Text>
      </Stack>

      {/* What Happens Next */}
      <Stack
        gap={12}
        padding="md"
        borderRadius={16}
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderColor: colors.border[theme].default,
          borderWidth: 1,
          width: '100%',
          marginTop: 32,
        }}
      >
        <Text style={{ color: colors.text[theme].secondary }}>What happens next:</Text>

        <Stack gap={12} marginTop={8}>
          <NextStepItem text="Our team will review your application within 3-5 business days" theme={theme} />
          <NextStepItem text="You'll receive an email update on your application status" theme={theme} />
          <NextStepItem text="If selected, we'll contact you to schedule an interview" theme={theme} />
        </Stack>
      </Stack>

      {/* Action Buttons */}
      <Row gap={12} width="100%" marginTop={32} wrap justify="center">
        {onViewApplication && (
          <Button
            size="lg"
            color="primary"
            variant="filled"
            iconStart={ExternalLink}
            onPress={() => onViewApplication(applicationId)}
            style={{ flex: 1, minWidth: 200 }}
          >
            View Application Status
          </Button>
        )}

        {onReturnToJobs && (
          <Button size="lg" variant="outline" onPress={onReturnToJobs} style={{ flex: 1, minWidth: 200 }}>
            Browse More Jobs
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          iconStart={Home}
          onPress={handleReturnToDashboard}
          style={{ flex: 1, minWidth: 200 }}
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
function NextStepItem({ text, theme }: { text: string; theme: 'light' | 'dark' }) {
  return (
    <Row gap={12} align="flex-start">
      <Text style={{ color: colors.text[theme].secondary, marginTop: 4 }}>
        •
      </Text>
      <Text style={{ color: colors.text[theme].secondary, flex: 1, lineHeight: 24 }}>
        {text}
      </Text>
    </Row>
  )
}
