import type { ReactNode } from 'react'
import { Button, ScrollView, Text, XStack, YStack, Spinner } from 'tamagui'
import { AlertCircle, ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { AssessmentProgress, type AssessmentStep } from './AssessmentProgress'

export interface AssessmentWizardProps {
  /**
   * Title of the assessment (optional - can be omitted if content provides its own title)
   */
  title?: string

  /**
   * Description of the assessment (optional - can be omitted if content provides its own description)
   */
  description?: string

  /**
   * Steps in the assessment
   */
  steps: AssessmentStep[]

  /**
   * Current step ID
   */
  currentStep: string

  /**
   * Completion percentage (0-100)
   */
  completionScore?: number

  /**
   * Whether the wizard is loading
   */
  isLoading?: boolean

  /**
   * Error message if any
   */
  error?: Error | null

  /**
   * Whether to show previous button
   */
  showPrevious?: boolean

  /**
   * Whether to show next button
   */
  showNext?: boolean

  /**
   * Whether next button is disabled
   */
  isNextDisabled?: boolean

  /**
   * Callback when previous is clicked
   */
  onPrevious?: () => void

  /**
   * Callback when next is clicked
   */
  onNext?: () => void

  /**
   * Step content to render
   */
  children: ReactNode
}

/**
 * AssessmentWizard - Shared wizard container for assessments
 * Provides consistent layout, progress indicator, and navigation
 */
export function AssessmentWizard({
  title,
  description,
  steps,
  currentStep,
  completionScore = 0,
  isLoading = false,
  error,
  showPrevious = false,
  showNext = false,
  isNextDisabled = false,
  onPrevious,
  onNext,
  children,
}: AssessmentWizardProps) {
  const currentStepOrder = steps.find((s) => s.id === currentStep)?.order || 0
  const completedSteps = new Set(
    steps.filter((step) => step.order < currentStepOrder).map((step) => step.id)
  )

  // Loading state
  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$4" p="$8">
        <Spinner size="large" />
        <Text color="$color11">Loading assessment...</Text>
      </YStack>
    )
  }

  // Error state
  if (error) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$4" p="$8">
        <AlertCircle size={48} color="$red10" />
        <Text fontSize="$5" fontWeight="600" color="$red11">
          Error loading assessment
        </Text>
        <YStack items="center">
          <Text fontSize="$3" color="$color11">
            {error.message || 'An unexpected error occurred'}
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1}>
      {/* Header */}
      {(title || description || steps.length > 1) && (
        <YStack p="$4" gap="$3">
          {(title || description) && (
            <YStack gap="$1">
              {title && (
                <Text fontSize="$7" fontWeight="bold" color="$color12">
                  {title}
                </Text>
              )}
              {description && (
                <YStack items="center">
                  <Text fontSize="$3" color="$color11">
                    {description}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}

          {/* Progress Indicator */}
          {steps.length > 1 && (
            <AssessmentProgress
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              completionScore={completionScore}
            />
          )}
        </YStack>
      )}

      {/* Main Content */}
      <ScrollView flex={1}>
        <YStack p="$4" gap="$4">
          {children}
        </YStack>
      </ScrollView>

      {/* Navigation Footer */}
      {(showPrevious || showNext) && (
        <YStack p="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <XStack gap="$3" justify="space-between">
            {showPrevious && (
              <Button size="$4" variant="outlined" icon={ChevronLeft} onPress={onPrevious}>
                Previous
              </Button>
            )}

            {showNext && (
              <Button size="$4" iconAfter={ChevronRight} onPress={onNext} disabled={isNextDisabled}>
                Next
              </Button>
            )}
          </XStack>
        </YStack>
      )}
    </YStack>
  )
}
