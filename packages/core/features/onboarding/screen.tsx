import {
  Button,
  Checkbox,
  FormWrapper,
  FullscreenSpinner,
  H2,
  H4,
  Input,
  Paragraph,
  Separator,
  SizableText,
  Switch,
  TextArea,
  XStack,
  YStack,
  useToastController,
} from '@app/ui'
import {
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  SkipForward,
  Sparkles,
} from '@tamagui/lucide-icons'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import { Controller, useForm } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Tables } from '@app/supabase/types'
import { z } from 'zod'

import {
  AVAILABILITY_OPTIONS,
  CONTACT_METHODS,
  DRIVER_LICENSE_OPTIONS,
  EDUCATION_OPTIONS,
  PHONE_OS_OPTIONS,
  OnboardingStepId,
  PROFILE_STEPS,
  SKILL_CATEGORIES,
  SUMMARY_TASKS,
} from './data'
import { useOnboardingProfile, type OnboardingProfile } from './hooks/useOnboardingProfile'

const SIDEBAR_STEPS: Array<{ id: 'sign-up' | OnboardingStepId; label: string }> = [
  { id: 'sign-up', label: 'Sign up' },
  ...PROFILE_STEPS.map((step) => ({ id: step.id, label: step.label })),
]

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9]+$/.test(value), `${label} must be a whole number`)

const currencyString = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), 'Enter a valid rate')

export const BasicInformationSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    phone: z
      .string()
      .trim()
      .max(32)
      .optional()
      .refine((value) => !value || /^[0-9+()\-\s]+$/.test(value), 'Enter a valid phone number'),
    about: z.string().trim().max(600).optional(),
    location: z
      .string()
      .trim()
      .min(1, 'Location is required')
      .max(120, 'Location must be shorter than 120 characters'),
    openToTravel: z.boolean(),
    travelMileage: numericString('Mileage'),
    usResident: z.boolean(),
    usPassport: z.boolean(),
    driversLicense: z.enum(
      DRIVER_LICENSE_OPTIONS.map((option) => option.value) as [string, ...string[]]
    ),
    veteran: z.boolean(),
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

const AdditionalOnboardingSchema = z.object({
  yearsExperience: numericString('Years of experience'),
  jobTitle: z.string().trim(),
  primarySkills: z.array(z.string()),
  educationLevel: z.string().trim(),
  certifications: z.string().trim().optional(),
  contactMethods: z.array(z.string()),
  phoneOs: z.string().trim(),
  availability: z.array(z.string()),
  hourlyRate: currencyString,
})

export const OnboardingSchema = BasicInformationSchema.merge(AdditionalOnboardingSchema)

export type OnboardingFormValues = z.infer<typeof OnboardingSchema>
export const BASIC_INFORMATION_KEYS = [
  'firstName',
  'lastName',
  'phone',
  'about',
  'location',
  'openToTravel',
  'travelMileage',
  'usResident',
  'usPassport',
  'driversLicense',
  'veteran',
] as const satisfies readonly (keyof OnboardingFormValues)[]

export type BasicInformationValues = Pick<
  OnboardingFormValues,
  (typeof BASIC_INFORMATION_KEYS)[number]
>

export const basicInformationDefaultValues: BasicInformationValues = {
  firstName: '',
  lastName: '',
  phone: '',
  about: '',
  location: '',
  openToTravel: false,
  travelMileage: '',
  usResident: false,
  usPassport: false,
  driversLicense: DRIVER_LICENSE_OPTIONS[0]?.value ?? 'none',
  veteran: false,
}

export const onboardingDefaultValues: OnboardingFormValues = {
  ...basicInformationDefaultValues,
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

type UserProfile = ReturnType<typeof useUser>['profile']

const STEP_FIELDS: Record<Exclude<OnboardingStepId, 'summary'>, (keyof OnboardingFormValues)[]> = {
  basic: [...BASIC_INFORMATION_KEYS],
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

const stepOrder = PROFILE_STEPS.map((step) => step.id)

const computeScore = (completed: OnboardingStepId[], hasAvatar: boolean) => {
  const base = completed.filter((step) => step !== 'summary').length * 10
  const avatarBonus = hasAvatar ? 2 : 0
  return Math.min(100, base + avatarBonus)
}

const sanitizeCertifications = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)

const buildSkillsArray = (skillsSummary: Tables<'users'>['skills_summary']) => {
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

export const isBasicInformationComplete = (values: OnboardingFormValues) =>
  Boolean(values.firstName.trim() && values.lastName.trim() && values.location.trim())

const determineInitialCompletion = (values: OnboardingFormValues): OnboardingStepId[] => {
  const complete: OnboardingStepId[] = []
  if (isBasicInformationComplete(values)) {
    complete.push('basic')
  }
  if (values.yearsExperience || values.jobTitle.trim() || values.primarySkills.length > 0) {
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

export const createOnboardingValuesFromProfile = ({
  onboardingProfile,
  profile,
}: {
  onboardingProfile: OnboardingProfile | undefined
  profile: UserProfile
}): OnboardingFormValues => {
  if (!onboardingProfile) {
    return onboardingDefaultValues
  }

  const skills = buildSkillsArray(onboardingProfile.user?.skills_summary ?? null)
  const certifications = onboardingProfile.privateProfile?.certifications ?? []
  const hourlyRate = onboardingProfile.privateProfile?.hourly_rate_cents ?? null

  const displayName = onboardingProfile.user?.display_name ?? profile?.name ?? ''
  const trimmedDisplayName = displayName?.trim() ?? ''
  const [displayFirstName, ...displayLastParts] = trimmedDisplayName.split(/\s+/)
  const fallbackFirstName = onboardingProfile.privateProfile?.first_name?.trim()
  const fallbackLastName = onboardingProfile.privateProfile?.last_name?.trim()

  return {
    ...onboardingDefaultValues,
    firstName: fallbackFirstName || displayFirstName || '',
    lastName: fallbackLastName || displayLastParts.join(' ') || '',
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

export const pickBasicInformation = (
  values: OnboardingFormValues
): BasicInformationValues => {
  return BASIC_INFORMATION_KEYS.reduce((acc, key) => {
    acc[key] = values[key]
    return acc
  }, {} as BasicInformationValues)
}

export const persistBasicInformation = async ({
  supabase,
  userId,
  values,
  updateProfile,
}: {
  supabase: ReturnType<typeof useSupabase>
  userId: string
  values: BasicInformationValues
  updateProfile?: () => Promise<unknown> | void
}) => {
  const about = values.about?.trim() || null
  const travelMileage = values.openToTravel && values.travelMileage
    ? Number(values.travelMileage)
    : null
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim() || null

  const [{ error: profileError }, { error: userError }, { error: privateError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .update({ about, name: fullName })
        .eq('id', userId),
      supabase
        .from('users')
        .update({ bio: about, display_name: fullName })
        .eq('id', userId),
      supabase
        .from('user_private')
        .upsert(
          {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone: values.phone?.trim() || null,
            location: values.location.trim(),
            open_to_travel: values.openToTravel,
            travel_mileage: travelMileage,
            us_resident: values.usResident,
            us_passport: values.usPassport,
            drivers_license_class: values.driversLicense,
            veteran: values.veteran,
          },
          { onConflict: 'user_id' }
        ),
    ])

  if (profileError) throw new Error(profileError.message)
  if (userError) throw new Error(userError.message)
  if (privateError) throw new Error(privateError.message)

  await updateProfile?.()
}

export const OnboardingFlowScreen = () => {
  const router = useRouter()
  const toast = useToastController()
  const supabase = useSupabase()
  const { user, profile, isPending: isUserPending, updateProfile } = useUser()
  const [activeStep, setActiveStep] = useState<OnboardingStepId>('basic')
  const [completedSteps, setCompletedSteps] = useState<OnboardingStepId[]>([])

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: onboardingDefaultValues,
    mode: 'onBlur',
  })

  const watchedValues = form.watch()

  const { data: onboardingProfile, isPending: isProfilePending } = useOnboardingProfile(
    user?.id
  )

  const computedValues = useMemo(
    () => createOnboardingValuesFromProfile({ onboardingProfile, profile }),
    [onboardingProfile, profile]
  )

  useEffect(() => {
    if (!user?.id) return
    if (!onboardingProfile) return

    form.reset(computedValues)
    setCompletedSteps(determineInitialCompletion(computedValues))
  }, [computedValues, form, onboardingProfile, user?.id])

  const mutation = useMutation({
    mutationFn: async (step: OnboardingStepId) => {
      if (!user?.id) throw new Error('You need to be signed in to continue.')
      const values = form.getValues()

      if (step === 'basic') {
        await persistBasicInformation({
          supabase,
          userId: user.id,
          values: pickBasicInformation(values),
          updateProfile,
        })
      }

      if (step === 'roles') {
        const yearsOfExperience = Number(values.yearsExperience)
        const { error } = await supabase
          .from('users')
          .update({
            years_of_experience: Number.isFinite(yearsOfExperience) ? yearsOfExperience : null,
            headline: values.jobTitle.trim(),
            skills_summary: { primary: values.primarySkills },
          })
          .eq('id', user.id)

        if (error) throw new Error(error.message)
      }

      if (step === 'education') {
        const certificationEntries = sanitizeCertifications(values.certifications ?? '')
        const hourlyRateCents = values.hourlyRate
          ? Math.round(Number(values.hourlyRate) * 100)
          : null

        const { error } = await supabase.from('user_private').upsert(
          {
            user_id: user.id,
            education_level: values.educationLevel,
            certifications: certificationEntries.length ? certificationEntries : null,
            contact_prefs: values.contactMethods,
            phone_os: values.phoneOs,
            availability: values.availability,
            hourly_rate_cents: hourlyRateCents,
          },
          { onConflict: 'user_id' }
        )

        if (error) throw new Error(error.message)
      }
    },
    onSuccess: (_data, step) => {
      if (step !== 'summary') {
        setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]))
      }
      toast.show('Progress saved', {
        message:
          step === 'summary'
            ? 'Your onboarding is complete.'
            : 'Keep going—your Elevate score is growing.',
      })
    },
    onError: (error: unknown) => {
      toast.show('Unable to save your progress', {
        message: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  const handleContinue = async () => {
    if (activeStep === 'summary') {
      router.push('/')
      return
    }

    const fields = STEP_FIELDS[activeStep]
    const isValid = await form.trigger(fields, { shouldFocus: true })
    if (!isValid) return

    await mutation.mutateAsync(activeStep)
    const currentIndex = stepOrder.indexOf(activeStep)
    const nextStep = stepOrder[currentIndex + 1] ?? 'summary'
    setActiveStep(nextStep)
  }

  const handleBack = () => {
    const currentIndex = stepOrder.indexOf(activeStep)
    if (currentIndex <= 0) return
    const prevStep = stepOrder[currentIndex - 1] ?? 'basic'
    setActiveStep(prevStep)
  }

  const handleSkip = () => {
    if (activeStep === 'basic' || activeStep === 'summary') {
      router.push('/')
      return
    }

    const currentIndex = stepOrder.indexOf(activeStep)
    const nextStep = stepOrder[currentIndex + 1] ?? 'summary'
    setActiveStep(nextStep)
  }

  const score = computeScore(completedSteps, Boolean(profile?.avatar_url))

  const handleSelectStep = useCallback(
    (step: OnboardingStepId) => {
      setActiveStep(step)
    },
    [setActiveStep]
  )

  if (isUserPending || isProfilePending) {
    return (
      <YStack flex={1} ai="center" jc="center" py="$10">
        <FullscreenSpinner />
      </YStack>
    )
  }

  if (!user) {
    return null
  }

  return (
    <FormWrapper>
      <FormWrapper.Body fd="column" $sm={{ px: '$3' }} px="$6" py="$6" gap="$6">
        <XStack gap="$6" ai="flex-start" fd="row" $md={{ fd: 'column' }}>
          <YStack
            w={280}
            gap="$6"
            p="$4"
            br="$6"
            bg="$gray2"
            borderColor="$color5"
            borderWidth={1}
            $md={{ w: '100%' }}
          >
            <YStack gap="$4">
              <YStack gap="$2">
                <SizableText size="$2" color="$gray11">
                  Getting started
                </SizableText>
                <H4>Complete your profile</H4>
              </YStack>
              <YStack gap="$3">
                {SIDEBAR_STEPS.map((step) => {
                  const isCompleted =
                    step.id === 'sign-up' || completedSteps.includes(step.id as OnboardingStepId)
                  const isActive = step.id === activeStep
                  return (
                    <SidebarStepItem
                      key={step.id}
                      label={step.label}
                      isCompleted={isCompleted}
                      isActive={isActive}
                      onPress={() => {
                        if (step.id === 'sign-up') return
                        if (step.id === 'summary' && !completedSteps.includes('education')) return
                        setActiveStep(step.id as OnboardingStepId)
                      }}
                    />
                  )
                })}
              </YStack>
            </YStack>

            <Separator borderColor="$color4" />

            <ScoreCard score={score} completedSteps={completedSteps} />
          </YStack>

          <YStack f={1} gap="$5">
            <XStack jc="flex-end">
              <Button chromeless iconAfter={SkipForward} onPress={handleSkip} size="$3">
                {activeStep === 'basic'
                  ? 'Skip for now'
                  : activeStep === 'summary'
                    ? 'Finish later'
                    : 'Skip this step'}
              </Button>
            </XStack>

            <StepContent
              activeStep={activeStep}
              form={form}
              values={watchedValues}
              score={score}
              completedSteps={completedSteps}
              profile={profile}
              onboardingProfile={onboardingProfile}
              onToggleSkill={(skill) => {
                const currentSkills = form.getValues('primarySkills')
                const nextSkills = currentSkills.includes(skill)
                  ? currentSkills.filter((item) => item !== skill)
                  : [...currentSkills, skill]
                form.setValue('primarySkills', nextSkills, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
              onSelectStep={handleSelectStep}
            />

            <XStack jc="space-between" pt="$2">
              <Button
                size="$3"
                variant="outlined"
                onPress={handleBack}
                disabled={activeStep === 'basic'}
              >
                Go back
              </Button>
              <Button
                size="$3"
                onPress={handleContinue}
                disabled={mutation.isPending}
                iconAfter={activeStep === 'summary' ? ExternalLink : undefined}
              >
                {mutation.isPending
                  ? 'Saving...'
                  : activeStep === 'summary'
                    ? 'Wrap up'
                    : 'Continue to next step'}
              </Button>
            </XStack>
          </YStack>
        </XStack>
      </FormWrapper.Body>
    </FormWrapper>
  )
}

type StepContentProps = {
  activeStep: OnboardingStepId
  form: UseFormReturn<OnboardingFormValues>
  values: OnboardingFormValues
  score: number
  completedSteps: OnboardingStepId[]
  profile: UserProfile
  onboardingProfile: OnboardingProfile | undefined
  onToggleSkill: (skill: string) => void
  onSelectStep: (step: OnboardingStepId) => void
}

const StepContent = ({
  activeStep,
  form,
  values,
  score,
  completedSteps,
  profile,
  onboardingProfile,
  onToggleSkill,
  onSelectStep,
}: StepContentProps) => {
  if (activeStep === 'basic') {
    return <BasicInformationStep form={form} />
  }

  if (activeStep === 'roles') {
    return <RolesAndSkillsStep values={values} onToggleSkill={onToggleSkill} form={form} />
  }

  if (activeStep === 'education') {
    return <EducationPreferencesStep form={form} />
  }

  return (
    <SummaryStep
      values={values}
      score={score}
      completedSteps={completedSteps}
      profile={profile}
      onboardingProfile={onboardingProfile}
      onSelectStep={onSelectStep}
    />
  )
}

type BaseStepProps = {
  form: UseFormReturn<OnboardingFormValues>
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <SizableText size="$3" fontWeight="600">
    {children}
  </SizableText>
)

const HelperText = ({ children }: { children: React.ReactNode }) => (
  <Paragraph size="$2" color="$gray11">
    {children}
  </Paragraph>
)

export const BasicInformationStep = ({ form }: BaseStepProps) => {
  const { control, watch } = form
  const openToTravel = watch('openToTravel')

  return (
    <YStack gap="$5">
      <YStack gap="$2">
        <H2>Basic information</H2>
        <Paragraph size="$3" color="$gray11">
          Share a brief introduction so companies know how to reach you and where you are based.
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="First name"
              placeholder="e.g. Jane"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="Last name"
              placeholder="e.g. Doe"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="Phone number"
              placeholder="e.g. (555) 123-4567"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="about"
          render={({ field, fieldState }) => (
            <YStack gap="$2">
              <FieldLabel>About</FieldLabel>
              <TextArea
                value={field.value ?? ''}
                onChangeText={field.onChange}
                size="$4"
                rows={4}
                placeholder="Try to explain your experience in a few short sentences"
              />
              {fieldState.error?.message ? (
                <Paragraph size="$2" color="$red10">
                  {fieldState.error.message}
                </Paragraph>
              ) : null}
            </YStack>
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="Location"
              placeholder="e.g. San Francisco, CA"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="openToTravel"
          render={({ field }) => (
            <ToggleRow
              label="Open to travel"
              description="Let companies know if you are willing to travel for work."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        {openToTravel ? (
          <Controller
            control={control}
            name="travelMileage"
            render={({ field, fieldState }) => (
              <LabeledInput
                label="Supplemental miles you are willing to travel"
                placeholder="e.g. 50"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="usResident"
          render={({ field }) => (
            <CheckboxRow
              label="I am a resident of the U.S."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="usPassport"
          render={({ field }) => (
            <CheckboxRow
              label="I have a valid U.S. passport"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="driversLicense"
          render={({ field, fieldState }) => (
            <YStack gap="$2">
              <FieldLabel>Driver’s license</FieldLabel>
              <Paragraph size="$2" color="$gray11">
                Let us know the highest license class you currently hold.
              </Paragraph>
              <ChoiceChips
                value={field.value}
                onSelect={field.onChange}
                options={DRIVER_LICENSE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              {fieldState.error?.message ? (
                <Paragraph size="$2" color="$red10">
                  {fieldState.error.message}
                </Paragraph>
              ) : null}
            </YStack>
          )}
        />

        <Controller
          control={control}
          name="veteran"
          render={({ field }) => (
            <CheckboxRow
              label="I am a veteran"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </YStack>
    </YStack>
  )
}

type RolesStepProps = BaseStepProps & {
  values: OnboardingFormValues
  onToggleSkill: (skill: string) => void
}

const RolesAndSkillsStep = ({ form, values, onToggleSkill }: RolesStepProps) => {
  const { control } = form

  return (
    <YStack gap="$5">
      <YStack gap="$2">
        <H2>Roles and skills</H2>
        <Paragraph size="$3" color="$gray11">
          Selecting the right experience and skills increases your chances of being noticed by
          companies.
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        <Controller
          control={control}
          name="yearsExperience"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="Years of experience"
              placeholder="e.g. 5"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="jobTitle"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="Job title"
              placeholder="e.g. Painter, Flooring"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <YStack gap="$3">
          <FieldLabel>Primary skills</FieldLabel>
          <HelperText>
            Pick the skills that best describe your background. Companies use these to match you
            with opportunities.
          </HelperText>
          <SkillSelector selected={values.primarySkills} onToggle={onToggleSkill} />
          {form.formState.errors.primarySkills ? (
            <Paragraph size="$2" color="$red10">
              {form.formState.errors.primarySkills.message}
            </Paragraph>
          ) : null}
        </YStack>
      </YStack>
    </YStack>
  )
}

const EducationPreferencesStep = ({ form }: BaseStepProps) => {
  const { control, formState } = form

  return (
    <YStack gap="$5">
      <YStack gap="$2">
        <H2>Education and preferences</H2>
        <Paragraph size="$3" color="$gray11">
          Let us know how you prefer to connect and when you’re available for work.
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        <Controller
          control={control}
          name="educationLevel"
          render={({ field, fieldState }) => (
            <YStack gap="$2">
              <FieldLabel>Highest level of education</FieldLabel>
              <ChoiceChips
                value={field.value}
                onSelect={field.onChange}
                options={EDUCATION_OPTIONS.map((option) => ({ value: option, label: option }))}
              />
              {fieldState.error?.message ? (
                <Paragraph size="$2" color="$red10">
                  {fieldState.error.message}
                </Paragraph>
              ) : null}
            </YStack>
          )}
        />

        <Controller
          control={control}
          name="certifications"
          render={({ field, fieldState }) => (
            <YStack gap="$2">
              <FieldLabel>Certifications (optional)</FieldLabel>
              <TextArea
                value={field.value ?? ''}
                onChangeText={field.onChange}
                size="$4"
                rows={3}
                placeholder="List each certification on a new line"
              />
              {fieldState.error?.message ? (
                <Paragraph size="$2" color="$red10">
                  {fieldState.error.message}
                </Paragraph>
              ) : null}
            </YStack>
          )}
        />

        <YStack gap="$2">
          <FieldLabel>Preferred method of contact</FieldLabel>
          <HelperText>Choose how Elevate and hiring teams should reach out.</HelperText>
          <Controller
            control={control}
            name="contactMethods"
            render={({ field }) => (
              <YStack gap="$2">
                {CONTACT_METHODS.map((method) => (
                  <CheckboxRow
                    key={method.value}
                    label={method.label}
                    checked={field.value.includes(method.value)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...field.value, method.value]
                        : field.value.filter((entry) => entry !== method.value)
                      field.onChange(next)
                    }}
                  />
                ))}
              </YStack>
            )}
          />
          {formState.errors.contactMethods ? (
            <Paragraph size="$2" color="$red10">
              {formState.errors.contactMethods.message}
            </Paragraph>
          ) : null}
        </YStack>

        <Controller
          control={control}
          name="phoneOs"
          render={({ field, fieldState }) => (
            <YStack gap="$2">
              <FieldLabel>Phone operating system</FieldLabel>
              <ChoiceChips
                value={field.value}
                onSelect={field.onChange}
                options={PHONE_OS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              {fieldState.error?.message ? (
                <Paragraph size="$2" color="$red10">
                  {fieldState.error.message}
                </Paragraph>
              ) : null}
            </YStack>
          )}
        />

        <YStack gap="$2">
          <FieldLabel>Availability</FieldLabel>
          <HelperText>Select all that apply to your current schedule.</HelperText>
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <YStack gap="$2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <CheckboxRow
                    key={option}
                    label={option}
                    checked={field.value.includes(option)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...field.value, option]
                        : field.value.filter((entry) => entry !== option)
                      field.onChange(next)
                    }}
                  />
                ))}
              </YStack>
            )}
          />
        </YStack>

        <Controller
          control={control}
          name="hourlyRate"
          render={({ field, fieldState }) => (
            <LabeledInput
              label="Desired hourly rate"
              placeholder="e.g. 32"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </YStack>
    </YStack>
  )
}

type SummaryStepProps = {
  values: OnboardingFormValues
  score: number
  completedSteps: OnboardingStepId[]
  profile: UserProfile
  onboardingProfile: OnboardingProfile | undefined
  onSelectStep: (step: OnboardingStepId) => void
}

const SummaryStep = ({
  values,
  score,
  completedSteps,
  profile,
  onboardingProfile,
  onSelectStep,
}: SummaryStepProps) => {
  return (
    <YStack gap="$5">
      <YStack gap="$2">
        <H2>Your Elevate score</H2>
        <Paragraph size="$3" color="$gray11">
          Elevate points are an evaluation metric measured by the skills and overall activity of a
          user. Increase your score by filling out your profile.
        </Paragraph>
      </YStack>

      <YStack gap="$3" p="$4" br="$6" borderWidth={1} borderColor="$color5" bg="$color1">
        <XStack ai="center" jc="space-between">
          <YStack>
            <Paragraph size="$2" color="$gray11">
              Current score
            </Paragraph>
            <SizableText size="$9" fontWeight="800">
              {score}
            </SizableText>
          </YStack>
          <Sparkles size={32} color="$yellow10" />
        </XStack>
        <Paragraph size="$2" color="$gray11">
          Finish these profile tasks to earn more points and unlock tailored recommendations.
        </Paragraph>
        <YStack gap="$3">
          {SUMMARY_TASKS.map((task) => (
            <SummaryTaskRow
              key={task.id}
              task={task}
              completed={getTaskCompletion(
                task.id,
                values,
                completedSteps,
                profile,
                onboardingProfile
              )}
              onAction={getTaskAction(task.id, onSelectStep)}
            />
          ))}
        </YStack>
      </YStack>
    </YStack>
  )
}

type SummaryTaskRowProps = {
  task: (typeof SUMMARY_TASKS)[number]
  completed: boolean
  onAction?: () => void
}

const SummaryTaskRow = ({ task, completed, onAction }: SummaryTaskRowProps) => {
  const description = 'description' in task ? task.description : undefined
  const isCompletedWithoutAction = completed && !onAction

  return (
    <XStack
      gap="$3"
      ai="center"
      jc="space-between"
      $sm={{ fd: 'column', ai: 'flex-start', gap: '$2' }}
    >
      <XStack gap="$3" ai="center" f={1}>
        {completed ? (
          <CheckCircle2 size={18} color="$green10" />
        ) : (
          <Circle size={18} color="$gray9" />
        )}
        <YStack gap={2}>
          <SizableText size="$3" fontWeight="600">
            {task.label}
          </SizableText>
          {description ? (
            <Paragraph size="$2" color="$gray11">
              {description}
            </Paragraph>
          ) : null}
        </YStack>
      </XStack>
      <XStack gap="$3" ai="center">
        <SizableText size="$2" color="$gray11">
          +{task.points}
        </SizableText>
        <Button size="$2" variant="outlined" disabled={!onAction} onPress={onAction}>
          {isCompletedWithoutAction ? 'Completed' : task.ctaLabel}
        </Button>
      </XStack>
    </XStack>
  )
}

const getTaskCompletion = (
  taskId: (typeof SUMMARY_TASKS)[number]['id'],
  values: OnboardingFormValues,
  completedSteps: OnboardingStepId[],
  profile: UserProfile,
  onboardingProfile?: OnboardingProfile
) => {
  switch (taskId) {
    case 'photo':
      return Boolean(profile?.avatar_url)
    case 'basic':
      return completedSteps.includes('basic')
    case 'roles':
      return completedSteps.includes('roles')
    case 'education':
      return completedSteps.includes('education')
    case 'certifications':
      return sanitizeCertifications(values.certifications ?? '').length > 0
    case 'open-to-work':
      return Boolean(onboardingProfile?.user?.open_to_work)
    case 'projects':
    default:
      return false
  }
}

const getTaskAction = (
  taskId: (typeof SUMMARY_TASKS)[number]['id'],
  onSelectStep: (step: OnboardingStepId) => void
) => {
  switch (taskId) {
    case 'basic':
    case 'roles':
    case 'education':
      return () => onSelectStep(taskId)
    default:
      return undefined
  }
}

type SidebarStepItemProps = {
  label: string
  isCompleted: boolean
  isActive: boolean
  onPress: () => void
}

const SidebarStepItem = ({ label, isCompleted, isActive, onPress }: SidebarStepItemProps) => {
  return (
    <XStack
      ai="center"
      gap="$3"
      px="$3"
      py="$2"
      br="$4"
      bg={isActive ? '$color3' : 'transparent'}
      borderColor={isActive ? '$color6' : 'transparent'}
      borderWidth={isActive ? 1 : 0}
      hoverStyle={{ bg: '$color3', cursor: 'pointer' }}
      onPress={onPress}
    >
      {isCompleted ? (
        <CheckCircle2 size={18} color="$green10" />
      ) : (
        <Circle size={18} color="$gray8" />
      )}
      <SizableText
        size="$3"
        fontWeight={isActive ? '700' : '500'}
        color={isActive ? '$color12' : '$gray11'}
      >
        {label}
      </SizableText>
    </XStack>
  )
}

type ScoreCardProps = {
  score: number
  completedSteps: OnboardingStepId[]
}

const ScoreCard = ({ score, completedSteps }: ScoreCardProps) => {
  const segments = useMemo(() => Array.from({ length: 10 }), [])
  return (
    <YStack gap="$3">
      <YStack gap="$1">
        <SizableText size="$2" color="$gray11">
          Elevate score
        </SizableText>
        <XStack ai="center" gap="$2">
          <SizableText size="$8" fontWeight="700">
            e{score}
          </SizableText>
          <Paragraph size="$2" color="$gray11">
            /100
          </Paragraph>
        </XStack>
      </YStack>
      <YStack gap={4}>
        <XStack gap={4}>
          {segments.map((_, index) => (
            <YStack
              key={index}
              f={1}
              h={6}
              br={9999}
              bg={index * 10 < score ? '$color9' : '$color5'}
            />
          ))}
        </XStack>
        <Paragraph size="$2" color="$gray11">
          Completing your profile increases your visibility to companies.
        </Paragraph>
      </YStack>
      <YStack gap="$2">
        <YStack gap={2}>
          <SizableText size="$2" color="$gray11">
            Profile checklist
          </SizableText>
          {PROFILE_STEPS.filter((step) => step.points > 0).map((step) => (
            <XStack key={step.id} ai="center" gap="$2">
              {completedSteps.includes(step.id) ? (
                <CheckCircle2 size={16} color="$green10" />
              ) : (
                <Circle size={16} color="$gray7" />
              )}
              <Paragraph size="$2" color="$gray11">
                {step.label}
              </Paragraph>
              <Paragraph size="$2" color="$gray9">
                +{step.points}
              </Paragraph>
            </XStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  )
}

type CheckboxRowProps = {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const CheckboxRow = ({ label, checked, onCheckedChange }: CheckboxRowProps) => {
  return (
    <XStack ai="center" gap="$3">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))}>
        <Checkbox.Indicator>
          <Check size={14} />
        </Checkbox.Indicator>
      </Checkbox>
      <Paragraph size="$3">{label}</Paragraph>
    </XStack>
  )
}

type ToggleRowProps = {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const ToggleRow = ({ label, description, checked, onCheckedChange }: ToggleRowProps) => {
  return (
    <XStack ai="center" jc="space-between" gap="$3" $sm={{ fd: 'column', ai: 'flex-start' }}>
      <YStack gap={2}>
        <Paragraph size="$3" fontWeight="600">
          {label}
        </Paragraph>
        {description ? (
          <Paragraph size="$2" color="$gray11">
            {description}
          </Paragraph>
        ) : null}
      </YStack>
      <Switch checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))}>
        <Switch.Thumb />
      </Switch>
    </XStack>
  )
}

type ChoiceChipsProps = {
  value: string
  onSelect: (value: string) => void
  options: { value: string; label: string }[]
}

const ChoiceChips = ({ value, onSelect, options }: ChoiceChipsProps) => {
  return (
    <XStack gap="$2" fw="wrap">
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <Button
            key={option.value}
            size="$2"
            variant="outlined"
            onPress={() => onSelect(option.value)}
            bg={isActive ? '$color9' : 'transparent'}
            borderColor={isActive ? '$color9' : undefined}
            color={isActive ? '$color1' : undefined}
          >
            {option.label}
          </Button>
        )
      })}
    </XStack>
  )
}

type SkillSelectorProps = {
  selected: string[]
  onToggle: (skill: string) => void
}

const SkillSelector = ({ selected, onToggle }: SkillSelectorProps) => {
  return (
    <YStack gap="$4">
      {SKILL_CATEGORIES.map((category) => (
        <YStack key={category.id} gap="$2">
          <Paragraph size="$2" color="$gray11">
            {category.label}
          </Paragraph>
          <XStack gap="$2" fw="wrap">
            {category.skills.map((skill) => {
              const isSelected = selected.includes(skill)
              return (
                <Button
                  key={skill}
                  size="$2"
                  variant="outlined"
                  onPress={() => onToggle(skill)}
                  bg={isSelected ? '$color9' : 'transparent'}
                  borderColor={isSelected ? '$color9' : undefined}
                  color={isSelected ? '$color1' : undefined}
                >
                  {skill}
                </Button>
              )
            })}
          </XStack>
        </YStack>
      ))}
    </YStack>
  )
}

type LabeledInputProps = {
  label: string
  placeholder?: string
  value: string
  onChangeText: (value: string) => void
  error?: string
}

const LabeledInput = ({ label, placeholder, value, onChangeText, error }: LabeledInputProps) => {
  return (
    <YStack gap="$2">
      <FieldLabel>{label}</FieldLabel>
      <Input value={value} onChangeText={onChangeText} placeholder={placeholder} size="$4" />
      {error ? (
        <Paragraph size="$2" color="$red10">
          {error}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
