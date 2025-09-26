import {
  Button,
  FormWrapper,
  H2,
  Paragraph,
  SubmitButton,
  Text,
  Theme,
  YStack,
  isWeb,
} from '@app/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { SchemaForm, formFields } from '@app/core/utils/SchemaForm'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useEffect } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { createParam } from 'solito'
import { Link } from 'solito/link'
import { z } from 'zod'

import { SocialLogin } from './components/SocialLogin'

const { useParams, useUpdateParams } = createParam<{ email?: string }>()

const SignUpSchema = z.object({
  email: formFields.text.email().describe('Email // your@email.acme'),
})

export const SignUpScreen = () => {
  const supabase = useSupabase()
  const updateParams = useUpdateParams()
  const { params } = useParams()

  useEffect(() => {
    if (params?.email) {
      updateParams({ email: undefined }, { web: { replace: true } })
    }
  }, [params?.email, updateParams])

  const form = useForm<z.infer<typeof SignUpSchema>>()

  async function sendMagicLink({ email }: z.infer<typeof SignUpSchema>) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}`,
        shouldCreateUser: true,
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
          schema={SignUpSchema}
          defaultValues={{
            email: params?.email || '',
          }}
          onSubmit={sendMagicLink}
          renderAfter={({ submit }) => (
            <>
              <Theme inverse>
                <SubmitButton onPress={() => submit()} br="$10">
                  Send magic link
                </SubmitButton>
              </Theme>
              <SignInLink />
              {isWeb && <SocialLogin />}
            </>
          )}
        >
          {(fields) => (
            <>
              <YStack gap="$3" mb="$4">
                <H2 $sm={{ size: '$8' }}>Get started</H2>
                <Paragraph theme="alt2">
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
    </FormProvider>
  )
}

const SignInLink = () => {
  const email = useWatch<z.infer<typeof SignUpSchema>>({ name: 'email' })

  return (
    <Link href={`/sign-in?${new URLSearchParams(email ? { email } : undefined).toString()}`}>
      <Paragraph ta="center" theme="alt1" mt="$2">
        Already signed up? <Text textDecorationLine="underline">Sign in</Text>
      </Paragraph>
    </Link>
  )
}

const CheckYourEmail = () => {
  const email = useWatch<z.infer<typeof SignUpSchema>>({ name: 'email' })
  const { reset } = useFormContext()

  return (
    <FormWrapper>
      <FormWrapper.Body>
        <YStack gap="$3">
          <H2>Check your email</H2>
          <Paragraph theme="alt1">
            We&apos;ve sent a magic link to {email}. Open it to finish signing up.
          </Paragraph>
        </YStack>
      </FormWrapper.Body>
      <FormWrapper.Footer>
        <Button themeInverse icon={ChevronLeft} br="$10" onPress={() => reset()}>
          Back
        </Button>
      </FormWrapper.Footer>
    </FormWrapper>
  )
}
