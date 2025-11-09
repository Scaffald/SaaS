import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Switch, Text, XStack, YStack, Paragraph } from 'tamagui'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'
import type { EducationStepData } from '../../hooks/useProfileWizard'

const educationSchema = z.object({
  degreeType: z.string().optional(),
  institutionName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
})

type EducationFormValues = z.infer<typeof educationSchema>

const DEFAULT_VALUES: EducationFormValues = {
  degreeType: '',
  institutionName: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
}

export function EducationStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<'education'>) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EducationFormValues>({
    defaultValues: initialData ?? DEFAULT_VALUES,
    resolver: zodResolver(educationSchema),
    mode: 'onChange',
  })

  const values = useWatch({ control })

  useEffect(() => {
    if (initialData) {
      reset(initialData, { keepDefaultValues: false })
    }
  }, [initialData, reset])

  useEffect(() => {
    const payload: EducationStepData = {
      degreeType: values.degreeType ?? '',
      institutionName: values.institutionName ?? '',
      startDate: values.startDate || null,
      endDate: values.isCurrent ? null : values.endDate || null,
      isCurrent: values.isCurrent ?? false,
    }

    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty,
    })
  }, [values, isDirty, onStepStateChange])

  const submit = handleSubmit(async (data) => {
    await onContinue({
      degreeType: data.degreeType ?? '',
      institutionName: data.institutionName ?? '',
      startDate: data.startDate || null,
      endDate: data.isCurrent ? null : data.endDate || null,
      isCurrent: data.isCurrent ?? false,
    })
  })

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.({
      degreeType: data.degreeType ?? '',
      institutionName: data.institutionName ?? '',
      startDate: data.startDate || null,
      endDate: data.isCurrent ? null : data.endDate || null,
      isCurrent: data.isCurrent ?? false,
    })
  })

  const handleSkip = async () => {
    await onSkip?.()
  }

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Highest education
        </Text>
        <Paragraph color="$color11">
          Add your latest degree or training program. This section is optional but strengthens your profile.
        </Paragraph>
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Degree or credential</Text>
        <Controller
          control={control}
          name="degreeType"
          render={({ field }) => (
            <Input {...field} placeholder="Associate of Applied Science, Carpentry" onChangeText={field.onChange} />
          )}
        />
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Institution</Text>
        <Controller
          control={control}
          name="institutionName"
          render={({ field }) => (
            <Input {...field} placeholder="Northwest Technical College" onChangeText={field.onChange} />
          )}
        />
      </YStack>

      <XStack gap="$3">
        <YStack flex={1} gap="$2">
          <Text fontWeight="600">Start Date</Text>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <Input {...field} placeholder="2019-09" onChangeText={field.onChange} />
            )}
          />
        </YStack>

        <YStack flex={1} gap="$2">
          <Text fontWeight="600">End Date</Text>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <Input
                {...field}
                placeholder="2021-06"
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
    <Text fontSize="$3">I am currently enrolled</Text>
  </XStack>

      <StepNavigation
        canGoBack
        canGoNext
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={submit}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Finish"
      />
    </YStack>
  )
}


