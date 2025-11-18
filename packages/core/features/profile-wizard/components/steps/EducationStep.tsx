import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Text, XStack, YStack, Paragraph } from 'tamagui'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'
import type { EducationStepData } from '../../hooks/useProfileWizard'
import { MonthYearPicker, ToggleSwitch } from '@app/ui'

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
    defaultValues: toEducationFormValues(initialData),
    resolver: zodResolver(educationSchema),
    mode: 'onChange',
  })

  const values = useWatch({ control })

  useEffect(() => {
    if (!initialData) return
    reset(toEducationFormValues(initialData), { keepDefaultValues: false })
  }, [initialData, reset])

  useEffect(() => {
    const payload: EducationStepData = {
      degreeType: normalizeText(values.degreeType),
      institutionName: normalizeText(values.institutionName),
      startDate: normalizeWizardDate(values.startDate),
      endDate: values.isCurrent ? null : normalizeWizardDate(values.endDate),
      isCurrent: values.isCurrent ?? false,
    }

    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty,
    })
  }, [values, isDirty, onStepStateChange])

  const submit = handleSubmit(async (data) => {
    await onContinue(
      formatEducationPayload(data),
    )
  })

  const handleSaveForLater = handleSubmit(async (data) => {
    await onSaveForLater?.(formatEducationPayload(data))
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
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <MonthYearPicker
                label="Start Date"
                value={parseWizardDate(field.value)}
                onChange={(date) => field.onChange(date ? formatWizardDate(date) : '')}
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
              aria-label="I am currently enrolled"
            />
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
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? ''
}

function formatEducationPayload(data: EducationFormValues): EducationStepData {
  return {
    degreeType: normalizeText(data.degreeType),
    institutionName: normalizeText(data.institutionName),
    startDate: normalizeWizardDate(data.startDate),
    endDate: data.isCurrent ? null : normalizeWizardDate(data.endDate),
    isCurrent: data.isCurrent ?? false,
  }
}

function toEducationFormValues(data?: EducationStepData | null): EducationFormValues {
  if (!data) {
    return DEFAULT_VALUES
  }

  return {
    degreeType: data.degreeType ?? '',
    institutionName: data.institutionName ?? '',
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    isCurrent: data.isCurrent ?? false,
  }
}


