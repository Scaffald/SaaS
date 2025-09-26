import { Button, H2, Paragraph, SubmitButton, Theme, YStack } from '@app/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type MagicLinkPendingProps = {
  email?: string
  linkInstruction: string
  onBack: () => void
  backLabel?: string
  submitLabel?: string
}

const VerifyCodeSchema = z.object({
  token: formFields.text
    .min(1, 'Enter the code from your email.')
    .max(255, 'The code looks too long.')
    .describe('Verification code // 000000'),
})

type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>

export const MagicLinkPending = ({
  email,
  linkInstruction,
  onBack,
  backLabel = 'Back',
  submitLabel = 'Submit code',
}: MagicLinkPendingProps) => {
  const supabase = useSupabase()
  const form = useForm<VerifyCodeInput>({
    defaultValues: { token: '' },
  })

  async function submitCode({ token }: VerifyCodeInput) {
    const cleanedToken = token.trim()

    if (!email) {
      const errorMessage = 'Please go back and request a new code.'
      form.setError('token', { type: 'custom', message: errorMessage })
      throw new Error(errorMessage)
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: cleanedToken,
      type: 'magiclink',
    })

    if (error) {
      form.setError('token', { type: 'custom', message: error.message })
      throw error
    }
  }

  const displayEmail = email ?? 'your email address'

  return (
    <SchemaForm
      form={form}
      schema={VerifyCodeSchema}
      onSubmit={submitCode}
      renderAfter={({ submit }) => (
        <>
          <Theme inverse>
            <SubmitButton onPress={() => submit()} br="$10">
              {submitLabel}
            </SubmitButton>
          </Theme>
          <Button themeInverse icon={ChevronLeft} br="$10" onPress={onBack}>
            {backLabel}
          </Button>
        </>
      )}
    >
      {(fields) => (
        <>
          <YStack gap="$3" mb="$4">
            <H2>Check your email</H2>
            <Paragraph theme="alt1">
              We&apos;ve sent a magic link to {displayEmail}. {linkInstruction}
            </Paragraph>
            <Paragraph theme="alt2">
              Can&apos;t tap the link? Enter the code from the email below.
            </Paragraph>
          </YStack>
          {fields.token}
        </>
      )}
    </SchemaForm>
  )
}
