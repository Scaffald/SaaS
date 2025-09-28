import { useState, useEffect } from 'react'
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
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { generalProfileSchema, type GeneralProfileFormData, generalProfileDefaults } from './config'
import { supabase } from '@app/core/utils/supabase/client'
import { useUser } from '@app/core/utils/useUser'

/**
 * Profile General Right Component
 * Form for editing general profile information
 */
export function ProfileGeneralRight() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const user = useUser()
  const toast = useToastController()

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

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.user?.id) return

      try {
        setIsLoadingProfile(true)

        // Get auth user data for email
        const { data: authUser } = await supabase.auth.getUser()

        // Get profile data from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
        }

        // Get additional data from user_private table
        const { data: privateData, error: privateError } = await supabase
          .from('user_private')
          .select('phone, about')
          .eq('user_id', user.user.id)
          .single()

        if (privateError && privateError.code !== 'PGRST116') {
          console.error('Error fetching private data:', privateError)
        }

        // Reset form with loaded data
        const profileData = {
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || '',
          email: authUser.user?.email || '',
          phone: privateData?.phone || '',
          about: privateData?.about || '',
        }

        reset(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfileData()
  }, [user?.user?.id, reset])

  const onSubmit = async (data: GeneralProfileFormData) => {
    if (!user?.user?.id) return

    setIsLoading(true)
    try {
      // Update profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`)
      }

      // Update user_private table - use update instead of upsert to avoid RLS issues
      const { error: privateError } = await supabase
        .from('user_private')
        .update({
          phone: data.phone,
          about: data.about,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.user.id)

      if (privateError) {
        throw new Error(`Failed to update private data: ${privateError.message}`)
      }

      // Show success toast
      toast.show('Profile Updated', {
        message: 'Your profile has been saved successfully!',
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      // Show error toast
      toast.show('Error', {
        message: 'Failed to save profile. Please try again.',
      })
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
    </YStack>
  )
}
