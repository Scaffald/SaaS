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
import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useUser } from '@app/core/utils/useUser'
import { useRouter } from 'solito/router'
import { Controller, useForm } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
import {
  OnboardingSchema,
  STEP_FIELDS,
  buildFormValues,
  computeScore,
  defaultValues,
  determineCompletedSteps,
  getNextOnboardingStep,
  fetchOnboardingProfile,
  sanitizeCertifications,
  stepOrder,
  type OnboardingFormValues,
  type OnboardingProfile,
  type UserProfile,
} from './logic'

const SIDEBAR_STEPS: Array<{ id: 'sign-up' | OnboardingStepId; label: string }> = [
  { id: 'sign-up', label: 'Sign up' },
  ...PROFILE_STEPS.map((step) => ({ id: step.id, label: step.label })),
]

export const OnboardingFlowScreen = () => {
  const router = useRouter()
  const toast = useToastController()
  const supabase = useSupabase()
  const { user, profile, isPending: isUserPending, updateProfile } = useUser()
  const [activeStep, setActiveStep] = useState<OnboardingStepId>('basic')
  const [completedSteps, setCompletedSteps] = useState<OnboardingStepId[]>([])

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const watchedValues = form.watch()

  const { data: onboardingProfile, isPending: isProfilePending } = useQuery<OnboardingProfile>({
    queryKey: ['onboarding-profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return { user: null, privateProfile: null }
      return fetchOnboardingProfile(supabase, user.id)
    },
  })

  useEffect(() => {
    if (!user?.id) return
    if (!onboardingProfile) return

    const nextValues = buildFormValues({ onboardingProfile, profile })
    form.reset(nextValues)

    const nextCompletedSteps = determineCompletedSteps(nextValues)
    setCompletedSteps(nextCompletedSteps)
    setActiveStep((currentStep) => {
      const nextStep = getNextOnboardingStep(nextCompletedSteps)
      return nextStep === currentStep ? currentStep : nextStep
    })
  }, [form, onboardingProfile, profile, user?.id])

  const mutation = useMutation({
    mutationFn: async (step: OnboardingStepId) => {
      if (!user?.id) throw new Error('You need to be signed in to continue.')
      const values = form.getValues()

      if (step === 'basic') {
        const about = values.about?.trim() || null
        const travelMileage =
          values.openToTravel && values.travelMileage ? Number(values.travelMileage) : null

        const [{ error: profileError }, { error: userError }, { error: privateError }] =
          await Promise.all([
            supabase.from('profiles').update({ about }).eq('id', user.id),
            supabase.from('users').update({ bio: about }).eq('id', user.id),
            supabase.from('user_private').upsert(
              {
                user_id: user.id,
                phone: values.phone?.trim() || null,
                location: values.location?.trim() || null,
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

  const handleSkip = async () => {
    if (!user?.id) {
      router.push('/')
      return
    }

    const { error } = await supabase
      .from('user_private')
      .upsert(
        { user_id: user.id, onboarding_skipped_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      toast.show('Unable to skip onboarding', {
        message: error.message ?? 'Please try again.',
      })
      return
    }

    router.push('/')
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
                Skip for now
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
  form: ReturnType<typeof useForm<OnboardingFormValues>>
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
  form: ReturnType<typeof useForm<OnboardingFormValues>>
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

const BasicInformationStep = ({ form }: BaseStepProps) => {
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
          <Sparkles size={32} color="var(--color-yellow10)" />
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
          <CheckCircle2 size={18} color="var(--color-green10)" />
        ) : (
          <Circle size={18} color="var(--color-gray9)" />
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
        <CheckCircle2 size={18} color="var(--color-green10)" />
      ) : (
        <Circle size={18} color="var(--color-gray8)" />
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
                <CheckCircle2 size={16} color="var(--color-green10)" />
              ) : (
                <Circle size={16} color="var(--color-gray7)" />
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
