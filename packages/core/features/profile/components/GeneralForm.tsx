import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import { GeneralSchema, type GeneralFormValues } from '../schemas/general-schema'
import { useGeneral, useGeneralMutation } from '../hooks'

export const GeneralForm = () => {
  const { user, defaultValues, updateProfile, isPending } = useGeneral()
  const mutation = useGeneralMutation({ updateProfile })

  const handleSubmit = async (values: GeneralFormValues) => {
    if (!user?.id) {
      throw new Error('You need to be signed in to update your profile.')
    }

    await mutation.mutateAsync({ userId: user.id, values })
  }

  if (isPending) {
    return (
      <FormWrapper>
        <YStack f={1} jc="center" ai="center">
          <H2>Loading...</H2>
        </YStack>
      </FormWrapper>
    )
  }

  return (
    <FormWrapper>
      <SchemaForm
        onSubmit={handleSubmit}
        schema={GeneralSchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>General Information</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update General Information'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
