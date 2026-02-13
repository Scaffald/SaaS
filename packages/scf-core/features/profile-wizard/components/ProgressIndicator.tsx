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
    <Stack gap={12} aria-live="polite">
      <Row justify="space-between" align="center">
        <Text>
          Step {orderedSteps.indexOf(currentStep) + 1} of {orderedSteps.length}
        </Text>
        <Text color="$gray11">{completionPercentage}%</Text>
      </Row>

      <Progress size="xs" value={completionPercentage} max={100} backgroundColor="$color3">
        <Progress.Indicator animation="bouncy" backgroundColor="$blue10" />
      </Progress>

      {showStepLabels && (
        <Row gap={12} align="flex-start" marginTop={8} flexWrap="wrap">
          {orderedSteps.map((stepId, index) => {
            const meta = PROFILE_WIZARD_STEP_META[stepId]
            const isCompleted = completedSteps.includes(stepId)
            const isCurrent = currentStep === stepId

            return (
              <Row key={stepId} gap={8} align="center">
                <Stack
                  width={32}
                  height={32}
                  backgroundColor={isCurrent ? '$blue10' : isCompleted ? '$green9' : '$color5'}
                  align="center"
                  justify="center"
                  borderRadius={12}
                  role="img"
                  aria-label={`${meta.title} ${isCurrent ? '(current step)' : isCompleted ? '(completed)' : '(not completed)'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <Text color="$gray11">{index + 1}</Text>
                </Stack>
                <Stack style={{ maxWidth: 160 }}>
                  <Text color="$gray11">{meta.title}</Text>
                  <Text color="$gray11">{meta.estimatedTimeMinutes} min</Text>
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
