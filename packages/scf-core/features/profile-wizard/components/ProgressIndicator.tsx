import { memo, useMemo } from 'react'
import { Progress, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { ProfileWizardStepId } from '../utils/wizardSteps'
import { PROFILE_WIZARD_STEP_META, PROFILE_WIZARD_STEPS } from '../utils/wizardSteps'

export interface WizardProgressIndicatorProps {
  currentStep: ProfileWizardStepId
  completedSteps: ProfileWizardStepId[]
  completionPercentage: number
  showStepLabels?: boolean
}

export const ProgressIndicator = memo(function ProgressIndicator({
  currentStep,
  completedSteps,
  completionPercentage,
  showStepLabels = true,
}: WizardProgressIndicatorProps) {
  const orderedSteps = useMemo(() => PROFILE_WIZARD_STEPS, [])

  return (
    <Stack gap="$3" aria-live="polite">
      <Row justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" fontWeight="700">
          Step {orderedSteps.indexOf(currentStep) + 1} of {orderedSteps.length}
        </Text>
        <Text fontSize="$3" color="$color11">
          {completionPercentage}%
        </Text>
      </Row>

      <Progress size="$2" value={completionPercentage} max={100} backgroundColor="$color3">
        <Progress.Indicator animation="bouncy" backgroundColor="$blue10" />
      </Progress>

      {showStepLabels && (
        <Row gap="$3" alignItems="flex-start" marginTop="$2" flexWrap="wrap">
          {orderedSteps.map((stepId, index) => {
            const meta = PROFILE_WIZARD_STEP_META[stepId]
            const isCompleted = completedSteps.includes(stepId)
            const isCurrent = currentStep === stepId

            return (
              <Row key={stepId} gap="$2" alignItems="center">
                <Stack
                  width={32}
                  height={32}
                  backgroundColor={isCurrent ? '$blue10' : isCompleted ? '$green9' : '$color5'}
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="$3"
                  role="img"
                  aria-label={`${meta.title} ${isCurrent ? '(current step)' : isCompleted ? '(completed)' : '(not completed)'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <Text fontWeight="600" color="$color1">
                    {index + 1}
                  </Text>
                </Stack>
                <Stack style={{ maxWidth: 160 }}>
                  <Text fontSize="$3" fontWeight={isCurrent ? '700' : '600'} color="$color12">
                    {meta.title}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    {meta.estimatedTimeMinutes} min
                  </Text>
                </Stack>
                {index < orderedSteps.length - 1 && <Separator vertical aria-hidden={true} />}
              </Row>
            )
          })}
        </Row>
      )}
    </Stack>
  )
})
