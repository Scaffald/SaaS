import {
  H2,
  LoadingOverlay,
  Paragraph,
  SubmitButton,
  Text,
  Theme,
  YStack,
  isWeb,
} from '@app/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useEffect } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { createParam } from 'solito'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { SocialLogin } from './components/SocialLogin'
import { MagicLinkPending } from './components/MagicLinkPending'

const { useParams, useUpdateParams } = createParam<{ email?: string }>()

const SignInSchema = z.object({
  email: formFields.text.email().describe('Email // Enter your email'),
})

export const SignInScreen = () => {
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
  const form = useForm<z.infer<typeof SignInSchema>>()

  async function sendMagicLink({ email }: z.infer<typeof SignInSchema>) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}`,
        shouldCreateUser: false,
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
          schema={SignInSchema}
          defaultValues={{
            email: params?.email || '',
          }}
          onSubmit={sendMagicLink}
          renderAfter={({ submit }) => {
            return (
              <>
                <Theme inverse>
                  <SubmitButton onPress={() => submit()} br="$10">
                    Send magic link
                  </SubmitButton>
                </Theme>
                <SignUpLink />
                {isWeb && <SocialLogin />}
              </>
            )
          }}
        >
          {(fields) => (
            <>
              <YStack gap="$3" mb="$4">
                <H2 $sm={{ size: '$8' }}>Welcome back</H2>
                <Paragraph theme="alt1">
                  Enter your email and we&apos;ll send a one-time sign-in link.
                </Paragraph>
              </YStack>
              {Object.values(fields)}
              {!isWeb && (
                <YStack mt="$4">
                  <SocialLogin />
                </YStack>
              )}
            </>
          )}
        </SchemaForm>
      )}
      {/* this is displayed when the session is being updated - usually when the user is redirected back from an auth provider */}
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

const SignUpLink = () => {
  const email = useWatch<z.infer<typeof SignInSchema>>({ name: 'email' })
  return (
    <Link href={`/sign-up?${new URLSearchParams(email ? { email } : undefined).toString()}`}>
      <Paragraph ta="center" theme="alt1">
        Don&apos;t have an account? <Text textDecorationLine="underline">Sign up</Text>
      </Paragraph>
    </Link>
  )
}

const CheckYourEmail = () => {
  const email = useWatch<z.infer<typeof SignInSchema>>({ name: 'email' })
  const { reset } = useFormContext<z.infer<typeof SignInSchema>>()

  return (
    <MagicLinkPending
      email={email}
      linkInstruction="Open it to sign back in."
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
