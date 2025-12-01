import { ROUTES } from '@app/core/constants/routes'
import { ResumeUploadButton, ResumeUploadModal } from '@app/core/features/resume'
import { ControlledAddressForm } from '@app/core/forms'
import { api } from '@app/core/utils/api'
import {
  CustomCheckbox,
  DashboardWidget,
  ResponsiveSelect,
  UIButton as StyledButton,
  spacing,
} from '@unicornlove/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable } from 'react-native'
import { Input, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import {
  type PrerequisitesFormData,
  prerequisitesDefaults,
  prerequisitesSchema,
  USER_TYPE_OPTIONS,
  type UserType,
} from './config/prerequisites-schema'

/**
 * PrerequisiteWidget - Dashboard widget for completing required profile prerequisites
 *
 * Displays required profile information form including:
 * - First and last name
 * - Home address
 * - User types (worker/employer/customer)
 * - Primary industry
 *
 * @returns JSX element
 */
export function PrerequisiteWidget() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToastController()
  const router = useRouter()
  const [resumeModalOpen, setResumeModalOpen] = useState(false)

  // Check prerequisites status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = api.prerequisites.check.useQuery()

  const { data: resumeStatus } = api.resume.hasUploaded.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

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
    mode: 'onChange',
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
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <ResumeUploadModal
          open={resumeModalOpen}
          onOpenChange={setResumeModalOpen}
          onUploadComplete={(resumeId) => {
            setResumeModalOpen(false)
            router.push({
              pathname: ROUTES.DASHBOARD.PROFILE.RESUME.REVIEW.path,
              params: { resumeId },
            })
          }}
        />
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Complete Your Profile
          </Text>
          <Text fontSize="$3" color="$color11">
            Please complete these required fields to continue using Scaffald
          </Text>
        </YStack>

        {isCheckingStatus ? (
          <YStack gap={spacing.sm} items="center" py={spacing['2xl']}>
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

            {!resumeStatus?.hasUploaded && (
              <>
                <YStack gap="$3">
                  <Text fontWeight="600">Optional: Import Your Resume</Text>
                  <Text fontSize="$2" color="$color11">
                    Upload your resume to automatically fill in experience, education, and skills.
                    You can skip this step and continue manually at any time.
                  </Text>
                  <ResumeUploadButton onPress={() => setResumeModalOpen(true)} size="$3" />
                </YStack>

                <Separator />
              </>
            )}

            {/* 2. Address */}
            <YStack gap="$3">
              <Text fontWeight="600">Address *</Text>
              <Text fontSize="$2" color="$color11" mb="$2">
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
                      <XStack key={option.value} gap="$3" items="center">
                        <CustomCheckbox
                          checked={field.value?.includes(option.value as UserType)}
                          onCheckedChange={(checked: boolean) => {
                            const currentTypes = field.value || []
                            if (checked) {
                              field.onChange([...currentTypes, option.value])
                            } else {
                              field.onChange(currentTypes.filter((t) => t !== option.value))
                            }
                          }}
                          size="medium"
                          testID={`checkbox-user-type-${option.value}`}
                          ariaLabelledBy={`checkbox-user-type-${option.value}-label`}
                        />
                        <Pressable
                          onPress={() => {
                            const currentTypes = field.value || []
                            const isChecked = currentTypes.includes(option.value as UserType)
                            if (isChecked) {
                              field.onChange(currentTypes.filter((t) => t !== option.value))
                            } else {
                              field.onChange([...currentTypes, option.value])
                            }
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
                      <XStack gap="$2" items="center">
                        <Spinner size="small" />
                        <Text color="$color11">Loading industries...</Text>
                      </XStack>
                    ) : (
                      <ResponsiveSelect
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Select your industry"
                        options={
                          industriesData?.industries.map(
                            (industry: { id: string; name: string }) => ({
                              value: industry.id,
                              label: industry.name,
                            })
                          ) || []
                        }
                      />
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
                    <XStack gap="$3" items="center">
                      <CustomCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        size="medium"
                        testID="checkbox-legal-privacy-policy"
                        ariaLabelledBy="checkbox-legal-privacy-policy-label"
                      />
                      <Pressable
                        onPress={() => field.onChange(!field.value)}
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
                    <XStack gap="$3" items="center">
                      <CustomCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        size="medium"
                        testID="checkbox-legal-terms-of-service"
                        ariaLabelledBy="checkbox-legal-terms-of-service-label"
                      />
                      <Pressable
                        onPress={() => field.onChange(!field.value)}
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
            <StyledButton
              variant="primary"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              opacity={isSubmitting ? 0.5 : 1}
              size="$5"
              mt={spacing.xs}
            >
              {isSubmitting ? (
                <XStack gap={spacing.xs} items="center">
                  <Spinner size="small" color="white" />
                  <StyledButton.Text>Completing...</StyledButton.Text>
                </XStack>
              ) : (
                <StyledButton.Text>Complete Profile</StyledButton.Text>
              )}
            </StyledButton>
          </>
        )}
      </YStack>
    </DashboardWidget>
  )
}
