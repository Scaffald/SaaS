import { useEffect, useMemo, useRef } from 'react'
import { Adapt, Dialog, Sheet } from 'tamagui'
import {
  FormWrapper,
  H2,
  Paragraph,
  SubmitButton,
  Button,
  Theme,
  YStack,
  useToastController,
} from '@app/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useUser } from '@app/core/utils/useUser'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { usePathname } from '@app/core/utils/usePathname'
import { ROUTES, AUTH_ROUTES } from '@app/core/constants/routes'

import {
  BasicInformationStep,
  OnboardingSchema,
  onboardingDefaultValues,
  pickBasicInformation,
  persistBasicInformation,
  createOnboardingValuesFromProfile,
  isBasicInformationComplete,
  type OnboardingFormValues,
} from '../screen'
import { useOnboardingProfile } from '../hooks/useOnboardingProfile'
import { useProgressiveProfilePrompt } from '../../home/hooks/useProgressiveProfilePrompt'
import type { ProgressivePrompt } from '../../home/hooks/useProgressiveProfilePrompt'
import { useLink } from 'solito/link'

type PromptComponentProps = {
  prompt: ProgressivePrompt
  onComplete: () => void
}

const CTA_COMPONENTS: Record<
  NonNullable<ProgressivePrompt['componentId']>,
  (props: PromptComponentProps) => JSX.Element
> = {
  'review-peer': ({ prompt, onComplete }) => {
    const link = useLink({ href: prompt.ctaRoute ?? '/community/reviews' })

    const handlePress: typeof link.onPress = (event) => {
      link.onPress?.(event)
      onComplete()
    }

    return (
      <YStack gap="$4">
        <YStack gap="$2">
          <H2 size="$7">{prompt.title}</H2>
          <Paragraph size="$3" color="$gray11">
            {prompt.description}
          </Paragraph>
        </YStack>
        <Button size="$3" {...link} onPress={handlePress}>
          {prompt.ctaLabel ?? 'Get started'}
        </Button>
      </YStack>
    )
  },
}

type RequiredProfileDialogProps = {
  /** allow opting out of rendering when embedding elsewhere */
  disabled?: boolean
}

export const RequiredProfileDialog = ({ disabled }: RequiredProfileDialogProps) => {
  const { user, profile, updateProfile, isPending: isUserPending } = useUser()
  const supabase = useSupabase()
  const toast = useToastController()
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const {
    prompt,
    isLoading: isPromptLoading,
    markPromptCompleted,
  } = useProgressiveProfilePrompt({ surface: 'dialog' })
  const promptIdRef = useRef<string | null>(null)

  useEffect(() => {
    promptIdRef.current = prompt?.id ?? null
  }, [prompt?.id])

  const isProfilePrompt = Boolean(prompt?.factorId)
  const shouldLoadProfileForPrompt = isProfilePrompt ? user?.id : undefined
  const { data: onboardingProfile, isPending: isProfilePending } = useOnboardingProfile(
    shouldLoadProfileForPrompt
  )

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: onboardingDefaultValues,
    mode: 'onBlur',
  })

  const computedValues = useMemo(() => {
    if (!isProfilePrompt) {
      return onboardingDefaultValues
    }

    return createOnboardingValuesFromProfile({ onboardingProfile, profile })
  }, [isProfilePrompt, onboardingProfile, profile])

  useEffect(() => {
    if (!isProfilePrompt) return
    if (!user?.id) return
    if (!onboardingProfile) return
    form.reset(computedValues)
  }, [computedValues, form, onboardingProfile, user?.id, isProfilePrompt])

  const mutation = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      if (!user?.id) {
        throw new Error('You need to be signed in to continue.')
      }

      await persistBasicInformation({
        supabase,
        userId: user.id,
        values: pickBasicInformation(values),
        updateProfile,
      })

      await queryClient.invalidateQueries({ queryKey: ['onboarding-profile', user.id] })
    },
    onSuccess: () => {
      toast.show('Profile updated', {
        message: 'Thanks! You can keep exploring the app.',
      })

      const promptId = promptIdRef.current
      if (promptId) {
        markPromptCompleted(promptId)
      }
    },
    onError: (error: unknown) => {
      toast.show('Unable to save your info', {
        message: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  const handleSave = form.handleSubmit((values) => mutation.mutateAsync(values))

  const isLoading =
    isUserPending ||
    isPromptLoading ||
    (isProfilePrompt && (isProfilePending || mutation.isPending))

  const normalizedPath = pathname?.toLowerCase() ?? ''
  const isAuthRoute =
    normalizedPath.includes(AUTH_ROUTES.INDEX?.fullPath || '/auth') ||
    normalizedPath.includes(AUTH_ROUTES.CONFIRM?.fullPath || '/auth/confirm') ||
    normalizedPath.includes(AUTH_ROUTES.WELCOME?.fullPath || '/auth/welcome') ||
    normalizedPath.includes('/auth/')

  if (disabled) return null
  if (!user) return null
  if (isLoading) return null
  if (!prompt) return null
  if (isAuthRoute) return null
  if (isProfilePrompt && isBasicInformationComplete(computedValues)) return null

  const renderProfilePrompt = () => (
    <FormProvider {...form}>
      <FormWrapper>
        <FormWrapper.Body>
          <YStack gap="$4">
            <YStack gap="$2">
              <H2 size="$7">{prompt.title}</H2>
              <Paragraph size="$3" color="$gray11">
                {prompt.description}
              </Paragraph>
            </YStack>
            <BasicInformationStep form={form} />
          </YStack>
        </FormWrapper.Body>
        <FormWrapper.Footer>
          <Theme inverse>
            <SubmitButton
              br="$10"
              onPress={() => handleSave().catch(() => {})}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Save and continue'}
            </SubmitButton>
          </Theme>
        </FormWrapper.Footer>
      </FormWrapper>
    </FormProvider>
  )

  const renderCustomPrompt = () => {
    if (!prompt.componentId) return null
    const Component = CTA_COMPONENTS[prompt.componentId]
    if (!Component) return null

    const handleComplete = () => {
      markPromptCompleted(prompt.id)
    }

    return (
      <YStack gap="$4">
        <Component prompt={prompt} onComplete={handleComplete} />
      </YStack>
    )
  }

  const content = isProfilePrompt ? renderProfilePrompt() : renderCustomPrompt()
  if (!content) return null

  return (
    <Dialog modal open>
      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom={false} animation="medium" zIndex={200000}>
          <Sheet.Frame padding="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay animation="medium" backgroundColor="rgba(0,0,0,0.6)" />
        <Dialog.Content
          bordered
          elevate
          gap="$0"
          width={480}
          maxWidth="100%"
          $sm={{ width: '100%' }}
        >
          {content}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
