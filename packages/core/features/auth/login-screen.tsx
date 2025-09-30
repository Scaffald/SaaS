import {
  Button,
  H2,
  LoadingOverlay,
  Paragraph,
  Text,
  Theme,
  YStack,
  isWeb,
  Input,
  Form,
} from '@app/ui'
import { supabase } from '@app/core/utils/supabase/client'
import { useUser } from '@app/core/utils/useUser'
import { ScaffaldLogo } from '@app/core/assets'
import { useEffect, useState } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Link } from 'expo-router'
import { z } from 'zod'
import { SocialLogin } from './components/SocialLogin'
import { MagicLinkPending } from './components/MagicLinkPending'

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
  const [submitSuccess, setSubmitSuccess] = useState(false)

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

    try {
      // Additional validation to ensure email is present
      if (!data.email || data.email.trim() === '') {
        form.setError('email', { type: 'custom', message: 'Email is required' })
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: data.email.trim(),
        options: {
          emailRedirectTo: `${process.env.EXPO_PUBLIC_URL}`,
          shouldCreateUser: true, // Allow both sign-in and sign-up
        },
      })

      if (error) {
        console.error('Magic link error:', error)
        const errorMessage = error?.message.toLowerCase()
        if (errorMessage.includes('email')) {
          form.setError('email', { type: 'custom', message: errorMessage })
        }
        throw error
      }

      console.log('Magic link sent successfully!')
      setSubmitSuccess(true)
    } catch (error) {
      console.error('Error sending magic link:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = form.handleSubmit(sendMagicLink)

  return (
    <FormProvider {...form}>
      {submitSuccess ? (
        <CheckYourEmail />
      ) : (
        <YStack gap="$4" p="$4" maxW={400} flex={1}>
          <YStack gap="$4" mb="$3" items="center">
            <ScaffaldLogo width={200} height={33} />
            <YStack gap="$2" items="center">
              <H2 $sm={{ size: '$8' }}>Get started</H2>
              <Paragraph theme="alt2" text="center">
                Enter your email and we&apos;ll send a one-time sign-in link.
              </Paragraph>
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

              <Theme inverse>
                <Button
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  opacity={isSubmitting ? 0.5 : 1}
                >
                  {isSubmitting ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </Theme>

              {isWeb && <SocialLogin />}
              {!isWeb && <SocialLogin />}
            </YStack>
          </Form>
        </YStack>
      )}
      {/* this is displayed when the session is being updated - usually when the user is redirected back from an auth provider */}
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

const CheckYourEmail = () => {
  const email = useWatch<z.infer<typeof LoginSchema>>({ name: 'email' })
  const { reset } = useFormContext<z.infer<typeof LoginSchema>>()

  return <MagicLinkPending email={email} onBack={() => reset({ email })} />
}

// we use this hook here because this is the page we redirect unauthenticated users to
// if they authenticate on this page, this will redirect them to the home page
function useRedirectAfterSignIn() {
  // Using supabase directly from import
  const router = useRouter()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [supabase, router])
}
