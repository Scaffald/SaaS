import { useState } from 'react'
import { Dialog, YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { X } from '@tamagui/lucide-icons'
import type { ScreeningAnswers } from '@app/schemas'

export interface QuickApplyModalProps {
  /**
   * Job ID to apply for
   */
  jobId: string

  /**
   * Job title for display
   */
  jobTitle: string

  /**
   * Organization name for display
   */
  organizationName: string

  /**
   * Whether the modal is open
   */
  open: boolean

  /**
   * Callback when modal open state changes
   */
  onOpenChange: (open: boolean) => void

  /**
   * Callback when application is successfully submitted
   */
  onSuccess?: (applicationId: string) => void

  /**
   * Required skills from job (display only)
   */
  requiredSkills?: string[]

  /**
   * Optional/preferred skills from job (display only)
   */
  optionalSkills?: string[]
}

/**
 * QuickApplyModal - Simplified application flow for jobs with only screening questions
 *
 * Features:
 * - Single-step form with all screening questions
 * - No progress indicator (single step)
 * - No document uploads
 * - No review step
 * - Optimized for speed and mobile experience
 */
export function QuickApplyModal({
  jobId: _jobId,
  jobTitle,
  organizationName,
  open,
  onOpenChange,
  onSuccess: _onSuccess,
  requiredSkills: _requiredSkills = [],
  optionalSkills: _optionalSkills = [],
}: QuickApplyModalProps) {
  const [_formData, setFormData] = useState<Partial<ScreeningAnswers>>({
    current_location: '',
    willing_to_relocate: false,
    years_experience: undefined,
    is_authorized_to_work: false,
    earliest_start_date: '',
  })
  const [_errors, setErrors] = useState<Partial<Record<keyof ScreeningAnswers, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    setFormData({
      current_location: '',
      willing_to_relocate: false,
      years_experience: undefined,
      is_authorized_to_work: false,
      earliest_start_date: '',
    })
    setErrors({})
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    // Validation will be implemented in Task 2
    // Submission logic will be implemented in Task 3
  }

  return (
    <Dialog modal open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width="90%"
          maxWidth={600}
          maxHeight="90%"
        >
          {/* Header */}
          <YStack gap="$2">
            <XStack justify="space-between" items="center">
              <YStack flex={1} gap="$1">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  Apply to {organizationName}
                </Text>
                <Text fontSize="$4" color="$color11">
                  {jobTitle}
                </Text>
              </YStack>
              <Dialog.Close asChild>
                <Button size="$3" circular icon={X} chromeless />
              </Dialog.Close>
            </XStack>
          </YStack>

          {/* Form Content - Will be implemented in Task 2 */}
          <ScrollView showsVerticalScrollIndicator={false} flex={1}>
            <YStack gap="$4" p="$4">
              <Text fontSize="$4" color="$color11">
                Form fields will be added in Task 2
              </Text>
            </YStack>
          </ScrollView>

          {/* Footer */}
          <XStack gap="$3" justify="flex-end" pt="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button size="$4" variant="outlined" onPress={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="$4" theme="info" onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

