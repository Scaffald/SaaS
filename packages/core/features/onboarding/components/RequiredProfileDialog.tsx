import { useEffect, useMemo } from 'react'
import { Adapt, Dialog, Sheet } from 'tamagui'
import {
  FormWrapper,
  H2,
  Paragraph,
  SubmitButton,
  Theme,
  YStack,
  useToastController,
} from '@app/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useUser } from 'app/utils/useUser'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { usePathname } from 'app/utils/usePathname'
import { ROUTES } from '@app/core/constants/routes'

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
  const { data: onboardingProfile, isPending: isProfilePending } = useOnboardingProfile(user?.id)

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: onboardingDefaultValues,
    mode: 'onBlur',
  })

  const computedValues = useMemo(
    () => createOnboardingValuesFromProfile({ onboardingProfile, profile }),
    [onboardingProfile, profile]
  )

  useEffect(() => {
    if (!user?.id) return
    if (!onboardingProfile) return
    form.reset(computedValues)
  }, [computedValues, form, onboardingProfile, user?.id])

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
    },
    onError: (error: unknown) => {
      toast.show('Unable to save your info', {
        message: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  const handleSave = form.handleSubmit((values) => mutation.mutateAsync(values))

  const isLoading = isUserPending || isProfilePending
  const normalizedPath = pathname?.toLowerCase() ?? ''
  const isAuthRoute =
    normalizedPath.includes(ROUTES.LOGIN) ||
    normalizedPath.includes(ROUTES.RESET_PASSWORD) ||
    normalizedPath.includes('/onboarding') ||
    normalizedPath.includes('/(auth)/')

  if (disabled) return null
  if (!user) return null
  if (isLoading) return null
  if (isAuthRoute) return null
  if (isBasicInformationComplete(computedValues)) return null

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
          <FormProvider {...form}>
            <FormWrapper>
              <FormWrapper.Body>
                <YStack gap="$4">
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
