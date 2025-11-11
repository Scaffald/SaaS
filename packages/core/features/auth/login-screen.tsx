import {
  Button,
  H2,
  LoadingOverlay,
  Paragraph,
  Text,
  YStack,
  isWeb,
  Input,
  Form,
} from '@app/ui'
import { useUser } from '@app/core/utils/useUser'
import { ScaffaldLogo } from '@app/core/assets'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@app/core/utils/supabase/client'
import { z } from 'zod'
import { SocialLogin } from './components/SocialLogin'
import { captureEvent } from '@app/core/utils/analytics/client'
import { captureEventWithQueue } from '@app/core/utils/analytics/queue'
import { api } from '@app/core/utils/api'
import { TRPCClientError } from '@trpc/client'

const LoginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email // your@email.acme'),
})

export const LoginScreen = () => {
  // Using supabase directly from import
  const params = useLocalSearchParams<{ email?: string }>()
  const router = useRouter()
  useRedirectAfterSignIn()
  const { isLoadingSession } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requestMagicLink = api.auth.requestMagicLink.useMutation()

  useEffect(() => {
    // remove the persisted email from the url, mostly to not leak user's email in case they share it
    if (params?.email) {
      router.replace('/auth')
    }
  }, [params?.email, router])

  const form = useForm<z.infer<typeof LoginSchema>>({
    defaultValues: {
      email: params?.email || '',
    },
  })

  async function sendMagicLink(data: z.infer<typeof LoginSchema>) {
    console.log('Sending magic link for:', data.email)
    setIsSubmitting(true)

    const trimmedEmail = data.email?.trim()

    if (!trimmedEmail) {
      form.setError('email', { type: 'custom', message: 'Email is required' })
      setIsSubmitting(false)
      return
    }

    const normalizedEmail = trimmedEmail.toLowerCase()
    const emailDomain = normalizedEmail.includes('@') ? normalizedEmail.split('@')[1] ?? 'unknown' : 'unknown'

    try {
      const redirectTo = process.env.EXPO_PUBLIC_URL

      const result = await requestMagicLink.mutateAsync({
        email: normalizedEmail,
        redirectTo,
      })

      await captureEventWithQueue('auth_magic_link_requested', {
        email_domain: emailDomain,
        mode: result?.mode ?? null,
      })

      console.log('Magic link sent successfully!')
      // Navigate to verify screen with email
      router.push({
        pathname: '/auth/verify',
        params: { email: normalizedEmail, mode: result?.mode },
      })
    } catch (error) {
      console.error('Error sending magic link:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCode =
        error instanceof TRPCClientError ? error.data?.code ?? error.name : error instanceof Error ? error.name : 'unknown'

      captureEvent('auth_magic_link_failed', {
        email_domain: emailDomain || null,
        error_code: errorCode ?? null,
        message: errorMessage ?? null,
      })

      if (error instanceof TRPCClientError) {
        const lowerMessage = error.message.toLowerCase()
        if (lowerMessage.includes('email')) {
          form.setError('email', { type: 'custom', message: error.message })
          return
        }
      }
      form.setError(
        'email',
        {
          type: 'custom',
          message:
            error instanceof Error
              ? error.message
              : 'Something went wrong while sending your magic link.',
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = form.handleSubmit(sendMagicLink)

  return (
    <FormProvider {...form}>
      <YStack gap="$4" p="$4">
        <YStack gap="$4" mb="$3" items="center">
          <ScaffaldLogo width={200} height={33} />
          <YStack gap="$2" items="center">
            <Paragraph text="center">Email works for both login and signup</Paragraph>
          </YStack>
        </YStack>

        <Form onSubmit={handleSubmit}>
          <YStack gap="$4">
            <Input
              placeholder="your@email.acme"
              value={form.watch('email')}
              onChangeText={(text) => form.setValue('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {form.formState.errors.email && (
              <Text color="$red10" fontSize="$2">
                {form.formState.errors.email.message}
              </Text>
            )}

            <Button
              onPress={handleSubmit}
              disabled={isSubmitting || requestMagicLink.isLoading}
              opacity={isSubmitting || requestMagicLink.isLoading ? 0.5 : 1}
              bg="$blue9"
              color="$blue1"
              animation="quick"
              hoverStyle={{ scale: 1.02, bg: '$blue9' }}
              pressStyle={{ scale: 0.98 }}
            >
              {isSubmitting || requestMagicLink.isLoading ? 'Sending...' : 'Sign In or Register'}
            </Button>

            <SocialLogin />
            <Paragraph text="center">
              If you login with Apple or Google and already have an account with the same email we
              will link it for you. If you don&apos;t currently have an account, this will register
              one.
            </Paragraph>
          </YStack>
        </Form>
      </YStack>
      {/* this is displayed when the session is being updated - usually when the user is redirected back from an auth provider */}
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

// we use this hook here because this is the page we redirect unauthenticated users to
// if they authenticate on this page, this will redirect them to the home page
function useRedirectAfterSignIn() {
  // Using supabase directly from import
  const router = useRouter()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [router])
}
