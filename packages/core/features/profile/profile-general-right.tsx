import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Button, Input, TextArea, Avatar, H4 } from 'tamagui'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { generalProfileSchema, type GeneralProfileFormData, generalProfileDefaults } from './config'
import { api } from '@app/core/utils/api'

/**
 * Profile General Right Component
 * Form for editing general profile information
 */
export function ProfileGeneralRight() {
  const [isLoading, setIsLoading] = useState(false)

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = api.profile.getGeneral.useQuery()

  // Update profile mutation
  const updateProfile = api.profile.updateGeneral.useMutation({
    onSuccess: () => {
      console.log('Profile updated successfully')
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
  } = useForm<GeneralProfileFormData>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: generalProfileDefaults,
    mode: 'onChange', // Real-time validation
  })

  const avatarUrl = watch('avatar_url')

  // Load profile data when it's available
  useEffect(() => {
    if (profileData) {
      reset(profileData)
    }
  }, [profileData, reset])

  const onSubmit = async (data: GeneralProfileFormData) => {
    setIsLoading(true)
    try {
      await updateProfile.mutateAsync(data)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <YStack space="$4" padding="$4" flex={1} justifyContent="center" alignItems="center">
        <Text>Loading profile...</Text>
      </YStack>
    )
  }

  return (
    <YStack space="$4" padding="$4" flex={1}>
      <H4>Edit General Information</H4>

      <YStack space="$4" tag="form">
        {/* Avatar Section */}
        <YStack space="$3">
          <Text fontWeight="600">Profile Photo</Text>
          <XStack space="$3" alignItems="center">
            <Avatar circular size="$8">
              <Avatar.Image src={avatarUrl || undefined} />
              <Avatar.Fallback backgroundColor="$gray5" />
            </Avatar>
            <YStack space="$2" flex={1}>
              <Controller
                name="avatar_url"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Profile photo URL"
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    borderColor={errors.avatar_url ? '$red8' : '$borderColor'}
                  />
                )}
              />
              {errors.avatar_url && (
                <Text color="$red10" fontSize="$2">
                  {errors.avatar_url.message}
                </Text>
              )}
            </YStack>
          </XStack>
        </YStack>

        {/* Name Fields */}
        <XStack space="$3">
          <YStack space="$2" flex={1}>
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

          <YStack space="$2" flex={1}>
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
        <YStack space="$2">
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
        <YStack space="$2">
          <Text fontWeight="600">Phone</Text>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Phone number"
                value={field.value || ''}
                onChangeText={field.onChange}
                keyboardType="phone-pad"
                borderColor={errors.phone ? '$red8' : '$borderColor'}
              />
            )}
          />
          {errors.phone && (
            <Text color="$red10" fontSize="$2">
              {errors.phone.message}
            </Text>
          )}
        </YStack>

        <YStack space="$2">
          <Text fontWeight="600">Email *</Text>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Email address"
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                borderColor={errors.email ? '$red8' : '$borderColor'}
              />
            )}
          />
          {errors.email && (
            <Text color="$red10" fontSize="$2">
              {errors.email.message}
            </Text>
          )}
        </YStack>

        {/* Save Button */}
        <XStack justifyContent="flex-end" paddingTop="$4">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
