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
  H4,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { ResponsiveModal, FullscreenSpinner } from '@app/ui'
import { CustomCheckbox } from '@app/ui'
import { ControlledAddressForm } from '@app/core/forms'
import { api } from '@app/core/utils/api'
import {
  prerequisitesSchema,
  prerequisitesDefaults,
  USER_TYPE_OPTIONS,
  type PrerequisitesFormData,
  type UserType,
} from './config/prerequisites-schema'

/**
 * Prerequisites Modal
 *
 * Non-dismissible modal that ensures users complete required profile information:
 * 1. First and last name
 * 2. Home address
 * 3. User types (worker/employer/customer)
 * 4. Primary industry
 *
 * Modal only appears when prerequisites are incomplete and cannot be dismissed
 * until all required fields are filled.
 */
export function PrerequisitesModal() {
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

  // Don't render anything while loading or if prerequisites are complete
  // This prevents blocking the UI with a fullscreen spinner
  if (isCheckingStatus || statusData?.isComplete) {
    return null
  }

  return (
    <ResponsiveModal
      open={!statusData?.isComplete}
      onOpenChange={() => {}} // Non-dismissible
      title="Complete Your Profile"
      showCloseButton={false}
      size="medium"
      dialogWidth={700}
      dialogHeight={800}
    >
      <YStack gap="$4">
        <Text fontSize="$3" color="$color11">
          Please complete these required fields to continue
        </Text>

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
          <Text fontWeight="600">Address:</Text>
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
          <Text fontWeight="600">I am a (select all that apply):</Text>
          <Controller
            name="user_types"
            control={control}
            render={({ field }) => (
              <YStack gap="$2">
                {USER_TYPE_OPTIONS.map((option) => (
                  <XStack key={option.value} gap="$3" items="center" pressStyle={{ opacity: 0.7 }}>
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

        {/* Submit Button */}
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          opacity={isSubmitting ? 0.5 : 1}
          size="$5"
          themeInverse
        >
          {isSubmitting ? (
            <XStack gap="$2" items="center">
              <Spinner size="small" color="$color12" />
              <Button.Text>Completing...</Button.Text>
            </XStack>
          ) : (
            <Button.Text>Complete Profile</Button.Text>
          )}
        </Button>
      </YStack>
    </ResponsiveModal>
  )
}
