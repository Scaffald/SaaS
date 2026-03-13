import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { ReactNode } from 'react'
import {
  AssessmentStepTransition,
  Button,
  ScrollView,
  Skeleton,
  SkeletonBox,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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

  /**
   * Override completed step tracking (useful when handled externally)
   */
  completedSteps?: Set<string>

  /**
   * Whether to render the header section (title, description, progress)
   */
  showHeader?: boolean

  /**
   * Whether to render the progress indicator inside the header
   */
  showProgressIndicator?: boolean

  /**
   * Orientation of progress indicator when rendered internally
   */
  progressOrientation?: 'horizontal' | 'vertical'

  /**
   * Enable animated step transitions
   * @default false
   */
  animateTransitions?: boolean

  /**
   * Direction of the step transition (1 = forward, -1 = backward)
   * Only used when animateTransitions is true
   * @default 1
   */
  transitionDirection?: 1 | -1
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
  completedSteps: completedStepsOverride,
  showHeader = true,
  showProgressIndicator,
  progressOrientation = 'horizontal',
  animateTransitions = false,
  transitionDirection = 1,
}: AssessmentWizardProps) {
  const { theme } = useThemeContext()
  const currentStepOrder = steps.find((s) => s.id === currentStep)?.order || 0
  const calculatedCompletedSteps = new Set(
    steps.filter((step) => step.order < currentStepOrder).map((step) => step.id)
  )
  const completedSteps = completedStepsOverride ?? calculatedCompletedSteps
  const shouldShowProgress =
    (showProgressIndicator ?? steps.length > 1) && steps.length > 1 && showHeader
  const shouldRenderHeader = showHeader && (title || description || shouldShowProgress || false)

  // Loading state
  if (isLoading) {
    return (
      <Stack gap={16} padding={32}>
        <Skeleton width={200} height={22} shape="text" />
        <SkeletonText lines={3} lastLineWidth="70%" />
        <SkeletonBox width="100%" height={120} borderRadius={12} />
        <SkeletonBox width={140} height={44} borderRadius={8} />
      </Stack>
    )
  }

  // Error state
  if (error) {
    return (
      <Stack flex={1} align="center" justify="center" gap={16} padding={32}>
        <AlertCircle size={48} color="$red10" />
        <Text color="$red11">Error loading assessment</Text>
        <Stack align="center">
          <Text color="$gray11">{error.message || 'An unexpected error occurred'}</Text>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack flex={1}>
      {/* Header */}
      {shouldRenderHeader && (
        <Stack padding="md" gap={12}>
          {(title || description) && (
            <Stack gap={4}>
              {title && <Text color="$gray11">{title}</Text>}
              {description && (
                <Stack align="center">
                  <Text color="$gray11">{description}</Text>
                </Stack>
              )}
            </Stack>
          )}

          {/* Progress Indicator */}
          {shouldShowProgress && (
            <AssessmentProgress
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              completionScore={completionScore}
              orientation={progressOrientation}
            />
          )}
        </Stack>
      )}

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }}>
        <Stack padding="md" gap={16}>
          {animateTransitions ? (
            <AssessmentStepTransition stepKey={currentStep} direction={transitionDirection}>
              {children}
            </AssessmentStepTransition>
          ) : (
            children
          )}
        </Stack>
      </ScrollView>

      {/* Navigation Footer */}
      {(showPrevious || showNext) && (
        <Stack
          padding="md"
          style={{ borderTopWidth: 1, borderTopColor: colors.border[theme].default }}
        >
          <Row gap={12} justify="space-between">
            {showPrevious && (
              <Button size="md" variant="outline" iconStart={ChevronLeft} onPress={onPrevious}>
                Previous
              </Button>
            )}

            {showNext && (
              <Button size="md" iconEnd={ChevronRight} onPress={onNext} disabled={isNextDisabled}>
                Next
              </Button>
            )}
          </Row>
        </Stack>
      )}
    </Stack>
  )
}
