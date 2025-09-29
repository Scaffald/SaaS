import React, { useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  TextArea,
  Avatar,
  H4,
  Spinner,
  AnimatePresence,
  ScrollView,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { generalProfileSchema, type GeneralProfileFormData, generalProfileDefaults } from './config'
import { PhoneNumberInput } from '@app/ui'
import { api } from '@app/core/utils/api'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import { DashboardWidget, AvatarImagePicker } from '@app/ui'

/**
 * Profile General Left Component
 * Form for editing general profile information
 */
export function ProfileGeneralLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastController()

  // Use tRPC to fetch and update profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch,
  } = api.profile.getGeneral.useQuery()
  const updateProfileMutation = api.profile.updateGeneral.useMutation({
    onSuccess: () => {
      toast.show('Profile Updated', {
        message: 'Your profile has been saved successfully!',
      })
      refetch()
    },
    onError: (error) => {
      console.error('Error saving profile:', error)
      toast.show('Error', {
        message: error.message || 'Failed to save profile. Please try again.',
      })
    },
  })

  const uploadAvatarMutation = api.profile.uploadAvatar.useMutation({
    onSuccess: (data) => {
      toast.show('Avatar Uploaded', {
        message: 'Your avatar has been uploaded successfully!',
      })
      // Update the form with the new avatar path
      setValue('avatar_path', data.avatarPath)
      refetch()
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error)
      toast.show('Upload Error', {
        message: error.message || 'Failed to upload avatar. Please try again.',
      })
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
  } = useForm<GeneralProfileFormData>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: generalProfileDefaults,
    mode: 'onChange', // Real-time validation
  })

  const avatarPath = watch('avatar_path')

  // Reset form when profile data is loaded
  React.useEffect(() => {
    if (profileData) {
      reset(profileData)
    }
  }, [profileData, reset])

  const onSubmit = async (data: GeneralProfileFormData) => {
    setIsLoading(true)
    try {
      await updateProfileMutation.mutateAsync(data)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <YStack gap="$4" padding="$4" flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
        <Text>Loading profile...</Text>
      </YStack>
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <DashboardWidget>
        <H4>Edit General Information</H4>

        <YStack gap="$4">
          {/* Avatar Section */}
          <YStack gap="$3" alignItems="center">
            <Text fontWeight="600">Profile Photo</Text>
            <AvatarImagePicker
              value={getAvatarUrl(avatarPath) || ''}
              onImageSelect={async (imageUri) => {
                if (imageUri) {
                  // Convert image to base64 for upload
                  try {
                    const response = await fetch(imageUri)
                    const blob = await response.blob()
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      const base64data = reader.result as string
                      uploadAvatarMutation.mutate({
                        file: base64data,
                        fileName: `avatar-${Date.now()}.jpg`,
                        contentType: blob.type || 'image/jpeg',
                      })
                    }
                    reader.readAsDataURL(blob)
                  } catch (error) {
                    console.error('Error processing image:', error)
                    toast.show('Error', {
                      message: 'Failed to process image. Please try again.',
                    })
                  }
                } else {
                  // Clear avatar
                  setValue('avatar_path', '')
                }
              }}
              size={120}
              disabled={uploadAvatarMutation.isPending}
              placeholder="Upload Avatar"
            />
            {uploadAvatarMutation.isPending && (
              <Text fontSize="$2" color="$gray10">
                Uploading avatar...
              </Text>
            )}
          </YStack>

          {/* Name Fields */}
          <XStack gap="$3">
            <YStack gap="$2" flex={1}>
              <Text fontWeight="600">First Name *</Text>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="First name"
                    value={field.value}
                    onChangeText={field.onChange}
                    borderColor={errors.first_name ? '$red8' : '$borderColor'}
                  />
                )}
              />
              {errors.first_name && (
                <Text color="$red10" fontSize="$2">
                  {errors.first_name.message}
                </Text>
              )}
            </YStack>

            <YStack gap="$2" flex={1}>
              <Text fontWeight="600">Last Name *</Text>
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Last name"
                    value={field.value}
                    onChangeText={field.onChange}
                    borderColor={errors.last_name ? '$red8' : '$borderColor'}
                  />
                )}
              />
              {errors.last_name && (
                <Text color="$red10" fontSize="$2">
                  {errors.last_name.message}
                </Text>
              )}
            </YStack>
          </XStack>

          {/* About Section */}
          <YStack gap="$2">
            <Text fontWeight="600">About</Text>
            <Controller
              name="about"
              control={control}
              render={({ field }) => (
                <TextArea
                  placeholder="Tell us about yourself..."
                  value={field.value || ''}
                  onChangeText={field.onChange}
                  minHeight={100}
                  borderColor={errors.about ? '$red8' : '$borderColor'}
                />
              )}
            />
            {errors.about && (
              <Text color="$red10" fontSize="$2">
                {errors.about.message}
              </Text>
            )}
          </YStack>

          {/* Contact Information */}
          <YStack gap="$2">
            <Text fontWeight="600">Phone</Text>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneNumberInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                  defaultCountry="US"
                  storeFormatted={true}
                />
              )}
            />
          </YStack>

          <YStack gap="$2">
            <Text fontWeight="600">Email (Read-only)</Text>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Email address"
                  value={field.value}
                  onChangeText={() => {}} // Make read-only
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                  opacity={0.7}
                  backgroundColor="$gray2"
                  borderColor="$gray6"
                />
              )}
            />
            <Text color="$gray10" fontSize="$2">
              Email changes must be made through account settings
            </Text>
          </YStack>

          {/* Save Button */}
          <XStack justifyContent="flex-end" paddingTop="$4">
            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              space={isLoading ? '$2' : 0}
            >
              <AnimatePresence>
                {isLoading && (
                  <Button.Icon>
                    <Spinner
                      animation="bouncy"
                      enterStyle={{
                        scale: 0,
                      }}
                      exitStyle={{
                        scale: 0,
                      }}
                    />
                  </Button.Icon>
                )}
              </AnimatePresence>
              <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
            </Button>
          </XStack>
        </YStack>
      </DashboardWidget>
    </ScrollView>
  )
}
