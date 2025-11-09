import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Select, Text, XStack, YStack, Paragraph, Adapt, Sheet, Button } from 'tamagui'
import type { WizardStepComponentProps } from './types'
import type { EmploymentPreferencesStepData } from '../../hooks/useProfileWizard'
import { StepNavigation } from '../StepNavigation'

const employmentSchema = z.object({
  locationPreference: z.string().optional(),
  hourlyRate: z.string().optional(),
  availability: z.string().optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite']).optional(),
})

type EmploymentFormValues = z.infer<typeof employmentSchema>

const DEFAULT_VALUES: EmploymentFormValues = {
  locationPreference: '',
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
  } = useForm<EmploymentFormValues>({
    defaultValues: initialData ?? DEFAULT_VALUES,
    resolver: zodResolver(employmentSchema),
    mode: 'onChange',
  })

  const values = useWatch({ control })

  useEffect(() => {
    if (initialData) {
      reset(initialData, { keepDefaultValues: false })
    }
  }, [initialData, reset])

  useEffect(() => {
    const payload: EmploymentPreferencesStepData = {
      locationPreference: values.locationPreference || null,
      hourlyRate: values.hourlyRate || null,
      availability: values.availability || null,
      remotePreference: (values.remotePreference as EmploymentPreferencesStepData['remotePreference']) ?? null,
    }

    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty,
    })
  }, [values, isDirty, onStepStateChange])

  const submit = handleSubmit(async (data) => {
    await onContinue({
      locationPreference: data.locationPreference || null,
      hourlyRate: data.hourlyRate || null,
      availability: data.availability || null,
      remotePreference: (data.remotePreference as EmploymentPreferencesStepData['remotePreference']) ?? null,
    })
  })

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.({
      locationPreference: data.locationPreference || null,
      hourlyRate: data.hourlyRate || null,
      availability: data.availability || null,
      remotePreference: (data.remotePreference as EmploymentPreferencesStepData['remotePreference']) ?? null,
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
          Help employers match you with the right opportunities by adding where, how, and when you prefer to work.
        </Paragraph>
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Preferred work location</Text>
        <Controller
          control={control}
          name="locationPreference"
          render={({ field }) => (
            <Input {...field} placeholder="e.g., Seattle, WA or Within 25 miles of 98101" onChangeText={field.onChange} />
          )}
        />
      </YStack>

      <XStack gap="$3" flexWrap="wrap">
        <YStack flex={1} gap="$2" minWidth={160}>
          <Text fontWeight="600">Availability</Text>
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <Select.Trigger>
                  <Select.Value placeholder="Select availability" />
                </Select.Trigger>
                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom animationConfig={{ type: 'spring', damping: 20, mass: 1, stiffness: 250 }}>
                    <Sheet.Frame>
                      <Sheet.ScrollView />
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>
                <Select.Content>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            )}
          />
        </YStack>

        <YStack flex={1} gap="$2" minWidth={160}>
          <Text fontWeight="600">Preferred hourly rate</Text>
          <Controller
            control={control}
            name="hourlyRate"
            render={({ field }) => (
              <Input {...field} placeholder="$35 / hour" keyboardType="numeric" onChangeText={field.onChange} />
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
            <Select value={field.value} onValueChange={field.onChange}>
              <Select.Trigger>
                <Select.Value placeholder="Select preferred environment" />
              </Select.Trigger>
              <Adapt when="sm" platform="touch">
                <Sheet modal dismissOnSnapToBottom animationConfig={{ type: 'spring', damping: 20, mass: 1, stiffness: 250 }}>
                  <Sheet.Frame>
                    <Sheet.ScrollView />
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {WORK_MODE_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
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


