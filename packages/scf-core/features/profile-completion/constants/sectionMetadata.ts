import { ROUTES } from '@scf/core/constants/routes'
import type { ProfileWizardStepId } from '@scf/supabase/client-types'

interface SectionMetadata {
  title: string
  description: string
  route: string
}

export const COMPLETION_SECTION_METADATA: Record<ProfileWizardStepId, SectionMetadata> = {
  general: {
    title: 'General Information',
    description: 'Add your name, headline, and a short introduction',
    route: ROUTES.DASHBOARD.PROFILE.GENERAL.path,
  },
  skills: {
    title: 'Skills',
    description: 'Highlight core skills so we can match you to the right work',
    route: ROUTES.DASHBOARD.PROFILE.SKILLS.path,
  },
  experience: {
    title: 'Experience',
    description: 'Showcase recent roles and impact to boost trust',
    route: ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path,
  },
  certifications: {
    title: 'Certifications',
    description: 'List licenses or certifications to unlock premium searches',
    route: ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path,
  },
  preferences: {
    title: 'Employment Preferences',
    description: 'Share work preferences so we tailor opportunities',
    route: ROUTES.DASHBOARD.PROFILE.EMPLOYMENT.path,
  },
  education: {
    title: 'Education',
    description: 'Document your training and education history',
    route: ROUTES.DASHBOARD.PROFILE.EDUCATION.path,
  },
}

export function resolveSectionMetadata(section: ProfileWizardStepId): SectionMetadata {
  return COMPLETION_SECTION_METADATA[section]
}
