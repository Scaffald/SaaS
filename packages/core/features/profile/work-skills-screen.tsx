import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import { WorkSkillsSchema, type WorkSkillsFormValues } from './schemas/work-skills-schema'
import { useWorkSkills, useWorkSkillsMutation } from './hooks'

export const ProfileWorkSkillsScreen = () => {
  const { user, defaultValues, updateProfile, isPending } = useWorkSkills()
  const mutation = useWorkSkillsMutation({ updateProfile })

  const handleSubmit = async (values: WorkSkillsFormValues) => {
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
        schema={WorkSkillsSchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>Work & Skills</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Work & Skills'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
