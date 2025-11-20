import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, TextArea, Spinner, AnimatePresence } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  generalProfileSchema,
  type GeneralProfileFormData,
  generalProfileDefaults,
} from '../config/general-schema'
import {
  UIButton as Button,
  PhoneNumberInput,
  AddressForm,
  DashboardWidget,
  AvatarImagePicker,
} from '@app/ui'
import { api } from '@app/core/utils/api'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'

interface GeneralProfileSectionProps {
  /**
   * User ID to edit. If not provided, edits the current user's profile.
   */
  userId?: string
  /**
   * Mode determines which tRPC endpoints to use
   * - 'user': Uses profile.* endpoints (current user)
   * - 'admin': Uses office.* endpoints (any user)
   */
  mode?: 'user' | 'admin'
  /**
   * Read-only mode (view only)
   */
  readOnly?: boolean
}

/**
 * Shared General Profile Section Component
 * Works in both user dashboard and admin office contexts
 */
export function GeneralProfileSection({
  userId,
  mode = 'user',
  readOnly = false,
}: GeneralProfileSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastController()

  const getErrorMessage = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      return value
    }
    if (value && typeof value === 'object' && 'message' in value) {
      const message = (value as { message?: unknown }).message
      return typeof message === 'string' ? message : undefined
    }
    return undefined
  }

  // Determine which tRPC endpoints to use based on mode
  const useQuery =
    mode === 'admin' && userId
      ? () => api.office.getUserGeneral.useQuery({ userId })
      : () => api.profile.getGeneral.useQuery()

  const useMutation =
    mode === 'admin' && userId
      ? () =>
          api.office.updateUserGeneral.useMutation({
            onSuccess: () => {
              toast.show('Profile Updated', {
                message: 'Profile has been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving profile:', error)
              const message =
                error instanceof Error ? error.message : 'Failed to save profile. Please try again.'
              toast.show('Error', {
                message,
              })
            },
          })
      : () =>
          api.profile.updateGeneral.useMutation({
            onSuccess: () => {
              toast.show('Profile Updated', {
                message: 'Your profile has been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving profile:', error)
              const message =
                error instanceof Error ? error.message : 'Failed to save profile. Please try again.'
              toast.show('Error', {
                message,
              })
            },
          })

  const { data: profileData, isLoading: isLoadingProfile, refetch } = useQuery()

  const updateProfileMutation = useMutation()

  const uploadAvatarMutation = api.profile.uploadAvatar.useMutation({
    onSuccess: (data: { avatarPath: string }) => {
      toast.show('Avatar Uploaded', {
        message: 'Avatar has been uploaded successfully!',
      })
      setValue('avatar_path', data.avatarPath)
      refetch()
    },
    onError: (error: unknown) => {
      console.error('Error uploading avatar:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.'
      toast.show('Upload Error', {
        message,
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
    mode: 'onChange',
  })

  const avatarPath = watch('avatar_path')

  // Reset form when profile data is loaded
  useEffect(() => {
    if (profileData) {
      reset(profileData)
    }
  }, [profileData, reset])

  const onSubmit = async (data: GeneralProfileFormData) => {
    if (readOnly) return

    setIsLoading(true)
    try {
      if (mode === 'admin' && userId) {
        await updateProfileMutation.mutateAsync({ userId, data })
      } else {
        await updateProfileMutation.mutateAsync(data)
      }
    } finally {
      setIsLoading(false)
    }
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
              if (readOnly) return

              if (imageUri) {
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
                setValue('avatar_path', '')
              }
            }}
            size={120}
            disabled={readOnly || uploadAvatarMutation.isPending}
            placeholder="Upload Avatar"
          />
          {uploadAvatarMutation.isPending && (
            <Text fontSize="$2" color="$color10">
              Uploading avatar...
            </Text>
          )}
        </YStack>

        {/* Name Fields */}
        <XStack gap="$3" $sm={{ flexDirection: 'column' }} $md={{ flexDirection: 'row' }}>
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
                  editable={!readOnly}
                  opacity={readOnly ? 0.7 : 1}
                />
              )}
            />
            {errors.first_name && (
              <Text color="$red10" fontSize="$2">
                {getErrorMessage(errors.first_name.message) ?? 'First name is required'}
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
                  editable={!readOnly}
                  opacity={readOnly ? 0.7 : 1}
                />
              )}
            />
            {errors.last_name && (
              <Text color="$red10" fontSize="$2">
                {getErrorMessage(errors.last_name.message) ?? 'Last name is required'}
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
                value={typeof field.value === 'string' ? field.value : ''}
                onChangeText={field.onChange}
                minH={100}
                borderColor={errors.about ? '$red8' : '$borderColor'}
                editable={!readOnly}
                opacity={readOnly ? 0.7 : 1}
              />
            )}
          />
          {errors.about && (
            <Text color="$red10" fontSize="$2">
              {getErrorMessage(errors.about.message) ?? 'Please provide a short bio'}
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
                error={getErrorMessage(errors.phone?.message)}
                defaultCountry="US"
                storeFormatted={true}
                disabled={readOnly}
              />
            )}
          />
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="600">Email {mode === 'user' ? '(Read-only)' : ''}</Text>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Email address"
                value={field.value}
                onChangeText={() => {}}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
                opacity={0.7}
                bg="$color2"
                borderColor="$color6"
              />
            )}
          />
          {mode === 'user' && (
            <Text color="$color10" fontSize="$2">
              Email changes must be made through account settings
            </Text>
          )}
        </YStack>

        {/* Home Address */}
        <YStack gap="$3">
          <Text fontWeight="600">Home Address</Text>
          <AddressForm
            mode="hybrid"
            placeholder="Search for home address..."
            error={
              getErrorMessage(errors.address?.street?.message) ??
              getErrorMessage(errors.address?.city?.message)
            }
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
              if (readOnly) return

              setValue('address.street', address.streetAddress || '')
              setValue('address.city', address.locality || '')
              setValue(
                'address.state',
                address.stateAbbreviation || address.administrativeAreaLevel1 || ''
              )
              setValue('address.zip', address.postalCode || '')
              setValue('address.country', address.country || 'United States')

              if (address.coordinates?.lat !== undefined) {
                setValue('address.latitude', address.coordinates.lat)
              }
              if (address.coordinates?.lng !== undefined) {
                setValue('address.longitude', address.coordinates.lng)
              }

              trigger('address.street')
              trigger('address.city')
              trigger('address.state')
              trigger('address.zip')
            }}
            disabled={readOnly}
          />
        </YStack>

        {/* Save Button */}
        {!readOnly && (
          <XStack justify="flex-end" pt="$4">
            <Button
              variant="primary"
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              space={isLoading ? '$2' : 0}
              $sm={{ height: 44 }}
            >
              <AnimatePresence>
                {isLoading && (
                  <Button.Icon>
                    <Spinner
                      animation="bouncy"
                      enterStyle={{ scale: 0 }}
                      exitStyle={{ scale: 0 }}
                    />
                  </Button.Icon>
                )}
              </AnimatePresence>
              <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
            </Button>
          </XStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
