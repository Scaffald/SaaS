import type { WizardStepPayloads } from '../../hooks/useProfileWizard'
import type { ProfileWizardStepId } from '../../utils/wizardSteps'

export interface StepStateChangePayload<TStep extends ProfileWizardStepId> {
  data: WizardStepPayloads[TStep]
  isValid: boolean
  isDirty: boolean
}

export interface WizardStepComponentProps<TStep extends ProfileWizardStepId> {
  initialData?: WizardStepPayloads[TStep]
  isSaving: boolean
  isLastStep: boolean
  onBack: () => void
  onContinue: (data: WizardStepPayloads[TStep]) => Promise<void>
  onSaveForLater?: (data: WizardStepPayloads[TStep]) => Promise<void>
  onSkip?: () => Promise<void>
  onStepStateChange?: (snapshot: StepStateChangePayload<TStep>) => void
}
