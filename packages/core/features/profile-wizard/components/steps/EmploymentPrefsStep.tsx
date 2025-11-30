import { ControlledAddressForm } from '@app/core/forms'
import { ResponsiveSelect } from '@scaffald/neue-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Input, Paragraph, Text, XStack, YStack } from 'tamagui'
import { z } from 'zod'
import type { EmploymentPreferencesStepData } from '../../hooks/useProfileWizard'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'

const employmentSchema = z.object({
  locationPreference: z.string().optional(),
  location: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  hourlyRate: z.string().optional(),
  availability: z.string().optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite']).optional(),
})

type EmploymentFormValues = z.infer<typeof employmentSchema>

const DEFAULT_VALUES: EmploymentFormValues = {
  locationPreference: '',
  location: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  },
  hourlyRate: '',
  availability: '',
  remotePreference: undefined,
}

const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract / Project-based' },
] as const

const WORK_MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
] as const

export function EmploymentPrefsStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<'preferences'>) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
    setValue,
    trigger,
  } = useForm<EmploymentFormValues>({
    defaultValues: toEmploymentFormValues(initialData),
    resolver: zodResolver(employmentSchema),
    mode: 'onChange',
  })

  const values = useWatch({ control })

  useEffect(() => {
    if (!initialData) return
    reset(toEmploymentFormValues(initialData), { keepDefaultValues: false })
  }, [initialData, reset])

  useEffect(() => {
    const payload: EmploymentPreferencesStepData = {
      locationPreference: normalizeText(values.locationPreference),
      hourlyRate: normalizeText(values.hourlyRate),
      availability: normalizeText(values.availability),
      remotePreference:
        (values.remotePreference as EmploymentPreferencesStepData['remotePreference']) ?? null,
    }

    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty: computeDirty(initialData, payload) || isDirty,
    })
  }, [initialData, values, isDirty, onStepStateChange])

  const submit = handleSubmit(async (data) => {
    await onContinue({
      locationPreference: normalizeText(data.locationPreference),
      hourlyRate: normalizeText(data.hourlyRate),
      availability: normalizeText(data.availability),
      remotePreference:
        (data.remotePreference as EmploymentPreferencesStepData['remotePreference']) ?? null,
    })
  })

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.({
      locationPreference: normalizeText(data.locationPreference),
      hourlyRate: normalizeText(data.hourlyRate),
      availability: normalizeText(data.availability),
      remotePreference:
        (data.remotePreference as EmploymentPreferencesStepData['remotePreference']) ?? null,
    })
  })

  const handleSkip = async () => {
    await onSkip?.()
  }

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Share your work preferences
        </Text>
        <Paragraph color="$color11">
          Help employers match you with the right opportunities by adding where, how, and when you
          prefer to work.
        </Paragraph>
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Preferred work location</Text>
        <Controller
          control={control}
          name="locationPreference"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="e.g., Seattle, WA or Within 25 miles of 98101"
              onChangeText={field.onChange}
            />
          )}
        />
      </YStack>

      <YStack gap="$2">
        <ControlledAddressForm
          control={control}
          name="location"
          setValue={setValue}
          trigger={trigger}
          label="Or pick a location"
          placeholder="Search for a city or address"
          required={false}
          onAddressSelect={(address) => {
            const formatted = [
              address.locality,
              address.administrativeAreaLevel1 ?? address.stateAbbreviation,
            ]
              .filter(Boolean)
              .join(', ')
            if (formatted) {
              setValue('locationPreference', formatted, { shouldDirty: true })
            }
          }}
        />
      </YStack>

      <XStack gap="$3" flexWrap="wrap">
        <YStack flex={1} gap="$2" minW={160}>
          <Text fontWeight="600">Availability</Text>
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <ResponsiveSelect
                value={field.value || ''}
                onValueChange={field.onChange}
                placeholder="Select availability"
                options={AVAILABILITY_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            )}
          />
        </YStack>

        <YStack flex={1} gap="$2" minW={160}>
          <Text fontWeight="600">Preferred hourly rate</Text>
          <Controller
            control={control}
            name="hourlyRate"
            render={({ field }) => (
              <Input
                {...field}
                placeholder="$35 / hour"
                keyboardType="numeric"
                onChangeText={field.onChange}
              />
            )}
          />
        </YStack>
      </XStack>

      <YStack gap="$2">
        <Text fontWeight="600">Work environment</Text>
        <Controller
          control={control}
          name="remotePreference"
          render={({ field }) => (
            <ResponsiveSelect
              value={field.value || ''}
              onValueChange={field.onChange}
              placeholder="Select preferred environment"
              options={WORK_MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          )}
        />
      </YStack>

      <StepNavigation
        canGoBack
        canGoNext
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={submit}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Education"
      />
    </YStack>
  )
}

function normalizeText(value?: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }
  return trimmed
}

function computeDirty(
  initialData: EmploymentPreferencesStepData | undefined,
  current: EmploymentPreferencesStepData
) {
  if (!initialData) {
    return Boolean(
      current.locationPreference ||
        current.hourlyRate ||
        current.availability ||
        current.remotePreference
    )
  }

  return (
    normalizeText(initialData.locationPreference) !== normalizeText(current.locationPreference) ||
    normalizeText(initialData.hourlyRate) !== normalizeText(current.hourlyRate) ||
    normalizeText(initialData.availability) !== normalizeText(current.availability) ||
    (initialData.remotePreference ?? null) !== (current.remotePreference ?? null)
  )
}

function toEmploymentFormValues(data?: EmploymentPreferencesStepData | null): EmploymentFormValues {
  if (!data) {
    return {
      ...DEFAULT_VALUES,
      location: { ...DEFAULT_VALUES.location },
    }
  }

  return {
    locationPreference: data.locationPreference ?? '',
    location: { ...DEFAULT_VALUES.location },
    hourlyRate: data.hourlyRate ?? '',
    availability: data.availability ?? '',
    remotePreference: data.remotePreference ?? undefined,
  }
}
