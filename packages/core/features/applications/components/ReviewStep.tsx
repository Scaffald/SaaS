import { useState } from 'react'
import { Button, Separator, Text, XStack, YStack } from 'tamagui'
import { Check, Edit3, FileText } from '@tamagui/lucide-icons'
import type { ScreeningAnswers, CustomQuestionAnswer, AttachmentMetadata } from '@app/schemas'
import { Checkbox } from '@app/ui'

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

  return (
    <YStack gap="$6" width="100%" maxW={800} p="$4">
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          Review Your Application
        </Text>
        <Text fontSize="$4" color="$color11">
          Please review your information carefully before submitting.
        </Text>
      </YStack>

      {/* Screening Information Section */}
      <YStack
        gap="$4"
        bg="$background"
        p="$6"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        shadowColor="$gray4"
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={0.1}
        shadowRadius={3}
      >
        <XStack justify="space-between" items="center">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Screening Questions
          </Text>
          <Button
            size="$3"
            variant="outlined"
            icon={Edit3}
            onPress={() => onEdit('screening')}
            disabled={isSubmitting}
            chromeless
          >
            <Text fontSize="$3" color="$blue10" fontWeight="500">
              Edit
            </Text>
          </Button>
        </XStack>

        <Separator />

        <YStack gap="$4">
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
        </YStack>
      </YStack>

      {/* Custom Questions Section */}
      {customQuestionAnswers.length > 0 && (
        <YStack
          gap="$4"
          bg="$background"
          p="$6"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
          shadowColor="$gray4"
          shadowOffset={{ width: 0, height: 1 }}
          shadowOpacity={0.1}
          shadowRadius={3}
        >
          <XStack justify="space-between" items="center">
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Additional Questions
            </Text>
            <Button
              size="$3"
              variant="outlined"
              icon={Edit3}
              onPress={() => onEdit('questions')}
              disabled={isSubmitting}
              chromeless
            >
              <Text fontSize="$3" color="$blue10" fontWeight="500">
                Edit
              </Text>
            </Button>
          </XStack>

          <Separator />

          <YStack gap="$4">
            {customQuestionAnswers.map((answer, index) => (
              <InfoRow
                key={answer.question_id || index}
                label={answer.question}
                value={formatAnswer(answer.answer)}
              />
            ))}
          </YStack>
        </YStack>
      )}

      {/* Attachments Section */}
      <YStack
        gap="$4"
        bg="$background"
        p="$6"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        shadowColor="$gray4"
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={0.1}
        shadowRadius={3}
      >
        <XStack justify="space-between" items="center">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Documents
          </Text>
          <Button
            size="$3"
            variant="outlined"
            icon={Edit3}
            onPress={() => onEdit('attachments')}
            disabled={isSubmitting}
            chromeless
          >
            <Text fontSize="$3" color="$blue10" fontWeight="500">
              Edit
            </Text>
          </Button>
        </XStack>

        <Separator />

        <YStack gap="$4">
          {attachments.resume ? (
            <DocumentRow
              type="Resume"
              metadata={attachments.resume}
              required
            />
          ) : (
            <Text fontSize="$3" color="$color10">
              Resume: Not provided
            </Text>
          )}

          {attachments.cover_letter ? (
            <DocumentRow
              type="Cover Letter"
              metadata={attachments.cover_letter}
              required={false}
            />
          ) : (
            <Text fontSize="$3" color="$color10">
              Cover Letter: Not provided
            </Text>
          )}

          {attachments.portfolio && (
            <DocumentRow
              type="Portfolio"
              metadata={attachments.portfolio}
              required={false}
            />
          )}
        </YStack>
      </YStack>

      {/* Submission Consent */}
      <YStack gap="$3" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <XStack gap="$3" items="flex-start">
          <Checkbox
            checked={hasConsent}
            onCheckedChange={setHasConsent}
            disabled={isSubmitting}
            size="medium"
            ariaLabel="I certify that the information provided is accurate and complete"
          />
          <YStack gap="$1" flex={1}>
            <Text fontSize="$4" fontWeight="500" color="$color12">
              I certify that the information provided is accurate and complete
            </Text>
            <Text fontSize="$2" color="$color11">
              By submitting this application, you agree to our Terms of Service and Privacy Policy
            </Text>
          </YStack>
        </XStack>
      </YStack>

      {/* Submit Button */}
      <Button
        size="$5"
        theme="info"
        onPress={onSubmit}
        disabled={isSubmitting || !hasConsent}
        icon={isSubmitting ? undefined : Check}
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
    </YStack>
  )
}

/**
 * Helper component for displaying info rows
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <YStack gap="$2">
      <Text fontSize="$3" fontWeight="400" color="$gray11">
        {label}
      </Text>
      <Text fontSize="$4" fontWeight="500" color="$color12">
        {value}
      </Text>
    </YStack>
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
  const uploadedDate = metadata.uploaded_at
    ? new Date(metadata.uploaded_at)
    : null
  const formattedDate = uploadedDate
    ? uploadedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently uploaded'

  return (
    <XStack gap="$3" items="center">
      <FileText size={20} color="$blue10" />
      <YStack gap="$1" flex={1}>
        <XStack gap="$2" items="center">
          <Text fontSize="$4" fontWeight="500" color="$color12">
            {type}
          </Text>
          {required && (
            <Text fontSize="$2" color="$red10">
              (Required)
            </Text>
          )}
        </XStack>
        <Text fontSize="$3" color="$color11">
          {metadata.filename}
        </Text>
        <XStack gap="$2" items="center">
          <Text fontSize="$2" color="$color10">
            {formatFileSize(metadata.size)}
          </Text>
          <Text fontSize="$2" color="$color10">
            •
          </Text>
          <Text fontSize="$2" color="$color10">
            Uploaded {formattedDate}
          </Text>
        </XStack>
      </YStack>
    </XStack>
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
