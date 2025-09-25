import { Tables, type Database } from '@app/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import {
  DRIVER_LICENSE_OPTIONS,
  PROFILE_STEPS,
  type OnboardingStepId,
} from './data'
import type { useUser } from '@app/core/utils/useUser'

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9]+$/.test(value), `${label} must be a whole number`)

const currencyString = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), 'Enter a valid rate')

export const OnboardingSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .max(32)
      .optional()
      .refine((value) => !value || /^[0-9+()\-\s]+$/.test(value), 'Enter a valid phone number'),
    about: z.string().trim().max(600).optional(),
    location: z.string().trim().max(120).optional(),
    openToTravel: z.boolean(),
    travelMileage: numericString('Mileage'),
    usResident: z.boolean(),
    usPassport: z.boolean(),
    driversLicense: z.enum(
      DRIVER_LICENSE_OPTIONS.map((option) => option.value) as [string, ...string[]]
    ),
    veteran: z.boolean(),
    yearsExperience: z
      .string()
      .trim()
      .min(1, 'Enter your years of experience')
      .refine((value) => /^[0-9]+$/.test(value), 'Enter a whole number'),
    jobTitle: z.string().trim().min(1, 'Job title is required'),
    primarySkills: z.array(z.string()).min(1, 'Select at least one skill'),
    educationLevel: z.string().trim().min(1, 'Select your education level'),
    certifications: z.string().trim().optional(),
    contactMethods: z.array(z.string()).min(1, 'Select at least one contact method'),
    phoneOs: z.string().trim().min(1, 'Select your phone type'),
    availability: z.array(z.string()),
    hourlyRate: currencyString,
  })
  .superRefine((values, ctx) => {
    if (values.openToTravel && values.travelMileage.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter how many miles you are willing to travel',
        path: ['travelMileage'],
      })
    }
  })

export type OnboardingFormValues = z.infer<typeof OnboardingSchema>

export const defaultValues: OnboardingFormValues = {
  phone: '',
  about: '',
  location: '',
  openToTravel: false,
  travelMileage: '',
  usResident: false,
  usPassport: false,
  driversLicense: DRIVER_LICENSE_OPTIONS[0]?.value ?? 'none',
  veteran: false,
  yearsExperience: '',
  jobTitle: '',
  primarySkills: [],
  educationLevel: '',
  certifications: '',
  contactMethods: [],
  phoneOs: '',
  availability: [],
  hourlyRate: '',
}

export const STEP_FIELDS: Record<Exclude<OnboardingStepId, 'summary'>, (keyof OnboardingFormValues)[]> = {
  basic: [
    'phone',
    'about',
    'location',
    'openToTravel',
    'travelMileage',
    'usResident',
    'usPassport',
    'driversLicense',
    'veteran',
  ],
  roles: ['yearsExperience', 'jobTitle', 'primarySkills'],
  education: [
    'educationLevel',
    'certifications',
    'contactMethods',
    'phoneOs',
    'availability',
    'hourlyRate',
  ],
}

export const stepOrder = PROFILE_STEPS.map((step) => step.id)

export const computeScore = (completed: OnboardingStepId[], hasAvatar: boolean) => {
  const base = completed.filter((step) => step !== 'summary').length * 10
  const avatarBonus = hasAvatar ? 2 : 0
  return Math.min(100, base + avatarBonus)
}

export const sanitizeCertifications = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)

export const buildSkillsArray = (skillsSummary: Tables<'users'>['skills_summary']) => {
  if (!skillsSummary) return []
  if (Array.isArray(skillsSummary)) {
    return skillsSummary.filter((value): value is string => typeof value === 'string')
  }
  if (typeof skillsSummary === 'object' && skillsSummary !== null) {
    const primary = (skillsSummary as { primary?: unknown }).primary
    if (Array.isArray(primary)) {
      return primary.filter((value): value is string => typeof value === 'string')
    }
  }
  return []
}

export const determineCompletedSteps = (values: OnboardingFormValues): OnboardingStepId[] => {
  const complete: OnboardingStepId[] = []
  if (values.phone || values.about || values.location || values.usResident || values.usPassport) {
    complete.push('basic')
  }
  if (values.yearsExperience && values.jobTitle && values.primarySkills.length > 0) {
    complete.push('roles')
  }
  if (
    values.educationLevel ||
    values.contactMethods.length > 0 ||
    values.availability.length > 0 ||
    values.hourlyRate
  ) {
    complete.push('education')
  }
  return complete
}

export type OnboardingProfile = {
  user: Tables<'users'> | null
  privateProfile: Tables<'user_private'> | null
}

export type UserProfile = ReturnType<typeof useUser>['profile']

export const buildFormValues = ({
  onboardingProfile,
  profile,
}: {
  onboardingProfile: OnboardingProfile | null
  profile: UserProfile
}): OnboardingFormValues => {
  if (!onboardingProfile) return defaultValues

  const skills = buildSkillsArray(onboardingProfile.user?.skills_summary ?? null)
  const certifications = onboardingProfile.privateProfile?.certifications ?? []
  const hourlyRate = onboardingProfile.privateProfile?.hourly_rate_cents ?? null

  return {
    phone: onboardingProfile.privateProfile?.phone ?? '',
    about: profile?.about ?? onboardingProfile.user?.bio ?? '',
    location: onboardingProfile.privateProfile?.location ?? '',
    openToTravel: onboardingProfile.privateProfile?.open_to_travel ?? false,
    travelMileage: onboardingProfile.privateProfile?.travel_mileage?.toString() ?? '',
    usResident: onboardingProfile.privateProfile?.us_resident ?? false,
    usPassport: onboardingProfile.privateProfile?.us_passport ?? false,
    driversLicense:
      onboardingProfile.privateProfile?.drivers_license_class ??
      DRIVER_LICENSE_OPTIONS[0]?.value ??
      'none',
    veteran: onboardingProfile.privateProfile?.veteran ?? false,
    yearsExperience:
      onboardingProfile.user?.years_of_experience != null
        ? String(onboardingProfile.user.years_of_experience)
        : '',
    jobTitle: onboardingProfile.user?.headline ?? '',
    primarySkills: skills,
    educationLevel: onboardingProfile.privateProfile?.education_level ?? '',
    certifications: certifications.join('\n'),
    contactMethods: onboardingProfile.privateProfile?.contact_prefs ?? [],
    phoneOs: onboardingProfile.privateProfile?.phone_os ?? '',
    availability: onboardingProfile.privateProfile?.availability ?? [],
    hourlyRate:
      hourlyRate != null ? (hourlyRate / 100).toFixed(hourlyRate % 100 === 0 ? 0 : 2) : '',
  }
}

export const fetchOnboardingProfile = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OnboardingProfile> => {
  const [{ data: userRow, error: userError }, { data: privateRow, error: privateError }] =
    await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_private').select('*').eq('user_id', userId).maybeSingle(),
    ])

  if (userError) throw new Error(userError.message)
  if (privateError) throw new Error(privateError.message)

  return { user: userRow ?? null, privateProfile: privateRow ?? null }
}

export const isOnboardingComplete = (completedSteps: OnboardingStepId[]) =>
  PROFILE_STEPS.filter((step) => step.id !== 'summary').every((step) =>
    completedSteps.includes(step.id)
  )
