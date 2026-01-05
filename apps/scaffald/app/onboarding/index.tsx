import { ROUTES } from '@scf/core/constants/routes'
import { ControlledAddressForm } from '@scf/core/forms'
import { api } from '@scf/core/utils/api'
import { Button, CustomCheckbox, ResponsiveSelect, spacing } from '@unicornlove/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, ScrollView } from 'react-native'
import { Input, Separator, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
import {
  type PrerequisitesFormData,
  prerequisitesDefaults,
  prerequisitesSchema,
  USER_TYPE_OPTIONS,
  type UserType,
} from '@scf/core/features/prerequisites/config/prerequisites-schema'

/**
 * OnboardingPage - Full-page prerequisite completion experience
 *
 * Displays required profile information form including:
 * - First and last name
 * - Home address
 * - User types (worker/employer/customer)
 * - Primary industry
 * - Legal agreements
 *
 * @returns JSX element
 */
export default function OnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToastController()
  const router = useRouter()

  // Check prerequisites status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = api.prerequisites.check.useQuery()

  // Fetch industries for dropdown
  const { data: industriesData, isLoading: isLoadingIndustries } =
    api.profile.skillsMultiTaxonomy.getIndustries.useQuery()

  // Complete prerequisites mutation
  const completeMutation = api.prerequisites.complete.useMutation({
    onSuccess: () => {
      toast.show('Profile Complete', {
        message: 'Your profile has been set up successfully!',
      })
      refetchStatus()
      // Redirect to dashboard immediately after completion
      router.replace(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      console.error('Error completing prerequisites:', error)
      toast.show('Error', {
        message: error.message || 'Failed to save profile. Please try again.',
      })
    },
  })

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    reset,
  } = useForm<PrerequisitesFormData>({
    resolver: zodResolver(prerequisitesSchema),
    defaultValues: prerequisitesDefaults,
    mode: 'onSubmit', // Validate on submit instead of onChange to prevent premature validation errors
  })

  const previousPrefillHashRef = useRef<string | null>(null)

  // Populate form with existing data when loaded
  useEffect(() => {
    if (!statusData?.data) {
      return
    }

    const prefillData: PrerequisitesFormData = {
      first_name: statusData.data.first_name ?? '',
      last_name: statusData.data.last_name ?? '',
      address: {
        street: statusData.data.address?.street ?? prerequisitesDefaults.address.street,
        city: statusData.data.address?.city ?? prerequisitesDefaults.address.city,
        state: statusData.data.address?.state ?? prerequisitesDefaults.address.state,
        zip: statusData.data.address?.zip ?? prerequisitesDefaults.address.zip,
        country: statusData.data.address?.country ?? prerequisitesDefaults.address.country,
        latitude: statusData.data.address?.latitude,
        longitude: statusData.data.address?.longitude,
      },
      user_types: statusData.data.user_types ?? [],
      industry_id: statusData.data.industry_id ?? '',
      accepts_privacy_policy:
        (statusData.data as unknown as { accepts_privacy_policy?: boolean })
          .accepts_privacy_policy ?? false,
      accepts_terms_of_service:
        (statusData.data as unknown as { accepts_terms_of_service?: boolean })
          .accepts_terms_of_service ?? false,
    }

    const prefillHash = JSON.stringify(prefillData)

    if (previousPrefillHashRef.current === prefillHash) {
      return
    }

    previousPrefillHashRef.current = prefillHash
    reset(prefillData)
  }, [reset, statusData?.data])

  // Handle form submission
  const onSubmit = async (data: PrerequisitesFormData) => {
    setIsSubmitting(true)
    try {
      await completeMutation.mutateAsync(data)
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView>
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$4"
        paddingVertical="$8"
        minHeight="100vh"
      >
        <YStack
          maxWidth={600}
          width="100%"
          gap={spacing.md}
          backgroundColor="$background"
          padding="$6"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <YStack gap={spacing.xs}>
            <Text fontSize="$8" fontWeight="bold" color="$color12">
              Complete Your Profile
            </Text>
            <Text fontSize="$4" color="$color11">
              Please complete these required fields to continue using Scaffald
            </Text>
          </YStack>

          {isCheckingStatus ? (
            <YStack gap={spacing.sm} alignItems="center" paddingVertical={spacing['2xl']}>
              <Spinner size="large" color="$blue7" />
              <Text color="$color11">Loading...</Text>
            </YStack>
          ) : (
            <>
              {/* 1. Name Fields */}
              <YStack gap="$3">
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
              </YStack>

              <Separator />

              {/* 2. Address */}
              <YStack gap="$3">
                <Text fontWeight="600">Address *</Text>
                <Text fontSize="$2" color="$color11" marginBottom="$2">
                  Search and select your home address
                </Text>
                <ControlledAddressForm
                  control={control}
                  name="address"
                  setValue={setValue}
                  trigger={trigger}
                  placeholder="Search for your address..."
                  error={errors.address?.street?.message || errors.address?.city?.message}
                />
                {errors.address && (
                  <Text color="$red10" fontSize="$2">
                    {errors.address.street?.message ||
                      errors.address.city?.message ||
                      errors.address.state?.message ||
                      errors.address.zip?.message}
                  </Text>
                )}
              </YStack>

              <Separator />

              {/* 3. User Types */}
              <YStack gap="$3">
                <Text fontWeight="600">I am a (select all that apply) *</Text>
                <Controller
                  name="user_types"
                  control={control}
                  render={({ field }) => (
                    <YStack gap="$2">
                      {USER_TYPE_OPTIONS.map((option) => (
                        <XStack key={option.value} gap="$3" alignItems="center">
                          <CustomCheckbox
                            checked={field.value?.includes(option.value as UserType)}
                            onCheckedChange={(checked: boolean) => {
                              const currentTypes = field.value || []
                              const newValue = checked
                                ? [...currentTypes, option.value]
                                : currentTypes.filter((t) => t !== option.value)
                              // Use setValue with shouldValidate: false to prevent form-wide validation
                              setValue('user_types', newValue, { shouldValidate: false })
                            }}
                            size="medium"
                            testID={`checkbox-user-type-${option.value}`}
                            ariaLabelledBy={`checkbox-user-type-${option.value}-label`}
                          />
                          <Pressable
                            onPress={() => {
                              const currentTypes = field.value || []
                              const isChecked = currentTypes.includes(option.value as UserType)
                              const newValue = isChecked
                                ? currentTypes.filter((t) => t !== option.value)
                                : [...currentTypes, option.value]
                              // Use setValue with shouldValidate: false to prevent form-wide validation
                              setValue('user_types', newValue, { shouldValidate: false })
                            }}
                            accessibilityRole="button"
                            style={({ pressed }) => ({
                              flexShrink: 1,
                              opacity: pressed ? 0.7 : 1,
                              alignSelf: 'flex-start',
                            })}
                          >
                            <Text nativeID={`checkbox-user-type-${option.value}-label`}>
                              {option.label}
                            </Text>
                          </Pressable>
                        </XStack>
                      ))}
                    </YStack>
                  )}
                />
                {errors.user_types && (
                  <Text color="$red10" fontSize="$2">
                    {errors.user_types.message}
                  </Text>
                )}
              </YStack>

              <Separator />

              {/* 4. Primary Industry */}
              <YStack gap="$3">
                <Text fontWeight="600">Primary Industry *</Text>
                <Controller
                  name="industry_id"
                  control={control}
                  render={({ field }) => (
                    <YStack gap="$2">
                      {isLoadingIndustries ? (
                        <XStack gap="$2" alignItems="center">
                          <Spinner size="small" />
                          <Text color="$color11">Loading industries...</Text>
                        </XStack>
                      ) : industriesData?.industries && industriesData.industries.length > 0 ? (
                        <ResponsiveSelect
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder="Select your industry"
                          options={industriesData.industries.map(
                            (industry: { id: string; name: string }) => ({
                              value: industry.id,
                              label: industry.name,
                            })
                          )}
                        />
                      ) : (
                        <Text color="$color11" fontSize="$2">
                          No industries available
                        </Text>
                      )}
                    </YStack>
                  )}
                />
                {errors.industry_id && (
                  <Text color="$red10" fontSize="$2">
                    {errors.industry_id.message}
                  </Text>
                )}
              </YStack>

              <Separator />

              {/* 5. Legal Agreements */}
              <YStack gap="$3">
                <Text fontWeight="600">Legal Agreements *</Text>

                {/* Privacy Policy */}
                <Controller
                  name="accepts_privacy_policy"
                  control={control}
                  render={({ field }) => (
                    <YStack gap="$2">
                      <XStack gap="$3" alignItems="center">
                        <CustomCheckbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Use setValue with shouldValidate: false to prevent form-wide validation
                            setValue('accepts_privacy_policy', checked, { shouldValidate: false })
                          }}
                          size="medium"
                          testID="checkbox-legal-privacy-policy"
                          ariaLabelledBy="checkbox-legal-privacy-policy-label"
                        />
                        <Pressable
                          onPress={() => {
                            // Use setValue with shouldValidate: false to prevent form-wide validation
                            setValue('accepts_privacy_policy', !field.value, { shouldValidate: false })
                          }}
                          accessibilityRole="button"
                          style={({ pressed }) => ({
                            alignSelf: 'flex-start',
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text nativeID="checkbox-legal-privacy-policy-label">
                            I accept the{' '}
                            <Text
                              color="$blue7"
                              textDecorationLine="underline"
                              onPress={(event) => {
                                event.stopPropagation?.()
                                if (typeof window !== 'undefined') {
                                  window.open('https://scaffald.com/privacy', '_blank')
                                }
                              }}
                            >
                              Privacy Policy
                            </Text>
                          </Text>
                        </Pressable>
                      </XStack>
                      {errors.accepts_privacy_policy && (
                        <Text color="$red10" fontSize="$2">
                          {errors.accepts_privacy_policy.message}
                        </Text>
                      )}
                    </YStack>
                  )}
                />

                {/* Terms of Service */}
                <Controller
                  name="accepts_terms_of_service"
                  control={control}
                  render={({ field }) => (
                    <YStack gap="$2">
                      <XStack gap="$3" alignItems="center">
                        <CustomCheckbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Use setValue with shouldValidate: false to prevent form-wide validation
                            setValue('accepts_terms_of_service', checked, { shouldValidate: false })
                          }}
                          size="medium"
                          testID="checkbox-legal-terms-of-service"
                          ariaLabelledBy="checkbox-legal-terms-of-service-label"
                        />
                        <Pressable
                          onPress={() => {
                            // Use setValue with shouldValidate: false to prevent form-wide validation
                            setValue('accepts_terms_of_service', !field.value, { shouldValidate: false })
                          }}
                          accessibilityRole="button"
                          style={({ pressed }) => ({
                            alignSelf: 'flex-start',
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text nativeID="checkbox-legal-terms-of-service-label">
                            I accept the{' '}
                            <Text
                              color="$blue7"
                              textDecorationLine="underline"
                              onPress={(event) => {
                                event.stopPropagation?.()
                                if (typeof window !== 'undefined') {
                                  window.open('https://scaffald.com/terms', '_blank')
                                }
                              }}
                            >
                              Terms of Service
                            </Text>
                          </Text>
                        </Pressable>
                      </XStack>
                      {errors.accepts_terms_of_service && (
                        <Text color="$red10" fontSize="$2">
                          {errors.accepts_terms_of_service.message}
                        </Text>
                      )}
                    </YStack>
                  )}
                />
              </YStack>

              {/* Submit Button */}
              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                opacity={isSubmitting ? 0.5 : 1}
                size="$5"
                marginTop={spacing.xs}
              >
                {isSubmitting ? (
                  <XStack gap={spacing.xs} alignItems="center">
                    <Spinner size="small" color="white" />
                    <Button.Text>Completing...</Button.Text>
                  </XStack>
                ) : (
                  <Button.Text>Complete Profile</Button.Text>
                )}
              </Button>
            </>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  )
}
