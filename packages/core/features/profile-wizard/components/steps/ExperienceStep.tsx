import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Text, XStack, YStack, Paragraph } from 'tamagui'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'
import type { ExperienceStepData } from '../../hooks/useProfileWizard'
import { MonthYearPicker, ToggleSwitch } from '@app/ui'

const experienceSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  companyName: z.string().min(1, 'Company is required'),
  startDate: z.string().min(4, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  summary: z.string().optional(),
})

type ExperienceFormValues = z.infer<typeof experienceSchema>

const DEFAULT_VALUES: ExperienceFormValues = {
  jobTitle: '',
  companyName: '',
  startDate: '',
  endDate: '',
  isCurrent: true,
  summary: '',
}

export function ExperienceStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<'experience'>) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ExperienceFormValues>({
    defaultValues: toExperienceFormValues(initialData),
    resolver: zodResolver(experienceSchema),
    mode: 'onChange',
  })

  const values = useWatch({ control })

  useEffect(() => {
    if (!initialData) {
      return
    }

    reset(toExperienceFormValues(initialData), { keepDefaultValues: false })
  }, [initialData, reset])

  useEffect(() => {
    const payload: ExperienceStepData = {
      jobTitle: values.jobTitle ?? '',
      companyName: values.companyName ?? '',
      startDate: normalizeWizardDate(values.startDate),
      endDate: values.isCurrent ? null : normalizeWizardDate(values.endDate),
      isCurrent: values.isCurrent ?? true,
      summary: values.summary ?? '',
    }

    onStepStateChange?.({
      data: payload,
      isValid,
      isDirty,
    })
  }, [values, isValid, isDirty, onStepStateChange])

  const submit = handleSubmit(async (data) => {
    await onContinue({
      jobTitle: data.jobTitle.trim(),
      companyName: data.companyName.trim(),
      startDate: normalizeWizardDate(data.startDate),
      endDate: data.isCurrent ? null : normalizeWizardDate(data.endDate),
      isCurrent: data.isCurrent,
      summary: data.summary?.trim(),
    })
  })

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.({
      jobTitle: data.jobTitle.trim(),
      companyName: data.companyName.trim(),
      startDate: normalizeWizardDate(data.startDate),
      endDate: data.isCurrent ? null : normalizeWizardDate(data.endDate),
      isCurrent: data.isCurrent,
      summary: data.summary?.trim(),
    })
  })

  const handleSkip = async () => {
    await onSkip?.()
  }

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Add your latest experience
        </Text>
        <Paragraph color="$color11">
          Showcase your most recent role. You can add more later in your full profile.
        </Paragraph>
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Job Title *</Text>
        <Controller
          control={control}
          name="jobTitle"
          render={({ field }) => (
            <Input {...field} placeholder="Lead Carpenter" onChangeText={field.onChange} />
          )}
        />
        {errors.jobTitle && (
          <Text fontSize="$2" color="$red10">
            {errors.jobTitle.message}
          </Text>
        )}
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Company *</Text>
        <Controller
          control={control}
          name="companyName"
          render={({ field }) => (
            <Input {...field} placeholder="Summit Builders" onChangeText={field.onChange} />
          )}
        />
        {errors.companyName && (
          <Text fontSize="$2" color="$red10">
            {errors.companyName.message}
          </Text>
        )}
      </YStack>

      <XStack gap="$3">
        <YStack flex={1} gap="$2">
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <MonthYearPicker
                label="Start Date *"
                value={parseWizardDate(field.value)}
                onChange={(date) => field.onChange(date ? formatWizardDate(date) : '')}
                error={errors.startDate?.message}
              />
            )}
          />
        </YStack>

        <YStack flex={1} gap="$2">
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <MonthYearPicker
                label="End Date"
                value={parseWizardDate(field.value)}
                onChange={(date) => field.onChange(date ? formatWizardDate(date) : '')}
                disabled={values.isCurrent}
                error={errors.endDate?.message}
              />
            )}
          />
        </YStack>
      </XStack>

      <XStack gap="$2" items="center">
        <Controller
          control={control}
          name="isCurrent"
          render={({ field }) => (
            <ToggleSwitch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              aria-label="I currently work here"
            />
          )}
        />
        <Text fontSize="$3">I currently work here</Text>
      </XStack>

      <YStack gap="$2">
        <Text fontWeight="600">Summary</Text>
        <Controller
          control={control}
          name="summary"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Installed custom millwork across four high-rise projects..."
              onChangeText={field.onChange}
            />
          )}
        />
      </YStack>

      <StepNavigation
        canGoBack
        canGoNext={isValid}
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={submit}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Certifications"
      />
    </YStack>
  )
}

function parseWizardDate(value?: string | null): Date | null {
  if (!value) return null
  const [yearPart, monthPart] = value.split('-')
  const year = Number.parseInt(yearPart ?? '', 10)
  const month = Number.parseInt(monthPart ?? '', 10)
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return null
  }
  return new Date(year, month - 1, 1)
}

function formatWizardDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}-01`
}

function normalizeWizardDate(value?: string | null): string | null {
  if (!value) return null
  return value || null
}

function toExperienceFormValues(data?: ExperienceStepData | null): ExperienceFormValues {
  if (!data) {
    return DEFAULT_VALUES
  }

  return {
    jobTitle: data.jobTitle ?? '',
    companyName: data.companyName ?? '',
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    isCurrent: data.isCurrent ?? true,
    summary: data.summary ?? '',
  }
}


