import {
  Button,
  EnhancedAnimatedButton,
  H2,
  LoadingOverlay,
  Paragraph,
  Text,
  Theme,
  YStack,
  isWeb,
} from '@app/ui'
import { SchemaForm, formFields } from '@app/core/utils/SchemaForm'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useUser } from '@app/core/utils/useUser'
import { useEffect } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { createParam } from 'solito'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { SocialLogin } from './components/SocialLogin'
import { MagicLinkPending } from './components/MagicLinkPending'

const { useParams, useUpdateParams } = createParam<{ email?: string }>()

const LoginSchema = z.object({
  email: formFields.text.email().describe('Email // your@email.acme'),
})

export const LoginScreen = () => {
  const supabase = useSupabase()
  const { params } = useParams()
  const updateParams = useUpdateParams()
  useRedirectAfterSignIn()
  const { isLoadingSession } = useUser()

  useEffect(() => {
    // remove the persisted email from the url, mostly to not leak user's email in case they share it
    if (params?.email) {
      updateParams({ email: undefined }, { web: { replace: true } })
    }
  }, [params?.email, updateParams])

  const form = useForm<z.infer<typeof LoginSchema>>()

  async function sendMagicLink({ email }: z.infer<typeof LoginSchema>) {
    // Additional validation to ensure email is present
    if (!email || email.trim() === '') {
      form.setError('email', { type: 'custom', message: 'Email is required' })
      throw new Error('Email is required')
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}`,
        shouldCreateUser: true, // Allow both sign-in and sign-up
      },
    })

    if (error) {
      const errorMessage = error?.message.toLowerCase()
      if (errorMessage.includes('email')) {
        form.setError('email', { type: 'custom', message: errorMessage })
      }
      throw error
    }
  }

  return (
    <FormProvider {...form}>
      {form.formState.isSubmitSuccessful ? (
        <CheckYourEmail />
      ) : (
        <SchemaForm
          form={form}
          schema={LoginSchema}
          defaultValues={{
            email: params?.email || '',
          }}
          onSubmit={sendMagicLink}
          renderAfter={({ submit }) => {
            return (
              <>
                <Theme inverse>
                  <Button
                    onPress={submit}
                  >Send Magic Link</Button>
                </Theme>

                {isWeb && <SocialLogin />}
              </>
            )
          }}
        >
          {(fields) => (
            <>
              <YStack gap="$3" mb="$3">
                <H2 $sm={{ size: '$8' }}>Get started</H2>
                <Paragraph theme="alt2">
                  Enter your email and we&apos;ll send a one-time sign-in link.
                </Paragraph>
              </YStack>
              {Object.values(fields)}
              {!isWeb && <SocialLogin />}
            </>
          )}
        </SchemaForm>
      )}
      {/* this is displayed when the session is being updated - usually when the user is redirected back from an auth provider */}
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

const CheckYourEmail = () => {
  const email = useWatch<z.infer<typeof LoginSchema>>({ name: 'email' })
  const { reset } = useFormContext<z.infer<typeof LoginSchema>>()

  return (
    <MagicLinkPending
      email={email}
      linkInstruction="Open it to sign in."
      onBack={() => reset({ email })}
    />
  )
}

// we use this hook here because this is the page we redirect unauthenticated users to
// if they authenticate on this page, this will redirect them to the home page
function useRedirectAfterSignIn() {
  const supabase = useSupabase()
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
