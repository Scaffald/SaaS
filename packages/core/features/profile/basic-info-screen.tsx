import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import { BasicInfoSchema, type BasicInfoFormValues } from './schemas/basic-info-schema'
import { useBasicInfo, useBasicInfoMutation } from './hooks'

export const ProfileBasicInfoScreen = () => {
  const { user, defaultValues, updateProfile, isPending } = useBasicInfo()
  const mutation = useBasicInfoMutation({ updateProfile })

  const handleSubmit = async (values: BasicInfoFormValues) => {
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
        schema={BasicInfoSchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>Basic Information</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Basic Information'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
