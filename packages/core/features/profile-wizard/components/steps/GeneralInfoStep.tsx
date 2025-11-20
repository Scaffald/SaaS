import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Input, Paragraph, Text, TextArea, XStack, YStack } from 'tamagui'
import { z } from 'zod'
import type { GeneralInfoStepData } from '../../hooks/useProfileWizard'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'

const generalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  headline: z.string().min(1, 'Headline is required'),
  bio: z.string().max(500, 'Bio should be under 500 characters').optional(),
})

type GeneralInfoFormValues = z.infer<typeof generalInfoSchema>

const DEFAULT_VALUES: GeneralInfoFormValues = {
  firstName: '',
  lastName: '',
  headline: '',
  bio: '',
}

export function GeneralInfoStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<'general'>) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<GeneralInfoFormValues>({
    defaultValues: initialData ?? DEFAULT_VALUES,
    resolver: zodResolver(generalInfoSchema),
    mode: 'onChange',
  })

  const watchedValues = useWatch({ control })

  useEffect(() => {
    if (!initialData) return
    reset(initialData, { keepDefaultValues: false })
  }, [initialData, reset])

  useEffect(() => {
    const payload: GeneralInfoStepData = {
      firstName: watchedValues.firstName ?? '',
      lastName: watchedValues.lastName ?? '',
      headline: watchedValues.headline ?? '',
      bio: watchedValues.bio ?? '',
    }

    onStepStateChange?.({
      data: payload,
      isValid,
      isDirty,
    })
  }, [watchedValues, isValid, isDirty, onStepStateChange])

  const submit = handleSubmit(async (values) => {
    await onContinue({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      headline: values.headline.trim(),
      bio: values.bio?.trim() ?? '',
    })
  })

  const handleSaveForLater = handleSubmit(async (values) => {
    await onSaveForLater?.({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      headline: values.headline.trim(),
      bio: values.bio?.trim() ?? '',
    })
  })

  const handleSkip = async () => {
    await onSkip?.()
  }

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Tell us about yourself
        </Text>
        <Paragraph color="$color11">
          Add a friendly introduction. This helps employers quickly understand who you are and what
          you bring to the table.
        </Paragraph>
      </YStack>

      <XStack gap="$3" flexWrap="wrap">
        <YStack flex={1} minW={150} gap="$2">
          <Text fontWeight="600">First Name *</Text>
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value}
                placeholder="First name"
                onChangeText={field.onChange}
                autoCapitalize="words"
              />
            )}
          />
          {errors.firstName && (
            <Text fontSize="$2" color="$red10">
              {errors.firstName.message}
            </Text>
          )}
        </YStack>

        <YStack flex={1} minW={150} gap="$2">
          <Text fontWeight="600">Last Name *</Text>
          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value}
                placeholder="Last name"
                onChangeText={field.onChange}
                autoCapitalize="words"
              />
            )}
          />
          {errors.lastName && (
            <Text fontSize="$2" color="$red10">
              {errors.lastName.message}
            </Text>
          )}
        </YStack>
      </XStack>

      <YStack gap="$2">
        <Text fontWeight="600">Professional Headline *</Text>
        <Controller
          control={control}
          name="headline"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value}
              placeholder="Licensed electrician with 8+ years experience"
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.headline && (
          <Text fontSize="$2" color="$red10">
            {errors.headline.message}
          </Text>
        )}
      </YStack>

      <YStack gap="$2">
        <Text fontWeight="600">Short Bio</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field }) => (
            <TextArea
              {...field}
              value={field.value}
              placeholder="Share a quick summary of your experience, strengths, and goals."
              onChangeText={field.onChange}
              minH={120}
              numberOfLines={5}
            />
          )}
        />
        <Text fontSize="$2" color="$color10">
          Keep it short and friendly—1-2 sentences is perfect.
        </Text>
      </YStack>

      <StepNavigation
        canGoBack={false}
        canGoNext={isValid}
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={submit}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Skills"
      />
    </YStack>
  )
}
