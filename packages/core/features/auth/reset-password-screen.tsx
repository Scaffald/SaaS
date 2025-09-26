import { H2, Paragraph, SubmitButton, Text, Theme, YStack } from '@app/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useEffect } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { createParam } from 'solito'
import { Link } from 'solito/link'
import { z } from 'zod'
import { ROUTES, buildRoute } from '@app/core/constants/routes'
import { MagicLinkPending } from './components/MagicLinkPending'

const { useParams, useUpdateParams } = createParam<{ email?: string }>()

const ResetPasswordSchema = z.object({
  email: formFields.text.email().describe('Email // your@email.acme'),
})

export const ResetPasswordScreen = () => {
  const supabase = useSupabase()
  const { params } = useParams()
  const updateParams = useUpdateParams()
  useEffect(() => {
    if (params?.email) {
      updateParams({ email: undefined }, { web: { replace: true } })
    }
  }, [params?.email, updateParams])

  const form = useForm<z.infer<typeof ResetPasswordSchema>>()

  async function sendMagicLink({ email }: z.infer<typeof ResetPasswordSchema>) {
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
      } else {
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
          schema={ResetPasswordSchema}
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
                <SignInLink />
              </>
            )
          }}
        >
          {(fields) => (
            <>
              <YStack gap="$3" mb="$4">
                <H2 $sm={{ size: '$8' }}>Email me a link</H2>
                <Paragraph theme="alt1">
                  Enter your email and we&apos;ll send you a one-time sign-in link.
                </Paragraph>
              </YStack>
              {Object.values(fields)}
            </>
          )}
        </SchemaForm>
      )}
    </FormProvider>
  )
}

const CheckYourEmail = () => {
  const email = useWatch<z.infer<typeof ResetPasswordSchema>>({ name: 'email' })
  const { reset } = useFormContext()

  return (
    <MagicLinkPending
      email={email}
      linkInstruction="Open it to get back into your account."
      onBack={() => reset()}
    />
  )
}

const SignInLink = () => {
  const email = useWatch<z.infer<typeof ResetPasswordSchema>>({ name: 'email' })

  return (
    <Link href={buildRoute(ROUTES.LOGIN, email ? { email } : undefined)}>
      <Paragraph ta="center" theme="alt1">
        Done resetting? <Text textDecorationLine="underline">Sign in</Text>
      </Paragraph>
    </Link>
  )
}
