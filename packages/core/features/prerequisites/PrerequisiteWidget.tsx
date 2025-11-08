import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Spinner,
  Select,
  Adapt,
  Sheet,
  Separator,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { DashboardWidget, CustomCheckbox, Button as StyledButton } from '@app/ui'
import { ControlledAddressForm } from '@app/core/forms'
import { api } from '@app/core/utils/api'
import { spacing } from '@/tokens/design-tokens'
import {
  prerequisitesSchema,
  prerequisitesDefaults,
  USER_TYPE_OPTIONS,
  type PrerequisitesFormData,
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

  // Check prerequisites status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = api.prerequisites.check.useQuery()

  // Fetch industries for dropdown
  const { data: industriesData, isLoading: isLoadingIndustries } =
    api.profile.getIndustries.useQuery()

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

  // Populate form with existing data when loaded
  useEffect(() => {
    if (statusData?.data) {
      const data = statusData.data
      reset({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        address: data.address || prerequisitesDefaults.address,
        user_types: data.user_types || [],
        industry_id: data.industry_id || '',
      })
    }
  }, [statusData, reset])

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
            <Spinner size="large" color="$teal7" />
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
                      <XStack
                        key={option.value}
                        gap="$3"
                        items="center"
                        pressStyle={{ opacity: 0.7 }}
                      >
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
                        />
                        <Text
                          flex={1}
                          onPress={() => {
                            const currentTypes = field.value || []
                            const isChecked = currentTypes.includes(option.value as UserType)
                            if (isChecked) {
                              field.onChange(currentTypes.filter((t) => t !== option.value))
                            } else {
                              field.onChange([...currentTypes, option.value])
                            }
                          }}
                        >
                          {option.label}
                        </Text>
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
                      <Select value={field.value} onValueChange={field.onChange} size="$4">
                        <Select.Trigger width="100%">
                          <Select.Value placeholder="Select your industry" />
                        </Select.Trigger>

                        <Adapt when="sm" platform="touch">
                          <Sheet
                            native
                            modal
                            dismissOnSnapToBottom
                            animationConfig={{
                              type: 'spring',
                              damping: 20,
                              mass: 1.2,
                              stiffness: 250,
                            }}
                          >
                            <Sheet.Frame>
                              <Sheet.ScrollView>
                                <Adapt.Contents />
                              </Sheet.ScrollView>
                            </Sheet.Frame>
                            <Sheet.Overlay
                              animation="lazy"
                              enterStyle={{ opacity: 0 }}
                              exitStyle={{ opacity: 0 }}
                            />
                          </Sheet>
                        </Adapt>

                        <Select.Content zIndex={200000}>
                          <Select.ScrollUpButton />
                          <Select.Viewport>
                            {industriesData?.industries.map(
                              (industry: { id: string; name: string }, index: number) => (
                                <Select.Item key={industry.id} value={industry.id} index={index}>
                                  <Select.ItemText>{industry.name}</Select.ItemText>
                                </Select.Item>
                              )
                            )}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                        </Select.Content>
                      </Select>
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
                    <XStack gap="$3" items="center" pressStyle={{ opacity: 0.7 }}>
                      <CustomCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        size="medium"
                      />
                      <Text flex={1} onPress={() => field.onChange(!field.value)}>
                        I accept the{' '}
                        <Text
                          color="$teal7"
                          textDecorationLine="underline"
                          onPress={(e) => {
                            e.stopPropagation()
                            if (typeof window !== 'undefined') {
                              window.open('https://scaffald.com/privacy', '_blank')
                            }
                          }}
                        >
                          Privacy Policy
                        </Text>
                      </Text>
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
                    <XStack gap="$3" items="center" pressStyle={{ opacity: 0.7 }}>
                      <CustomCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        size="medium"
                      />
                      <Text flex={1} onPress={() => field.onChange(!field.value)}>
                        I accept the{' '}
                        <Text
                          color="$teal7"
                          textDecorationLine="underline"
                          onPress={(e) => {
                            e.stopPropagation()
                            if (typeof window !== 'undefined') {
                              window.open('https://scaffald.com/terms', '_blank')
                            }
                          }}
                        >
                          Terms of Service
                        </Text>
                      </Text>
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
                  <Button.Text>Completing...</Button.Text>
                </XStack>
              ) : (
                <Button.Text>Complete Profile</Button.Text>
              )}
            </StyledButton>
          </>
        )}
      </YStack>
    </DashboardWidget>
  )
}
