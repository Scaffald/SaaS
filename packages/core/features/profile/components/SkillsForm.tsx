import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import { SkillsSchema, type SkillsFormValues } from '../schemas/skills-schema'
import { useSkills, useSkillsMutation } from '../hooks'

export const SkillsForm = () => {
  const { user, defaultValues, updateProfile, isPending } = useSkills()
  const mutation = useSkillsMutation({ updateProfile })

  const handleSubmit = async (values: SkillsFormValues) => {
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
        schema={SkillsSchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>Skills</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Skills'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
