import { H2, SubmitButton, Theme, YStack, isWeb, FormWrapper } from '@app/ui'
import { SchemaForm } from '@app/core/utils/SchemaForm'
import {
  ContactAvailabilitySchema,
  type ContactAvailabilityFormValues,
} from '../schemas/contact-availability-schema'
import { useContactAvailability, useContactAvailabilityMutation } from '../hooks'

export const ContactAvailabilityForm = () => {
  const { user, defaultValues, updateProfile, isPending } = useContactAvailability()
  const mutation = useContactAvailabilityMutation({ updateProfile })

  const handleSubmit = async (values: ContactAvailabilityFormValues) => {
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
        schema={ContactAvailabilitySchema}
        defaultValues={defaultValues}
        renderBefore={() =>
          isWeb && (
            <YStack px="$4" py="$4" pb="$2">
              <H2>Contact & Availability</H2>
            </YStack>
          )
        }
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Contact & Availability'}
            </SubmitButton>
          </Theme>
        )}
      />
    </FormWrapper>
  )
}
