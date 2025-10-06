import React, { useState, useEffect } from 'react'
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
import { PhoneNumberInput, AddressForm } from '@app/ui'
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
    trigger,
  } = useForm<GeneralProfileFormData>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: generalProfileDefaults,
    mode: 'onChange', // Real-time validation
  })

  const avatarPath = watch('avatar_path')

  // Reset form when profile data is loaded
  useEffect(() => {
    if (profileData) {
      reset(profileData)
    }
  }, [profileData, reset])

  // Debug: Log form state changes
  useEffect(() => {
    console.log('📊 Form state updated:', {
      isDirty,
      hasErrors: Object.keys(errors).length > 0,
      errorCount: Object.keys(errors).length,
      errors: errors,
    })
  }, [isDirty, errors])

  const onSubmit = async (data: GeneralProfileFormData) => {
    console.log('🟢 Form submission started')
    console.log('📋 Form data:', JSON.stringify(data, null, 2))
    console.log('✅ Form validation passed')

    setIsLoading(true)
    try {
      await updateProfileMutation.mutateAsync(data)
      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Profile update failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onError = (validationErrors: typeof errors) => {
    console.log('❌ Form validation failed')
    console.log('📋 Validation errors:', JSON.stringify(validationErrors, null, 2))
    console.log('📊 Form state:', {
      isDirty,
      isValid: Object.keys(validationErrors).length === 0,
      errorCount: Object.keys(validationErrors).length,
    })
  }

  if (isLoadingProfile) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text>Loading profile...</Text>
      </YStack>
    )
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        {/* Avatar Section */}
        <YStack gap="$3" items="center">
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
            <Text fontSize="$2" color="$color10">
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
                minH={100}
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
                bg="$color2"
                borderColor="$color6"
              />
            )}
          />
          <Text color="$color10" fontSize="$2">
            Email changes must be made through account settings
          </Text>
        </YStack>

        {/* Home Address with Smart Autocomplete */}
        <YStack gap="$3">
          <Text fontWeight="600">Home Address</Text>
          <AddressForm
            mode="hybrid"
            placeholder="Search for your home address..."
            error={errors.address?.street?.message || errors.address?.city?.message}
            provider="mapbox"
            apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
            addressValue={{
              streetAddress: watch('address.street') || '',
              locality: watch('address.city') || '',
              stateAbbreviation: watch('address.state') || '',
              postalCode: watch('address.zip') || '',
              country: watch('address.country') || '',
              formattedAddress: [
                watch('address.street'),
                watch('address.city'),
                watch('address.state'),
                watch('address.zip'),
              ]
                .filter(Boolean)
                .join(', '),
            }}
            onAddressSelect={(address) => {
              console.log('Selected address:', address)
              // Update form fields with selected address
              setValue('address.street', address.streetAddress || '')
              setValue('address.city', address.locality || '')
              setValue(
                'address.state',
                address.stateAbbreviation || address.administrativeAreaLevel1 || ''
              )
              setValue('address.zip', address.postalCode || '')
              setValue('address.country', address.country || 'United States')

              // Store latitude and longitude for map display
              if (address.coordinates?.lat !== undefined) {
                setValue('address.latitude', address.coordinates.lat)
              }
              if (address.coordinates?.lng !== undefined) {
                setValue('address.longitude', address.coordinates.lng)
              }

              // Trigger validation for updated fields
              trigger('address.street')
              trigger('address.city')
              trigger('address.state')
              trigger('address.zip')
            }}
          />
        </YStack>

        {/* Save Button */}
        <XStack justify="flex-end" pt="$4">
          <Button
            onPress={handleSubmit(onSubmit, onError)}
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
  )
}
