import { Resource } from './base.js'

export type ProfileWizardStepId =
  | 'general'
  | 'skills'
  | 'experience'
  | 'certifications'
  | 'preferences'
  | 'education'

export interface ProfileWizardProgress {
  currentStep: ProfileWizardStepId
  completedSteps: ProfileWizardStepId[]
  completionPercentage: number
  lastSavedAt: string | null
  requiredSteps: ProfileWizardStepId[]
  completedAt?: string | null
  stepData: Record<string, unknown>
}

export interface ProfileWizardSaveStepParams {
  step: ProfileWizardStepId
  data: Record<string, unknown>
  skip?: boolean
}

export interface ProfileWizardCompleteParams {
  celebrate?: boolean
}

export class ProfileWizard extends Resource {
  async getProgress(): Promise<ProfileWizardProgress> {
    return this.get<ProfileWizardProgress>('/v1/profile-wizard/progress')
  }

  async saveStep(params: ProfileWizardSaveStepParams): Promise<ProfileWizardProgress> {
    return this.post<ProfileWizardProgress>('/v1/profile-wizard/save-step', params)
  }

  async complete(params?: ProfileWizardCompleteParams): Promise<ProfileWizardProgress> {
    return this.post<ProfileWizardProgress>('/v1/profile-wizard/complete', params ?? {})
  }
}
