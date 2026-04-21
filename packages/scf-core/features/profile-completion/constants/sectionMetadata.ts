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
    description:
      'Your name, photo, and short intro are the first things employers see. Profiles with a photo and headline receive up to 21× more views and 36× more messages than sparse ones. Spend two minutes here and every other section works harder for you.',
    route: ROUTES.PROFILE.GENERAL.path,
  },
  skills: {
    title: 'Skills',
    description:
      "Skills drive almost every match we make — jobs, communities, and recommended connections all key off this list. The more specific you are, the better we can surface roles that fit instead of generic ones you'll ignore. Even five honest skills meaningfully improves your matches.",
    route: ROUTES.PROFILE.SKILLS.path,
  },
  experience: {
    title: 'Experience',
    description:
      'Recent roles are the fastest way recruiters gauge fit and level. Even one or two entries with a sentence on impact unlocks higher-trust inbound messages and shortens the time you spend explaining yourself later. Add what you have — you can refine it anytime.',
    route: ROUTES.PROFILE.EXPERIENCE.path,
  },
  certifications: {
    title: 'Certifications',
    description:
      "Licenses and certifications unlock searches employers run for verified talent — and they're one of the fastest trust signals on your profile. Members who display credentials publicly see about a 6-point lift in hiring outcomes. Add what you've earned so the right opportunities can find you.",
    route: ROUTES.PROFILE.CERTIFICATIONS.path,
  },
  preferences: {
    title: 'Employment Preferences',
    description:
      "Telling us the roles, locations, and schedules you actually want means we stop showing you the ones you don't. It also quietly filters who can reach out, so your inbox stays relevant. Takes a minute and you can update it anytime your search changes.",
    route: ROUTES.PROFILE.EMPLOYMENT.path,
  },
  education: {
    title: 'Education',
    description:
      'Education adds context recruiters look for when comparing candidates — especially early-career and apprenticeship paths. Even trade schools, bootcamps, and in-progress programs count and strengthen your profile. Add what you have; detail matters more than prestige.',
    route: ROUTES.PROFILE.EDUCATION.path,
  },
}

export function resolveSectionMetadata(section: ProfileWizardStepId): SectionMetadata {
  return COMPLETION_SECTION_METADATA[section]
}
