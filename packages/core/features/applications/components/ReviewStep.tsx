import { Button, Separator, Text, XStack, YStack } from 'tamagui'
import { Check, Edit3 } from '@tamagui/lucide-icons'
import type { ScreeningAnswers, CustomQuestionAnswer, AttachmentMetadata } from '@app/schemas'

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
        p="$4"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack justify="space-between" items="center">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Basic Information
          </Text>
          <Button
            size="$3"
            variant="outlined"
            icon={Edit3}
            onPress={() => onEdit('screening')}
            disabled={isSubmitting}
          >
            Edit
          </Button>
        </XStack>

        <Separator />

        <YStack gap="$3">
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
            value={screeningAnswers.years_experience?.toString() || 'Not provided'}
          />
          <InfoRow
            label="Work Authorization"
            value={
              screeningAnswers.is_authorized_to_work
                ? 'Yes, authorized to work'
                : 'Will require sponsorship'
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
          p="$4"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
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
            >
              Edit
            </Button>
          </XStack>

          <Separator />

          <YStack gap="$3">
            {customQuestionAnswers.map((answer) => (
              <InfoRow
                key={answer.question}
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
        p="$4"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack justify="space-between" items="center">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Uploaded Documents
          </Text>
          <Button
            size="$3"
            variant="outlined"
            icon={Edit3}
            onPress={() => onEdit('attachments')}
            disabled={isSubmitting}
          >
            Edit
          </Button>
        </XStack>

        <Separator />

        <YStack gap="$3">
          {Object.keys(attachments).length > 0 ? (
            Object.entries(attachments).map(([type, metadata]) => (
              <XStack key={type} gap="$2" items="center">
                <Check size={20} color="$green10" />
                <YStack gap="$1" flex={1}>
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    {formatAttachmentType(type)}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    {metadata.filename} ({formatFileSize(metadata.size)})
                  </Text>
                </YStack>
              </XStack>
            ))
          ) : (
            <Text fontSize="$3" color="$color10">
              No documents uploaded
            </Text>
          )}
        </YStack>
      </YStack>

      {/* Terms and Conditions */}
      <YStack gap="$2" p="$4" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue7">
        <Text fontSize="$3" color="$color12">
          By submitting this application, you confirm that all information provided is accurate and
          complete. You understand that any false information may result in rejection of your
          application or termination of employment if discovered after hiring.
        </Text>
      </YStack>

      {/* Submit Button */}
      <Button
        size="$5"
        theme="info"
        onPress={onSubmit}
        disabled={isSubmitting}
        icon={isSubmitting ? undefined : Check}
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
    <YStack gap="$1">
      <Text fontSize="$2" fontWeight="600" color="$color11">
        {label}
      </Text>
      <Text fontSize="$3" color="$color12">
        {value}
      </Text>
    </YStack>
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
 * Format attachment type for display
 */
function formatAttachmentType(type: string): string {
  const types: Record<string, string> = {
    resume: 'Resume',
    cover_letter: 'Cover Letter',
    portfolio: 'Portfolio',
    assessment: 'Assessment',
    video_interview: 'Video Interview',
  }
  return types[type] || type
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
