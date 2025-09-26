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
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { createParam } from 'solito'
import { Link } from 'solito/link'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import type { Database } from '@app/supabase/types'

import { SocialLogin } from './components/SocialLogin'

const { useParams, useUpdateParams } = createParam<{ email?: string }>()

const SignUpSchema = z.object({
  firstName: formFields.text.describe('First Name // Jane').min(1, 'First name is required'),
  lastName: formFields.text.describe('Last Name // Doe').min(1, 'Last name is required'),
  email: formFields.text.email().describe('Email // your@email.acme'),
  phone: formFields.text.describe('Phone // +1 (555) 555-5555').min(1, 'Phone number is required'),
  industryId: formFields
    .select
    .describe('Industry')
    .min(1, 'Industry is required'),
  password: formFields.text.min(6).describe('Password // Choose a password'),
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

  const industriesQuery = useQuery<Database['public']['Tables']['industries']['Row'][]>({
    queryKey: ['industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },
  })

  const industryOptions = useMemo(
    () =>
      industriesQuery.data?.map((industry) => ({
        value: industry.id,
        name: industry.name,
      })) ?? [],
    [industriesQuery.data]
  )

  async function signUpWithEmail({
    firstName,
    lastName,
    email,
    phone,
    industryId,
    password,
  }: z.infer<typeof SignUpSchema>) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}`,
        // To take user's name other info
        data: {
          name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName,
          phone,
          industry_id: industryId,
        },
      },
    })

    if (error) {
      const errorMessage = error?.message.toLowerCase()
      if (errorMessage.includes('email')) {
        form.setError('email', { type: 'custom', message: errorMessage })
      } else if (errorMessage.includes('password')) {
        form.setError('password', { type: 'custom', message: errorMessage })
      } else {
        form.setError('password', { type: 'custom', message: errorMessage })
      }
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
            firstName: '',
            lastName: '',
            email: params?.email || '',
            phone: '',
            industryId: '',
            password: '',
          }}
          props={{
            password: {
              secureTextEntry: true,
            },
            industryId: {
              options: industryOptions,
              placeholder: industriesQuery.isPending
                ? 'Loading industries…'
                : industryOptions.length > 0
                  ? 'Select an industry'
                  : 'No industries available',
            },
          }}
          onSubmit={signUpWithEmail}
          renderAfter={({ submit }) => (
            <>
              <Theme inverse>
                <SubmitButton onPress={() => submit()} br="$10">
                  Sign Up
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
                <H2 $sm={{ size: '$8' }}>Get Started</H2>
                <Paragraph theme="alt2">Create a new account</Paragraph>
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
          <H2>Check Your Email</H2>
          <Paragraph theme="alt1">
            We&apos;ve sent you a confirmation link. Please check your email ({email}) and confirm
            it.
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
