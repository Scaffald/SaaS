import {
  Avatar,
  FormWrapper,
  FullscreenSpinner,
  SubmitButton,
  Theme,
  View,
  YStack,
  useToastController,
} from '@app/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SchemaForm, formFields } from '@app/core/utils/SchemaForm'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useCallback } from 'react'
import { useUser } from '@app/core/utils/useUser'
import { createParam } from 'solito'
import { SolitoImage } from 'solito/image'
import { useRouter } from 'solito/router'
import { z } from 'zod'

import { api } from '../../utils/api'
import { UploadAvatar } from '../settings/components/upload-avatar'

const { useParams } = createParam<{ edit_name?: '1'; edit_about?: '1' }>()

type EditProfileScreenProps = {
  onSuccess?: () => void
}

export const EditProfileScreen = ({ onSuccess }: EditProfileScreenProps = {}) => {
  const { profile, user } = useUser()
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    if (onSuccess) {
      onSuccess()
      return
    }

    router.back()
  }, [onSuccess, router])

  if (!profile || !user?.id) {
    return <FullscreenSpinner />
  }
  return (
    <EditProfileForm
      userId={user.id}
      initial={{ name: profile.name, about: profile.about }}
      onSubmitSuccess={handleSuccess}
    />
  )
}

const ProfileSchema = z.object({
  name: formFields.text.describe('Name // John Doe'),
  about: formFields.textarea.describe('About // Tell us a bit about yourself'),
})

const EditProfileForm = ({
  initial,
  userId,
  onSubmitSuccess,
}: {
  initial: { name: string | null; about: string | null }
  userId: string
  onSubmitSuccess: () => void
}) => {
  const { params } = useParams()
  const supabase = useSupabase()
  const toast = useToastController()
  const queryClient = useQueryClient()
  const _apiUtils = api.useUtils()
  const mutation = useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      await supabase
        .from('profiles')
        .update({ name: data.name, about: data.about })
        .eq('id', userId)
    },

    async onSuccess() {
      toast.show('Successfully updated!')
      await queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      onSubmitSuccess()
    },
  })

  return (
    <FormWrapper>
      <SchemaForm
        schema={ProfileSchema}
        props={{
          name: {
            autoFocus: !!params?.edit_name,
          },
          about: {
            autoFocus: !!params?.edit_about,
          },
        }}
        defaultValues={{
          name: initial.name ?? '',
          about: initial.about ?? '',
        }}
        onSubmit={(values) => mutation.mutate(values)}
        renderAfter={({ submit }) => (
          <Theme inverse>
            <SubmitButton onPress={() => submit()}>Update Profile</SubmitButton>
          </Theme>
        )}
      >
        {(fields) => (
          <>
            <YStack mb="$4" ai="center">
              <View>
                <UploadAvatar>
                  <UserAvatar />
                </UploadAvatar>
              </View>
            </YStack>
            {Object.values(fields)}
          </>
        )}
      </SchemaForm>
    </FormWrapper>
  )
}

const UserAvatar = () => {
  const { avatarUrl } = useUser()
  return (
    <Avatar circular size={128}>
      <SolitoImage src={avatarUrl} alt="your avatar" width={128} height={128} />
    </Avatar>
  )
}
