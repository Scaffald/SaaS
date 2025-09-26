import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import {
  TravelComplianceSchema,
  type TravelComplianceFormValues,
} from './schemas/travel-compliance-schema'
import { useTravelCompliance, useTravelComplianceMutation } from './hooks'

export const ProfileTravelComplianceScreen = () => {
  const { user, defaultValues, updateProfile, isPending } = useTravelCompliance()
  const mutation = useTravelComplianceMutation({ updateProfile })

  const handleSubmit = async (values: TravelComplianceFormValues) => {
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
        schema={TravelComplianceSchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>Travel & Compliance</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Travel & Compliance'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
