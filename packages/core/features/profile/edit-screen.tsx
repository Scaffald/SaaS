import {
  AddressAutocompleteInput,
  Avatar,
  Button,
  Checkbox,
  FormWrapper,
  FullscreenSpinner,
  Input,
  Paragraph,
  SubmitButton,
  Switch,
  TextArea,
  Theme,
  XStack,
  YStack,
  useToastController,
} from '@app/ui'
import { Check } from '@tamagui/lucide-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormProvider, useController, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SolitoImage } from 'solito/image'
import { ProfileLayout, ProfileSectionContainer, PROFILE_SECTIONS, type ProfileChecklistItem } from './profile-layout'

import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import {
  AVAILABILITY_OPTIONS,
  CONTACT_METHODS,
  DRIVER_LICENSE_OPTIONS,
  EDUCATION_OPTIONS,
  PHONE_OS_OPTIONS,
  SKILL_CATEGORIES,
} from '../onboarding/data'
import {
  OnboardingSchema,
  onboardingDefaultValues,
  pickBasicInformation,
  persistBasicInformation,
  sanitizeCertifications,
  isBasicInformationComplete,
  type OnboardingFormValues,
} from '../onboarding/screen'
import { UploadAvatar } from '../settings/components/upload-avatar'
import { useProfileDetails } from './hooks/useProfileDetails'

type EditProfileScreenProps = {
  onSuccess?: () => void
}

export const EditProfileScreen = ({ onSuccess }: EditProfileScreenProps = {}) => {
  const toast = useToastController()
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const {
    user,
    profile,
    avatarUrl,
    formValues,
    updateProfile,
    isPending: isProfilePending,
  } = useProfileDetails()

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: onboardingDefaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!user?.id) return
    form.reset(formValues)
  }, [form, formValues, user?.id])

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [activeSectionId, setActiveSectionId] = useState<string>(PROFILE_SECTIONS[0]?.id ?? '')

  const handleNavigateToSection = useCallback((sectionId: string) => {
    const target = sectionRefs.current[sectionId]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSectionId(sectionId)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries
          .filter((item) => item.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop)[0]
        if (entry?.target?.id) {
          setActiveSectionId(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0.1 }
    )

    PROFILE_SECTIONS.forEach((section) => {
      const node = sectionRefs.current[section.id]
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [formValues])

  const mutation = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      if (!user?.id) {
        throw new Error('You need to be signed in to update your profile.')
      }

      await persistBasicInformation({
        supabase,
        userId: user.id,
        values: pickBasicInformation(values),
        updateProfile,
      })

      const yearsOfExperience = Number(values.yearsExperience)
      const headline = values.jobTitle.trim() || null
      const { error: userError } = await supabase
        .from('users')
        .update({
          years_of_experience: Number.isFinite(yearsOfExperience) ? yearsOfExperience : null,
          headline,
          skills_summary: { primary: values.primarySkills },
        })
        .eq('id', user.id)

      if (userError) throw new Error(userError.message)

      const certificationEntries = sanitizeCertifications(values.certifications ?? '')
      const hourlyRateCents = values.hourlyRate ? Math.round(Number(values.hourlyRate) * 100) : null

      const { error: privateError } = await supabase.from('user_private').upsert(
        {
          user_id: user.id,
          education_level: values.educationLevel || null,
          certifications: certificationEntries.length ? certificationEntries : null,
          contact_prefs: values.contactMethods,
          phone_os: values.phoneOs || null,
          availability: values.availability,
          hourly_rate_cents: hourlyRateCents,
        },
        { onConflict: 'user_id' }
      )

      if (privateError) throw new Error(privateError.message)

      await queryClient.invalidateQueries({ queryKey: ['onboarding-profile', user.id] })
    },
    onSuccess: () => {
      toast.show('Profile updated', {
        message: 'Your information is now up to date.',
      })
      onSuccess?.()
    },
    onError: (error: unknown) => {
      toast.show('Unable to update profile', {
        message: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  const handleSubmit = form.handleSubmit((values) => mutation.mutateAsync(values))

  const watchedValues = form.watch()

  const checklist = useMemo<ProfileChecklistItem[]>(() => {
    const workComplete = Boolean(
      watchedValues.yearsExperience ||
        watchedValues.jobTitle.trim() ||
        watchedValues.primarySkills.length > 0
    )
    const preferencesComplete = Boolean(
      watchedValues.educationLevel ||
        watchedValues.contactMethods.length > 0 ||
        watchedValues.availability.length > 0 ||
        watchedValues.hourlyRate
    )

    return [
      { id: 'photo', label: 'Upload a profile photo', isCompleted: Boolean(profile?.avatar_url) },
      {
        id: 'basic',
        label: 'Complete basic information',
        isCompleted: isBasicInformationComplete(watchedValues),
      },
      {
        id: 'work',
        label: 'Add work & skills',
        isCompleted: workComplete,
      },
      {
        id: 'preferences',
        label: 'Set preferences & availability',
        isCompleted: preferencesComplete,
      },
    ]
  }, [profile?.avatar_url, watchedValues])

  const completedCount = checklist.filter((item) => item.isCompleted).length
  const completionPercentage = Math.round((completedCount / checklist.length) * 100)

  const isSaving = isProfilePending || mutation.isPending

  if (!user) {
    return <FullscreenSpinner />
  }

  if (isProfilePending) {
    return <FullscreenSpinner />
  }

  return (
    <FormProvider {...form}>
      <FormWrapper>
        <FormWrapper.Body gap="$8" px="$6" py="$6" $sm={{ px: '$3' }}>
          <ProfileLayout
            sections={PROFILE_SECTIONS}
            activeSectionId={activeSectionId}
            onNavigate={handleNavigateToSection}
            checklist={checklist}
            completionPercentage={completionPercentage}
            avatarUrl={avatarUrl}
            fullName={`${watchedValues.firstName} ${watchedValues.lastName}`.trim() || profile?.name || ''}
          >
            <ProfileSectionContainer
              id="overview"
              title="Profile overview"
              description="Keep your public-facing details polished. Upload a photo and ensure your story reflects your craft."
              registerRef={(node) => {
                sectionRefs.current.overview = node
              }}
            >
              <OverviewSection avatarUrl={avatarUrl} isSaving={isSaving} />
            </ProfileSectionContainer>

            <ProfileSectionContainer
              id="basic-info"
              title="Basic information"
              description="Update your contact details and residency information so hiring teams know how to reach you."
              registerRef={(node) => {
                sectionRefs.current['basic-info'] = node
              }}
            >
              <BasicInformationFields />
            </ProfileSectionContainer>

            <ProfileSectionContainer
              id="work-skills"
              title="Work & skills"
              description="Share your experience, headline, and credentials to stand out for the right projects."
              registerRef={(node) => {
                sectionRefs.current['work-skills'] = node
              }}
            >
              <WorkAndSkillsFields />
            </ProfileSectionContainer>

            <ProfileSectionContainer
              id="travel-compliance"
              title="Travel & compliance"
              description="Let us know how far you’re willing to travel and which licenses you hold."
              registerRef={(node) => {
                sectionRefs.current['travel-compliance'] = node
              }}
            >
              <TravelAndComplianceFields />
            </ProfileSectionContainer>

            <ProfileSectionContainer
              id="contact-availability"
              title="Contact & availability"
              description="Set how you prefer to communicate, when you’re available, and your desired rate."
              registerRef={(node) => {
                sectionRefs.current['contact-availability'] = node
              }}
            >
              <ContactAndAvailabilityFields />
            </ProfileSectionContainer>
          </ProfileLayout>
        </FormWrapper.Body>

        <FormWrapper.Footer>
          <Theme inverse>
            <SubmitButton onPress={() => handleSubmit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save profile'}
            </SubmitButton>
          </Theme>
        </FormWrapper.Footer>
      </FormWrapper>
    </FormProvider>
  )
}

const OverviewSection = ({ avatarUrl, isSaving }: { avatarUrl?: string; isSaving: boolean }) => {
  const { control } = useFormContextSafely()
  return (
    <YStack gap="$4">
      <YStack ai="center" gap="$3">
        <UploadAvatar>
          <Avatar circular size={128} br="$10" overflow="hidden">
            {avatarUrl ? <SolitoImage src={avatarUrl} alt="Profile avatar" width={128} height={128} /> : null}
          </Avatar>
        </UploadAvatar>
        {isSaving ? (
          <Paragraph size="$2" color="$gray10">
            Saving changes…
          </Paragraph>
        ) : null}
      </YStack>
      <ControllerTextArea
        control={control}
        name="about"
        label="About"
        placeholder="Tell us about your crew, specialities, or recent projects."
      />
    </YStack>
  )
}

const BasicInformationFields = () => {
  const { control } = useFormContextSafely()
  return (
    <YStack gap="$4">
      <XStack gap="$4" $sm={{ fd: 'column' }}>
        <ControllerInput control={control} name="firstName" label="First name" placeholder="Jane" />
        <ControllerInput control={control} name="lastName" label="Last name" placeholder="Doe" />
      </XStack>
      <ControllerInput control={control} name="phone" label="Phone number" placeholder="(555) 123-4567" />
      <ControllerAddress control={control} name="location" label="Location" placeholder="e.g. Denver, CO" />
      <ControllerCheckbox control={control} name="usResident" label="I am a resident of the U.S." />
      <ControllerCheckbox control={control} name="usPassport" label="I have a valid U.S. passport" />
      <ControllerCheckbox control={control} name="veteran" label="I am a veteran" />
    </YStack>
  )
}

const WorkAndSkillsFields = () => {
  const { control, formState, watch, setValue } = useFormContextSafely()
  const selectedSkills = watch('primarySkills')
  return (
    <YStack gap="$4">
      <ControllerInput
        control={control}
        name="yearsExperience"
        label="Years of experience"
        placeholder="e.g. 5"
      />
      <ControllerInput control={control} name="jobTitle" label="Headline" placeholder="e.g. Lead Carpenter" />
      <YStack gap="$2">
        <Paragraph size="$3" fontWeight="600">
          Primary skills
        </Paragraph>
        <Paragraph size="$2" color="$gray11">
          Select the skills that describe the work you want to be hired for.
        </Paragraph>
        <SkillSelector
          selected={selectedSkills}
          onToggle={(skill) => {
            const next = selectedSkills.includes(skill)
              ? selectedSkills.filter((value) => value !== skill)
              : [...selectedSkills, skill]
            setValue('primarySkills', next, { shouldDirty: true })
          }}
        />
        {formState.errors.primarySkills ? (
          <Paragraph size="$2" color="$red10">
            {formState.errors.primarySkills.message}
          </Paragraph>
        ) : null}
      </YStack>
      <ControllerChoiceChips
        control={control}
        name="educationLevel"
        label="Highest level of education"
        options={EDUCATION_OPTIONS.map((option) => ({ value: option, label: option }))}
      />
      <ControllerTextArea
        control={control}
        name="certifications"
        label="Certifications"
        placeholder="List each certification on a new line"
      />
    </YStack>
  )
}

const TravelAndComplianceFields = () => {
  const { control, watch } = useFormContextSafely()
  const openToTravel = watch('openToTravel')
  return (
    <YStack gap="$4">
      <ControllerToggle
        control={control}
        name="openToTravel"
        label="Open to travel"
        description="Let crews know if you can take jobs outside your local area."
      />
      <ControllerInput
        control={control}
        name="travelMileage"
        label="Preferred travel radius (miles)"
        placeholder="e.g. 25"
        disabled={!openToTravel}
      />
      <ControllerChoiceChips
        control={control}
        name="driversLicense"
        label="Driver’s license class"
        options={DRIVER_LICENSE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
      />
    </YStack>
  )
}

const ContactAndAvailabilityFields = () => {
  const { control } = useFormContextSafely()
  return (
    <YStack gap="$4">
      <ControllerCheckboxGroup
        control={control}
        name="contactMethods"
        label="Preferred contact methods"
        options={CONTACT_METHODS.map((method) => ({ value: method.value, label: method.label }))}
      />
      <ControllerChoiceChips
        control={control}
        name="phoneOs"
        label="Phone operating system"
        options={PHONE_OS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
      />
      <ControllerCheckboxGroup
        control={control}
        name="availability"
        label="Availability"
        options={AVAILABILITY_OPTIONS.map((option) => ({ value: option, label: option }))}
      />
      <ControllerInput
        control={control}
        name="hourlyRate"
        label="Desired hourly rate"
        placeholder="e.g. 32"
      />
    </YStack>
  )
}

type ControllerInputProps = {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
  placeholder?: string
  disabled?: boolean
}

const ControllerInput = ({ control, name, label, placeholder, disabled }: ControllerInputProps) => {
  const { field, fieldState } = useController({ control, name })
  return (
    <YStack gap="$2">
      <Paragraph size="$3" fontWeight="600">
        {label}
      </Paragraph>
      <Input
        value={field.value ?? ''}
        onChangeText={field.onChange}
        placeholder={placeholder}
        size="$4"
        editable={!disabled}
      />
      {fieldState.error?.message ? (
        <Paragraph size="$2" color="$red10">
          {fieldState.error.message}
        </Paragraph>
      ) : null}
    </YStack>
  )
}

const ControllerTextArea = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
  placeholder?: string
}) => {
  const { field, fieldState } = useController({ control, name })
  return (
    <YStack gap="$2">
      <Paragraph size="$3" fontWeight="600">
        {label}
      </Paragraph>
      <TextArea value={field.value ?? ''} onChangeText={field.onChange} rows={4} placeholder={placeholder} />
      {fieldState.error?.message ? (
        <Paragraph size="$2" color="$red10">
          {fieldState.error.message}
        </Paragraph>
      ) : null}
    </YStack>
  )
}

  const { params } = useParams()
  const supabase = useSupabase()
  const toast = useToastController()
  const queryClient = useQueryClient()
  const _apiUtils = api.useUtils()
  const mutation = useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      await supabase
        .from('profiles')
        .update({ name: data.name, about: data.about })
        .eq('id', userId)
    },

const ControllerAddress = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
  placeholder?: string
}) => {
  const { field, fieldState } = useController({ control, name })
  return (
    <YStack gap="$2">
      <Paragraph size="$3" fontWeight="600">
        {label}
      </Paragraph>
      <AddressAutocompleteInput
        value={field.value ?? ''}
        onChangeText={field.onChange}
        placeholder={placeholder}
        error={fieldState.error?.message}
      />
    </YStack>
  )
}

const ControllerCheckbox = ({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
}) => {
  const { field } = useController({ control, name })
  return (
    <CheckboxRow label={label} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
  )
}

const ControllerToggle = ({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
  description?: string
}) => {
  const { field } = useController({ control, name })
  return (
    <ToggleRow label={label} description={description} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
  )
}

const ControllerChoiceChips = ({
  control,
  name,
  label,
  options,
}: {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
  options: { value: string; label: string }[]
}) => {
  const { field, fieldState } = useController({ control, name })
  return (
    <YStack gap="$2">
      <Paragraph size="$3" fontWeight="600">
        {label}
      </Paragraph>
      <ChoiceChips value={field.value ?? ''} onSelect={field.onChange} options={options} />
      {fieldState.error?.message ? (
        <Paragraph size="$2" color="$red10">
          {fieldState.error.message}
        </Paragraph>
      ) : null}
    </YStack>
  )
}

const ControllerCheckboxGroup = ({
  control,
  name,
  label,
  options,
}: {
  control: ReturnType<typeof useFormContextSafely>['control']
  name: keyof OnboardingFormValues
  label: string
  options: { value: string; label: string }[]
}) => {
  const { field } = useController({ control, name })
  return (
    <YStack gap="$2">
      <Paragraph size="$3" fontWeight="600">
        {label}
      </Paragraph>
      <YStack gap="$2">
        {options.map((option) => {
          const checked = field.value?.includes(option.value) ?? false
          return (
            <CheckboxRow
              key={option.value}
              label={option.label}
              checked={checked}
              onCheckedChange={(next) => {
                const current = Array.isArray(field.value) ? field.value : []
                const updated = next
                  ? [...current, option.value]
                  : current.filter((value) => value !== option.value)
                field.onChange(updated)
              }}
            />
          )
        })}
      </YStack>
    </YStack>
  )
}

const CheckboxRow = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <XStack ai="center" gap="$3">
    <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))}>
      <Checkbox.Indicator>
        <Check size={14} />
      </Checkbox.Indicator>
    </Checkbox>
    <Paragraph size="$3">{label}</Paragraph>
  </XStack>
)

const ToggleRow = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
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

const ChoiceChips = ({
  value,
  onSelect,
  options,
}: {
  value: string
  onSelect: (value: string) => void
  options: { value: string; label: string }[]
}) => (
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

const SkillSelector = ({ selected, onToggle }: { selected: string[]; onToggle: (skill: string) => void }) => (
  <YStack gap="$3">
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

const useFormContextSafely = () => {
  const context = useFormContext<OnboardingFormValues>()
  if (!context) {
    throw new Error('EditProfileScreen must be used within a FormProvider.')
  }
  return context
}
