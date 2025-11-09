import React, { useState, useEffect, useRef } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
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
import { ControlledAddressForm } from '@app/core/forms'
import { api } from '@app/core/utils/api'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import {
  DashboardWidget,
  AvatarImagePicker,
  RichTextEditor,
  plainTextToTipTap,
  ConfirmationDialog,
} from '@app/ui'
import type { JSONContent } from '@tiptap/core'
import { isValidPhoneNumber } from '@app/schemas/common/phone'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  startProfileSync,
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
} from './utils/profile-sync-store'

/**
 * Profile General Left Component
 * Form for editing general profile information
 */
export function ProfileGeneralLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const originalDataRef = useRef<GeneralProfileFormData | null>(null)
  const toast = useToastController()
  const utils = api.useContext()

  // Use tRPC to fetch and update profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
  } = api.profile.getGeneral.useQuery()
  const updateProfileMutation = api.profile.updateGeneral.useMutation({
    async onMutate(input) {
      resetProfileSyncError()
      startProfileSync()
      await utils.profile.getGeneral.cancel()
      const previousGeneral = utils.profile.getGeneral.getData()
      utils.profile.getGeneral.setData(undefined, (current) => ({
        ...(current ?? {}),
        ...input,
      }))
      return { previousGeneral }
    },
    onError: (error, _input, context) => {
      console.error('Error saving profile:', error)
      if (context?.previousGeneral) {
        utils.profile.getGeneral.setData(undefined, context.previousGeneral)
      }
      failProfileSync()
      toast.show('Error', {
        message: error instanceof Error ? error.message : 'Failed to save profile. Please try again.',
      })
    },
    onSuccess: () => {
      toast.show('Profile Updated', {
        message: 'Your profile has been saved successfully!',
      })
    },
    onSettled: (_data, error) => {
      if (!error) {
        completeProfileSync()
      }
      void invalidateProfileQueries(utils)
    },
  })

  const uploadAvatarMutation = api.profile.uploadAvatar.useMutation({
    onMutate: () => {
      resetProfileSyncError()
      startProfileSync()
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC response type
    onSuccess: async (data: any) => {
      toast.show('Avatar Uploaded', {
        message: 'Your avatar has been uploaded successfully!',
      })
      // Update the form with the new avatar path
      setValue('avatar_path', data.avatarPath)
      await invalidateProfileQueries(utils)
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      console.error('Error uploading avatar:', error)
      failProfileSync()
      toast.show('Upload Error', {
        message: error.message || 'Failed to upload avatar. Please try again.',
      })
    },
    onSettled: (_data, error) => {
      if (!error) {
        completeProfileSync()
      }
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
    setError,
    clearErrors,
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
      originalDataRef.current = profileData

      if (profileData.phone && !isValidPhoneNumber(profileData.phone)) {
        setError('phone', {
          type: 'manual',
          message: 'Your current phone number is invalid. Please enter a valid phone number.',
        })
      } else {
        clearErrors('phone')
      }

      void trigger('phone')
    }
  }, [profileData, reset, setError, clearErrors, trigger])

  const phoneValue = watch('phone')

  useEffect(() => {
    if (!phoneValue) {
      clearErrors('phone')
      return
    }

    if (isValidPhoneNumber(phoneValue)) {
      clearErrors('phone')
    }
  }, [phoneValue, clearErrors])

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
                  const [metadata] = imageUri.split(',')
                  const mimeMatch = metadata?.match(/^data:(image\/[a-zA-Z+]+);base64$/)
                  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

                  const extension = (() => {
                    if (contentType === 'image/png') return 'png'
                    if (contentType === 'image/webp') return 'webp'
                    return 'jpg'
                  })()

                  uploadAvatarMutation.mutate({
                    file: imageUri,
                    fileName: `avatar-${Date.now()}.${extension}`,
                    contentType,
                  })
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
            onCropError={(message) =>
              toast.show('Error', {
                message,
              })
            }
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

        {/* About Section - Rich Text Editor */}
        <YStack gap="$2">
          <Text fontWeight="600">About</Text>
          <Controller
            name="about"
            control={control}
            render={({ field }) => {
              // Convert plain text to TipTap JSON if needed
              const value =
                typeof field.value === 'string'
                  ? plainTextToTipTap(field.value)
                  : field.value
                    ? (field.value as JSONContent)
                    : null

              return (
                <RichTextEditor
                  value={value}
                  onChange={field.onChange}
                  fieldType="PROFILE_ABOUT"
                  showCharacterCount
                  minHeight={150}
                  error={errors.about?.message}
                />
              )
            }}
          />
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
        <ControlledAddressForm
          control={control}
          name="address"
          setValue={setValue}
          trigger={trigger}
          label="Home Address"
          placeholder="Search for your home address..."
          error={errors.address?.street?.message || errors.address?.city?.message}
        />

        {/* Action Buttons */}
        <XStack justify="flex-end" gap="$3" pt="$4">
          <Button
            variant="outlined"
            disabled={!isDirty}
            onPress={() => setShowCancelDialog(true)}
            opacity={!isDirty ? 0.5 : 1}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit(onSubmit, onError)}
            disabled={!isDirty || isLoading || Object.keys(errors).length > 0}
            opacity={!isDirty || isLoading || Object.keys(errors).length > 0 ? 0.5 : 1}
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

        {/* Cancel Confirmation Dialog */}
        <ConfirmationDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          title="Discard Changes?"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmLabel="Discard Changes"
          cancelLabel="Keep Editing"
          confirmTheme="red"
          onConfirm={() => {
            if (originalDataRef.current) {
              reset(originalDataRef.current)
              setShowCancelDialog(false)
            }
          }}
        />
      </YStack>
    </DashboardWidget>
  )
}
