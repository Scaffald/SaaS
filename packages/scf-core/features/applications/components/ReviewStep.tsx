import type { AttachmentMetadata, CustomQuestionAnswer, ScreeningAnswers } from '@scf/schemas'
import { Check, Edit3, FileText } from 'lucide-react-native'
import { useState } from 'react'
import {
  Button,
  Checkbox,
  Separator,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

export interface ReviewStepProps {
  /**
   * Screening answers to review
   */
  screeningAnswers: Partial<ScreeningAnswers>

  /**
   * Custom question answers to review
   */
  customQuestionAnswers: CustomQuestionAnswer[]

  /**
   * File attachments to review
   */
  attachments: Record<string, AttachmentMetadata>

  /**
   * Callback when user wants to edit a section
   */
  onEdit: (section: 'screening' | 'questions' | 'attachments') => void

  /**
   * Callback when submitting application
   */
  onSubmit: () => void

  /**
   * Whether the application is being submitted
   */
  isSubmitting?: boolean

  /**
   * Whether this is editing an existing application
   */
  isEditMode?: boolean
}

/**
 * ReviewStep - Final review before submission
 *
 * Displays:
 * - All screening answers
 * - All custom question answers
 * - All file attachments
 * - Edit buttons for each section
 * - Final submit button
 */
export function ReviewStep({
  screeningAnswers,
  customQuestionAnswers,
  attachments,
  onEdit,
  onSubmit,
  isSubmitting = false,
  isEditMode = false,
}: ReviewStepProps) {
  const [hasConsent, setHasConsent] = useState(false)
  const { theme } = useThemeContext()

  return (
    <Stack gap={24} width="100%" maxWidth={800} padding="md">
      {/* Header */}
      <Stack gap={8}>
        <Text style={{ color: colors.text[theme].secondary }}>Review Your Application</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Please review your information carefully before submitting.
        </Text>
      </Stack>

      {/* Screening Information Section */}
      <Stack
        gap={16}
        style={{ backgroundColor: colors.bg[theme].default }}
        padding="xl"
        borderRadius={16}
        borderWidth={1}
        style={{ borderColor: colors.border[theme].default }}
        shadowColor="$gray4"
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={0.1}
        shadowRadius={3}
      >
        <Row justify="space-between" align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Screening Questions</Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={Edit3}
            onPress={() => onEdit('screening')}
            disabled={isSubmitting}
            chromeless
          >
            <Text style={{ color: colors.text[theme].info }}>Edit</Text>
          </Button>
        </Row>

        <Separator />

        <Stack gap={16}>
          <InfoRow
            label="Current Location"
            value={screeningAnswers.current_location || 'Not provided'}
          />
          <InfoRow
            label="Willing to Relocate"
            value={screeningAnswers.willing_to_relocate ? 'Yes' : 'No'}
          />
          <InfoRow
            label="Years of Experience"
            value={
              screeningAnswers.years_experience
                ? `${screeningAnswers.years_experience} years`
                : 'Not provided'
            }
          />
          <InfoRow
            label="Work Authorization"
            value={
              screeningAnswers.is_authorized_to_work
                ? 'Yes, authorized to work in the US'
                : 'No, will require sponsorship'
            }
          />
          <InfoRow
            label="Earliest Start Date"
            value={screeningAnswers.earliest_start_date || 'Not provided'}
          />
        </Stack>
      </Stack>

      {/* Custom Questions Section */}
      {customQuestionAnswers.length > 0 && (
        <Stack
          gap={16}
          style={{ backgroundColor: colors.bg[theme].default }}
          padding="xl"
          borderRadius={16}
          borderWidth={1}
          style={{ borderColor: colors.border[theme].default }}
          shadowColor="$gray4"
          shadowOffset={{ width: 0, height: 1 }}
          shadowOpacity={0.1}
          shadowRadius={3}
        >
          <Row justify="space-between" align="center">
            <Text style={{ color: colors.text[theme].secondary }}>Additional Questions</Text>
            <Button
              size="sm"
              variant="outline"
              iconStart={Edit3}
              onPress={() => onEdit('questions')}
              disabled={isSubmitting}
              chromeless
            >
              <Text style={{ color: colors.text[theme].info }}>Edit</Text>
            </Button>
          </Row>

          <Separator />

          <Stack gap={16}>
            {customQuestionAnswers.map((answer, index) => (
              <InfoRow
                key={answer.question_id || index}
                label={answer.question}
                value={formatAnswer(answer.answer)}
              />
            ))}
          </Stack>
        </Stack>
      )}

      {/* Attachments Section */}
      <Stack
        gap={16}
        style={{ backgroundColor: colors.bg[theme].default }}
        padding="xl"
        borderRadius={16}
        borderWidth={1}
        style={{ borderColor: colors.border[theme].default }}
        shadowColor="$gray4"
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={0.1}
        shadowRadius={3}
      >
        <Row justify="space-between" align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Documents</Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={Edit3}
            onPress={() => onEdit('attachments')}
            disabled={isSubmitting}
            chromeless
          >
            <Text style={{ color: colors.text[theme].info }}>Edit</Text>
          </Button>
        </Row>

        <Separator />

        <Stack gap={16}>
          {attachments.resume ? (
            <DocumentRow type="Resume" metadata={attachments.resume} required />
          ) : (
            <Text style={{ color: colors.text[theme].secondary }}>Resume: Not provided</Text>
          )}

          {attachments.cover_letter ? (
            <DocumentRow type="Cover Letter" metadata={attachments.cover_letter} required={false} />
          ) : (
            <Text style={{ color: colors.text[theme].secondary }}>Cover Letter: Not provided</Text>
          )}

          {attachments.portfolio && (
            <DocumentRow type="Portfolio" metadata={attachments.portfolio} required={false} />
          )}
        </Stack>
      </Stack>

      {/* Submission Consent */}
      <Stack
        gap={12}
        padding="md"
        style={{ backgroundColor: colors.bg[theme].default }}
        borderRadius={16}
        borderWidth={1}
        style={{ borderColor: colors.border[theme].default }}
      >
        <Row gap={12} align="flex-start">
          <Checkbox
            checked={hasConsent}
            onChange={(value) => setHasConsent(value === true)}
            disabled={isSubmitting}
            size="sm"
            aria-label="I certify that the information provided is accurate and complete"
          />
          <Stack gap={4} flex={1}>
            <Text style={{ color: colors.text[theme].secondary }}>
              I certify that the information provided is accurate and complete
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              By submitting this application, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Stack>
        </Row>
      </Stack>

      {/* Submit Button */}
      <Button
        size="lg"
        theme="info"
        onPress={onSubmit}
        disabled={isSubmitting || !hasConsent}
        iconStart={isSubmitting ? undefined : Check}
        opacity={!hasConsent ? 0.5 : 1}
      >
        {isSubmitting
          ? isEditMode
            ? 'Updating Application...'
            : 'Submitting Application...'
          : isEditMode
            ? 'Update Application'
            : 'Submit Application'}
      </Button>
    </Stack>
  )
}

/**
 * Helper component for displaying info rows
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={8}>
      <Text style={{ color: colors.text[theme].secondary }}>{label}</Text>
      <Text style={{ color: colors.text[theme].secondary }}>{value}</Text>
    </Stack>
  )
}

/**
 * Helper component for displaying document rows
 */
function DocumentRow({
  type,
  metadata,
  required,
}: {
  type: string
  metadata: AttachmentMetadata
  required: boolean
}) {
  const uploadedDate = metadata.uploaded_at ? new Date(metadata.uploaded_at) : null
  const formattedDate = uploadedDate
    ? uploadedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently uploaded'

  return (
    <Row gap={12} align="center">
      <FileText size="lg" style={{ color: colors.text[theme].info }} />
      <Stack gap={4} flex={1}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>{type}</Text>
          {required && <Text style={{ color: colors.text[theme].error }}>(Required)</Text>}
        </Row>
        <Text style={{ color: colors.text[theme].secondary }}>{metadata.filename}</Text>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>
            {formatFileSize(metadata.size)}
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>•</Text>
          <Text style={{ color: colors.text[theme].secondary }}>Uploaded {formattedDate}</Text>
        </Row>
      </Stack>
    </Row>
  )
}

/**
 * Format answer based on type
 */
function formatAnswer(answer: string | string[] | boolean): string {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  if (typeof answer === 'boolean') {
    return answer ? 'Yes' : 'No'
  }
  return answer
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
