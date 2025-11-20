import { z } from 'zod'

export const PROFILE_WIZARD_STEPS = [
  'general',
  'skills',
  'experience',
  'certifications',
  'preferences',
  'education',
] as const

export type ProfileWizardStepId = (typeof PROFILE_WIZARD_STEPS)[number]

export interface ProfileWizardStepMeta {
  id: ProfileWizardStepId
  title: string
  description: string
  estimatedTimeMinutes: number
  optional?: boolean
}

export const PROFILE_WIZARD_STEP_META: Record<ProfileWizardStepId, ProfileWizardStepMeta> = {
  general: {
    id: 'general',
    title: 'General Info',
    description: 'Introduce yourself with your name, headline, and a short bio',
    estimatedTimeMinutes: 2,
  },
  skills: {
    id: 'skills',
    title: 'Core Skills',
    description: 'Highlight the top skills that represent your expertise',
    estimatedTimeMinutes: 2,
  },
  experience: {
    id: 'experience',
    title: 'Recent Experience',
    description: 'Share your most recent role and accomplishments',
    estimatedTimeMinutes: 3,
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    description: 'Add any certifications or licenses you hold',
    estimatedTimeMinutes: 2,
    optional: true,
  },
  preferences: {
    id: 'preferences',
    title: 'Work Preferences',
    description: 'Tell us where and how you prefer to work',
    estimatedTimeMinutes: 2,
  },
  education: {
    id: 'education',
    title: 'Education',
    description: 'List your highest level of education or training',
    estimatedTimeMinutes: 2,
    optional: true,
  },
}

export const profileWizardStepSchema = z.enum(PROFILE_WIZARD_STEPS)

export type ProfileWizardStepSchema = z.infer<typeof profileWizardStepSchema>

export interface WizardStepStatus {
  id: ProfileWizardStepId
  completed: boolean
  required: boolean
}

export interface ProfileWizardProgress {
  currentStep: ProfileWizardStepId
  completedSteps: ProfileWizardStepId[]
  completionPercentage: number
  lastSavedAt: string | null
  requiredSteps: ProfileWizardStepId[]
}

export const DEFAULT_WIZARD_PROGRESS: ProfileWizardProgress = {
  currentStep: 'general',
  completedSteps: [],
  completionPercentage: 0,
  lastSavedAt: null,
  requiredSteps: PROFILE_WIZARD_STEPS.filter((step) => !PROFILE_WIZARD_STEP_META[step].optional),
}
