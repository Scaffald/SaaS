import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Switch, Text, XStack, YStack, Paragraph } from 'tamagui'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'
import type { ExperienceStepData } from '../../hooks/useProfileWizard'

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
    defaultValues: initialData ?? DEFAULT_VALUES,
    resolver: zodResolver(experienceSchema),
    mode: 'onChange',
  })

  const values = useWatch({ control })

  useEffect(() => {
    if (initialData) {
      reset(initialData, { keepDefaultValues: false })
    }
  }, [initialData, reset])

  useEffect(() => {
    const payload: ExperienceStepData = {
      jobTitle: values.jobTitle ?? '',
      companyName: values.companyName ?? '',
      startDate: values.startDate || null,
      endDate: values.isCurrent ? null : values.endDate || null,
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
      startDate: data.startDate,
      endDate: data.isCurrent ? null : data.endDate || null,
      isCurrent: data.isCurrent,
      summary: data.summary?.trim(),
    })
  })

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.({
      jobTitle: data.jobTitle.trim(),
      companyName: data.companyName.trim(),
      startDate: data.startDate,
      endDate: data.isCurrent ? null : data.endDate || null,
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
          <Text fontWeight="600">Start Date *</Text>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <Input {...field} placeholder="2021-01" onChangeText={field.onChange} />
            )}
          />
          {errors.startDate && (
            <Text fontSize="$2" color="$red10">
              {errors.startDate.message}
            </Text>
          )}
        </YStack>

        <YStack flex={1} gap="$2">
          <Text fontWeight="600">End Date</Text>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <Input
                {...field}
                placeholder="2024-06"
                onChangeText={field.onChange}
                editable={!values.isCurrent}
                opacity={values.isCurrent ? 0.4 : 1}
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
            <Switch size="$3" checked={field.value} onCheckedChange={field.onChange}>
              <Switch.Thumb animation="quick" />
            </Switch>
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


