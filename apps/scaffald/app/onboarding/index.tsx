import { ROUTES } from '@scf/core/constants/routes'
import { ControlledAddressForm } from '@scf/core/forms'
import { usePrerequisites, useCompletePrerequisites, useIndustries } from '@scaffald/sdk/react'
import {
  Button,
  Checkbox,
  ResponsiveSelect,
  spacing,
  Input,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useToast,
} from '@unicornlove/beyond-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, ScrollView } from 'react-native'
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
  const toast = useToast()
  const router = useRouter()

  // Check prerequisites status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = usePrerequisites()

  // Fetch industries for dropdown
  const { data: industriesData, isLoading: isLoadingIndustries } = useIndustries()

  // Complete prerequisites mutation
  const completeMutation = useCompletePrerequisites({
    onSuccess: () => {
      toast.show({
        title: 'Profile Complete',
        message: 'Your profile has been set up successfully!',
        variant: 'success',
      })
      refetchStatus()
      // Redirect to dashboard immediately after completion
      router.replace(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      console.error('Error completing prerequisites:', error)
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save profile. Please try again.',
        variant: 'error',
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
      <Stack
       
        justify="center"
        align="center"
        padding={16}
        paddingVertical={32}
        minHeight="100vh"
      >
        <Stack
          maxWidth={600}
          width="100%"
          gap={spacing.md}
          backgroundColor="$background"
          padding={24}
          borderRadius={16}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Stack gap={spacing.xs}>
            <Text color="$color12">
              Complete Your Profile
            </Text>
            <Text color="$color11">
              Please complete these required fields to continue using Scaffald
            </Text>
          </Stack>

          {isCheckingStatus ? (
            <Stack gap={spacing.sm} align="center" paddingVertical={spacing['2xl']}>
              <Spinner size="lg" color="$blue7" />
              <Text color="$color11">Loading...</Text>
            </Stack>
          ) : (
            <>
              {/* 1. Name Fields */}
              <Stack gap={12}>
                <Row gap={12}>
                  <Stack gap={8}>
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
                        />
                      )}
                    />
                    {errors.first_name && (
                      <Text color="$red10">
                        {errors.first_name.message}
                      </Text>
                    )}
                  </Stack>

                  <Stack gap={8}>
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
                        />
                      )}
                    />
                    {errors.last_name && (
                      <Text color="$red10">
                        {errors.last_name.message}
                      </Text>
                    )}
                  </Stack>
                </Row>
              </Stack>

              <Separator />

              {/* 2. Address */}
              <Stack gap={12}>
                <Text>Address *</Text>
                <Text color="$color11">
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
                  <Text color="$red10">
                    {errors.address.street?.message ||
                      errors.address.city?.message ||
                      errors.address.state?.message ||
                      errors.address.zip?.message}
                  </Text>
                )}
              </Stack>

              <Separator />

              {/* 3. User Types */}
              <Stack gap={12}>
                <Text>I am a (select all that apply) *</Text>
                <Controller
                  name="user_types"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={8}>
                      {USER_TYPE_OPTIONS.map((option) => (
                        <Row key={option.value} gap={12} align="center">
                          <Checkbox
                            checked={field.value?.includes(option.value as UserType)}
                            onChange={(checked: boolean) => {
                              const currentTypes = field.value || []
                              const newValue = checked
                                ? [...currentTypes, option.value]
                                : currentTypes.filter((t) => t !== option.value)
                              // Use setValue with shouldValidate: false to prevent form-wide validation
                              setValue('user_types', newValue, { shouldValidate: false })
                            }}
                            size="md"
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
                        </Row>
                      ))}
                    </Stack>
                  )}
                />
                {errors.user_types && (
                  <Text color="$red10">
                    {errors.user_types.message}
                  </Text>
                )}
              </Stack>

              <Separator />

              {/* 4. Primary Industry */}
              <Stack gap={12}>
                <Text>Primary Industry *</Text>
                <Controller
                  name="industry_id"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={8}>
                      {isLoadingIndustries ? (
                        <Row gap={8} align="center">
                          <Spinner size="sm" />
                          <Text color="$color11">Loading industries...</Text>
                        </Row>
                      ) : industriesData?.data && industriesData.data.length > 0 ? (
                        <ResponsiveSelect
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder="Select your industry"
                          options={industriesData.data.map(
                            (industry: { id: string; name: string }) => ({
                              value: industry.id,
                              label: industry.name,
                            })
                          )}
                        />
                      ) : (
                        <Text color="$color11">
                          No industries available
                        </Text>
                      )}
                    </Stack>
                  )}
                />
                {errors.industry_id && (
                  <Text color="$red10">
                    {errors.industry_id.message}
                  </Text>
                )}
              </Stack>

              <Separator />

              {/* 5. Legal Agreements */}
              <Stack gap={12}>
                <Text>Legal Agreements *</Text>

                {/* Privacy Policy */}
                <Controller
                  name="accepts_privacy_policy"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={8}>
                      <Row gap={12} align="center">
                        <Checkbox
                          checked={field.value}
                          onChange={(checked) => {
                            // Use setValue with shouldValidate: false to prevent form-wide validation
                            setValue('accepts_privacy_policy', checked, { shouldValidate: false })
                          }}
                          size="md"
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
                      </Row>
                      {errors.accepts_privacy_policy && (
                        <Text color="$red10">
                          {errors.accepts_privacy_policy.message}
                        </Text>
                      )}
                    </Stack>
                  )}
                />

                {/* Terms of Service */}
                <Controller
                  name="accepts_terms_of_service"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={8}>
                      <Row gap={12} align="center">
                        <Checkbox
                          checked={field.value}
                          onChange={(checked) => {
                            // Use setValue with shouldValidate: false to prevent form-wide validation
                            setValue('accepts_terms_of_service', checked, { shouldValidate: false })
                          }}
                          size="md"
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
                      </Row>
                      {errors.accepts_terms_of_service && (
                        <Text color="$red10">
                          {errors.accepts_terms_of_service.message}
                        </Text>
                      )}
                    </Stack>
                  )}
                />
              </Stack>

              {/* Submit Button */}
              <Button
                variant="filled"
                color="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                loading={isSubmitting}
                size="lg"
                style={{ marginTop: spacing.xs }}
              >
                {isSubmitting ? 'Completing...' : 'Complete Profile'}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </ScrollView>
  )
}
