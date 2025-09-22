export type OnboardingStepId = 'basic' | 'roles' | 'education' | 'summary'

export type OnboardingStep = {
  id: OnboardingStepId
  label: string
  description: string
  points: number
}

export const PROFILE_STEPS: OnboardingStep[] = [
  {
    id: 'basic',
    label: 'Basic information',
    description: 'Share contact details and a short summary to introduce yourself.',
    points: 10,
  },
  {
    id: 'roles',
    label: 'Roles and skills',
    description: 'Highlight the experience and skills that match the work you want.',
    points: 10,
  },
  {
    id: 'education',
    label: 'Education and preferences',
    description: 'Let companies know your availability, preferences, and background.',
    points: 10,
  },
  {
    id: 'summary',
    label: 'Welcome to Elevate!',
    description: 'See what comes next and keep growing your Elevate score.',
    points: 0,
  },
]

export const DRIVER_LICENSE_OPTIONS = [
  { value: 'none', label: 'No license' },
  { value: 'clean-record', label: 'I have a clean driving record' },
  { value: 'class-a', label: 'Class A' },
  { value: 'class-b', label: 'Class B' },
  { value: 'class-c', label: 'Class C' },
] as const

export const SKILL_CATEGORIES: { id: string; label: string; skills: string[] }[] = [
  {
    id: 'finishing',
    label: 'Finishing skills',
    skills: [
      'Interior painting',
      'Exterior painting',
      'Trim & moulding',
      'Room & walls',
      'Tile work',
      'Hardwood flooring',
      'Drywall finishing',
      'Cabinet install',
      'Porcelain tile',
    ],
  },
  {
    id: 'sitework',
    label: 'Site work',
    skills: [
      'Concrete forming',
      'Framing',
      'Welding',
      'Equipment operation',
      'Masonry',
      'Scaffolding',
      'Roofing',
      'Landscaping',
    ],
  },
  {
    id: 'safety',
    label: 'Safety & compliance',
    skills: [
      'OSHA 10',
      'OSHA 30',
      'Confined space',
      'CPR & first aid',
      'Lockout/tagout',
      'Fall protection',
    ],
  },
]

export const EDUCATION_OPTIONS = [
  'High school diploma or equivalent',
  'Trade school certificate',
  'Associate degree',
  'Bachelor’s degree',
  'Master’s degree',
  'Doctorate',
] as const

export const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone call' },
  { value: 'sms', label: 'SMS' },
  { value: 'app', label: 'Mobile app' },
] as const

export const PHONE_OS_OPTIONS = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
] as const

export const AVAILABILITY_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Weekend',
  'Night shift',
  'Temporary',
] as const

export const SUMMARY_TASKS = [
  {
    id: 'photo',
    label: 'Upload your profile photo',
    ctaLabel: 'Upload photo',
    points: 10,
  },
  {
    id: 'basic',
    label: 'Basic information',
    ctaLabel: 'Review',
    points: 10,
  },
  {
    id: 'roles',
    label: 'Roles and skills',
    ctaLabel: 'Review',
    points: 10,
  },
  {
    id: 'education',
    label: 'Education and preferences',
    ctaLabel: 'Review',
    points: 10,
  },
  {
    id: 'projects',
    label: 'Projects & Teams',
    description: 'List experiences and describe your responsibilities.',
    ctaLabel: 'Add projects',
    points: 10,
  },
  {
    id: 'certifications',
    label: 'Certifications',
    description: 'Add licenses and certificates you have earned.',
    ctaLabel: 'Add certificate',
    points: 10,
  },
  {
    id: 'open-to-work',
    label: 'Open to work',
    description: 'Activate your profile to make it visible to companies.',
    ctaLabel: 'Activate',
    points: 10,
  },
] as const
