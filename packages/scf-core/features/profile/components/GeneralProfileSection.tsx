import { api } from '@scf/core/utils/api'
import {
  useGeneralInfo,
  useUpdateGeneralInfoMutation,
  useUploadAvatarMutation,
} from '@scf/core/utils/profile-general-sdk-hooks'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import {
  AddressForm,
  AvatarImagePicker,
  Button,
  DashboardWidget,
  PhoneNumberInput,
} from '@scaffald/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@scaffald/ui'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AnimatePresence, Input, Spinner, Text, TextArea, Row, Stack } from '@scaffald/ui'
import {
  type GeneralProfileFormData,
  generalProfileDefaults,
  generalProfileSchema,
} from '../config/general-schema'

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
  const toast = useToast()

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

  // Determine which endpoints to use based on mode
  // Admin mode uses tRPC (api.office.*), user mode uses SDK
  const useQuery =
    mode === 'admin' && userId
      ? () => api.office.getUserGeneral.useQuery({ userId })
      : () => useGeneralInfo()

  const useMutation =
    mode === 'admin' && userId
      ? () =>
          api.office.updateUserGeneral.useMutation({
            onSuccess: () => {
              toast.show({
                title: 'Profile Updated',
                message: 'Profile has been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving profile:', error)
              const _message =
                error instanceof Error ? error.message : 'Failed to save profile. Please try again.'
              toast.show({
                title: 'Error',
                variant: 'error',
              })
            },
          })
      : () =>
          useUpdateGeneralInfoMutation({
            onSuccess: () => {
              toast.show({
                title: 'Profile Updated',
                message: 'Your profile has been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving profile:', error)
              const _message =
                error instanceof Error ? error.message : 'Failed to save profile. Please try again.'
              toast.show({
                title: 'Error',
                variant: 'error',
              })
            },
          })

  const { data: profileData, isLoading: isLoadingProfile, refetch } = useQuery()

  const updateProfileMutation = useMutation()

  const uploadAvatarMutation = useUploadAvatarMutation({
    onSuccess: (data: { avatarPath: string }) => {
      toast.show({
        title: 'Avatar Uploaded',
        message: 'Avatar has been uploaded successfully!',
      })
      setValue('avatar_path', data.avatarPath)
      refetch()
    },
    onError: (error: unknown) => {
      console.error('Error uploading avatar:', error)
      const _message =
        error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.'
      toast.show({
        title: 'Upload Error',
        variant: 'error',
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
        // Form data is compatible with API schema but has slightly different structure
        await updateProfileMutation.mutateAsync({
          userId,
          data: data as unknown as Parameters<typeof updateProfileMutation.mutateAsync>[0]['data'],
        })
      } else {
        // Form data is compatible with API schema but has slightly different structure
        await updateProfileMutation.mutateAsync(
          data as unknown as Parameters<typeof updateProfileMutation.mutateAsync>[0]
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <Stack gap={16} padding="md" flex={1} justify="center" align="center">
        <Spinner size="lg" />
        <Text>Loading profile...</Text>
      </Stack>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={16}>
        {/* Avatar Section */}
        <Stack gap={12} align="center">
          <Text>Profile Photo</Text>
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
                  toast.show({
                    title: 'Error',
                    message: 'Failed to process image. Please try again.',
                    variant: 'error',
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
          {uploadAvatarMutation.isPending && <Text color="$gray11">Uploading avatar...</Text>}
        </Stack>

        {/* Name Fields */}
        <Row gap={12}>
          <Stack gap={8} flex={1}>
            <Text>First Name *</Text>
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
              <Text color="$red10">
                {getErrorMessage(errors.first_name.message) ?? 'First name is required'}
              </Text>
            )}
          </Stack>

          <Stack gap={8} flex={1}>
            <Text>Last Name *</Text>
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
              <Text color="$red10">
                {getErrorMessage(errors.last_name.message) ?? 'Last name is required'}
              </Text>
            )}
          </Stack>
        </Row>

        {/* About Section */}
        <Stack gap={8}>
          <Text>About</Text>
          <Controller
            name="about"
            control={control}
            render={({ field }) => (
              <TextArea
                placeholder="Tell us about yourself..."
                value={typeof field.value === 'string' ? field.value : ''}
                onChangeText={field.onChange}
                minHeight={100}
                borderColor={errors.about ? '$red8' : '$borderColor'}
                editable={!readOnly}
                opacity={readOnly ? 0.7 : 1}
              />
            )}
          />
          {errors.about && (
            <Text color="$red10">
              {getErrorMessage(errors.about.message) ?? 'Please provide a short bio'}
            </Text>
          )}
        </Stack>

        {/* Contact Information */}
        <Stack gap={8}>
          <Text>Phone</Text>
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
        </Stack>

        <Stack gap={8}>
          <Text>Email {mode === 'user' ? '(Read-only)' : ''}</Text>
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
                backgroundColor="$color2"
                borderColor="$color6"
              />
            )}
          />
          {mode === 'user' && (
            <Text color="$gray11">Email changes must be made through account settings</Text>
          )}
        </Stack>

        {/* Home Address */}
        <Stack gap={12}>
          <Text>Home Address</Text>
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
        </Stack>

        {/* Save Button */}
        {!readOnly && (
          <Row justify="flex-end" paddingTop={16}>
            <Button
              variant="filled" color="primary"
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
                      enterStyle={{ scale: 0 }}
                      exitStyle={{ scale: 0 }}
                    />
                  </Button.Icon>
                )}
              </AnimatePresence>
              <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
            </Button>
          </Row>
        )}
      </Stack>
    </DashboardWidget>
  )
}
