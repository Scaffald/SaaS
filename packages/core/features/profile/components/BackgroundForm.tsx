import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import { BackgroundSchema, type BackgroundFormValues } from '../schemas/background-schema'
import { useBackground, useBackgroundMutation } from '../hooks'

export const BackgroundForm = () => {
  const { user, defaultValues, updateProfile, isPending } = useBackground()
  const mutation = useBackgroundMutation({ updateProfile })

  const handleSubmit = async (values: BackgroundFormValues) => {
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
        schema={BackgroundSchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>Background</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Background'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
