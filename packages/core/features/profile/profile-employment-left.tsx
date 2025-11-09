import React, { useState, useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  Spinner,
  AnimatePresence,
  Slider,
  Checkbox,
  Label,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  api,
  type EmploymentProfileFormData,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from '@app/core/utils/api'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  startProfileSync,
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
} from './utils/profile-sync-store'
import { DashboardWidget, LocationListInput, ToggleCard, ConfirmationDialog } from '@app/ui'
import {
  Flag,
  MapPin,
  Plane,
  DollarSign,
  Car,
  Shield,
  Calendar,
  Check,
} from '@tamagui/lucide-icons'

/**
 * Profile Employment Left Component
 * Form for editing employment preferences
 */
export function ProfileEmploymentLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const originalDataRef = useRef<EmploymentProfileFormData | null>(null)
  const toast = useToastController()
  const utils = api.useContext()

  // Use tRPC to fetch and update employment data
  const {
    data: employmentData,
    isLoading: isLoadingEmployment,
  } = api.profile.getEmployment.useQuery()
  const updateEmploymentMutation = api.profile.updateEmployment.useMutation({
    async onMutate(input) {
      resetProfileSyncError()
      startProfileSync()
      await utils.profile.getEmployment.cancel()
      const previousEmployment = utils.profile.getEmployment.getData()
      utils.profile.getEmployment.setData(undefined, (current) => ({
        ...(current ?? profileEmploymentDefaults),
        ...input,
      }))
      return { previousEmployment }
    },
    onError: (error, _input, context) => {
      console.error('Error saving employment:', error)
      if (context?.previousEmployment) {
        utils.profile.getEmployment.setData(undefined, context.previousEmployment)
      }
      failProfileSync()
      toast.show('Error', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save employment preferences. Please try again.',
      })
    },
    onSuccess: () => {
      toast.show('Employment Updated', {
        message: 'Your employment preferences have been saved successfully!',
      })
    },
    onSettled: (_data, error) => {
      if (!error) {
        completeProfileSync()
      }
      void invalidateProfileQueries(utils)
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(profileEmploymentInputSchema),
    defaultValues: profileEmploymentDefaults,
    mode: 'onChange', // Real-time validation
  })

  const _openToTravel = watch('open_to_travel')

  // Reset form when employment data is loaded
  useEffect(() => {
    if (employmentData) {
      reset(employmentData)
      originalDataRef.current = employmentData
    }
  }, [employmentData, reset])

  const onSubmit = async (data: EmploymentProfileFormData) => {
    console.log('✅ Form submission started')
    console.log('📋 Form data:', JSON.stringify(data, null, 2))
    setIsLoading(true)
    try {
      await updateEmploymentMutation.mutateAsync(data)
    } catch (error) {
      console.error('❌ Mutation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onFormError = (formErrors: typeof errors) => {
    console.error('❌ Form validation failed!')
    console.error('Validation errors:', JSON.stringify(formErrors, null, 2))
    toast.show('Validation Error', {
      message: 'Please check the form for errors',
    })
  }

  // Debug: Log errors whenever they change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('⚠️ Current form errors:', errors)
    }
  }, [errors])

  if (isLoadingEmployment) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text>Loading employment preferences...</Text>
      </YStack>
    )
  }

  return (
    <YStack>
      <DashboardWidget>
        <YStack gap="$4" p="$4" flex={1}>
          {/* Debug: Show validation errors */}
          {Object.keys(errors).length > 0 && (
            <YStack bg="$red2" p="$3" rounded="$4" borderWidth={1} borderColor="$red8">
              <Text fontWeight="600" color="$red11" mb="$2">
                Validation Errors:
              </Text>
              {Object.entries(errors).map(([key, error]) => (
                <Text key={key} color="$red11" fontSize="$2">
                  • {key}: {error?.message?.toString() || 'Invalid value'}
                </Text>
              ))}
            </YStack>
          )}

          <YStack gap="$4">
            {/* Hourly Rate */}
            <YStack gap="$2">
              <Text fontWeight="600">Hourly Rate ($)</Text>
              <Controller
                name="hourly_rate"
                control={control}
                render={({ field }) => (
                  <XStack gap="$3" items="center">
                    <Input
                      flex={1}
                      placeholder="Enter your hourly rate"
                      value={field.value?.toString() || ''}
                      onChangeText={(text) =>
                        field.onChange(text ? Number.parseFloat(text) : undefined)
                      }
                      keyboardType="numeric"
                      borderColor={errors.hourly_rate ? '$red8' : '$borderColor'}
                    />
                  </XStack>
                )}
              />
              {errors.hourly_rate && (
                <Text color="$red10" fontSize="$2">
                  {errors.hourly_rate.message}
                </Text>
              )}
            </YStack>

            {/* Preferred Work Locations */}
            <YStack gap="$3" py="$3">
              <Text fontWeight="600">Preferred Work Locations</Text>
              <Controller
                name="preferred_work_locations"
                control={control}
                render={({ field }) => (
                  <LocationListInput
                    value={field.value || []}
                    onChange={field.onChange}
                    maxLocations={3}
                    helpText="You can add up to three locations. This can be as broad as in a state or county, or specific to a city."
                    placeholder="Search for a work location..."
                    provider="mapbox"
                    apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
                  />
                )}
              />
            </YStack>

            {/* Travel Preferences */}
            <YStack gap="$3">
              <Text fontWeight="600">Travel Preferences</Text>
              <Controller
                name="open_to_travel"
                control={control}
                render={({ field }) => (
                  <ToggleCard
                    icon={<Plane size="$2" color="$color11" />}
                    title="Willing to Travel"
                    description="I am available for work assignments that require travel"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    expandedContent={
                      <YStack gap="$3" pt="$2">
                        <Text fontSize="$3" fontWeight="500" color="$color11">
                          Maximum Travel Distance
                        </Text>
                        <Controller
                          name="travel_distance_miles"
                          control={control}
                          render={({ field: distanceField }) => (
                            <YStack gap="$3">
                              <Slider
                                value={[distanceField.value ?? 25]}
                                onValueChange={([value]) => distanceField.onChange(value)}
                                min={10}
                                max={250}
                                step={5}
                                size="$1"
                              >
                                <Slider.Track backgroundColor="$color4">
                                  <Slider.TrackActive backgroundColor="$blue9" />
                                </Slider.Track>
                                <Slider.Thumb index={0} circular />
                              </Slider>
                              <XStack justify="space-between" items="center">
                                <Text fontSize="$2" color="$color9">
                                  10 miles
                                </Text>
                                <Text fontSize="$3" fontWeight="600" color="$color12">
                                  {distanceField.value ?? 25} miles
                                </Text>
                                <Text fontSize="$2" color="$color9">
                                  250 miles
                                </Text>
                              </XStack>
                            </YStack>
                          )}
                        />
                      </YStack>
                    }
                  />
                )}
              />
            </YStack>

            {/* Residency */}
            <YStack gap="$3">
              <Text fontWeight="600">Residency</Text>
              <Controller
                name="us_resident"
                control={control}
                render={({ field }) => (
                  <ToggleCard
                    icon={<Flag size="$2" color="$color11" />}
                    title="US Resident"
                    description="I am a resident of the United States"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="us_passport"
                control={control}
                render={({ field }) => (
                  <ToggleCard
                    icon={<MapPin size="$2" color="$color11" />}
                    title="US Passport"
                    description="I have a valid United States passport"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </YStack>

            {/* Drivers License */}
            <YStack gap="$3">
              <Text fontWeight="600">Driver's License</Text>
              <Controller
                name="drivers_license_classes"
                control={control}
                render={({ field }) => {
                  const hasValues = !!(field.value && field.value.length > 0)
                  const [isExpanded, setIsExpanded] = useState(hasValues)

                  // Sync expanded state with checkbox values
                  useEffect(() => {
                    setIsExpanded(hasValues)
                  }, [hasValues])

                  return (
                    <ToggleCard
                      icon={<Car size="$2" color="$color11" />}
                      title="I have a valid driver's license"
                      description="Select all license classes that apply"
                      checked={hasValues || isExpanded}
                      onCheckedChange={(checked) => {
                        setIsExpanded(checked)
                        if (!checked) {
                          field.onChange([])
                        }
                      }}
                      expandedContent={
                        <YStack gap="$2" pt="$2">
                          {DRIVERS_LICENSE_OPTIONS.map((license) => {
                            const checkboxId = `license-${license.replace(/\s+/g, '-').toLowerCase()}`
                            return (
                              <XStack key={license} gap="$3" items="center">
                                <Checkbox
                                  id={checkboxId}
                                  checked={field.value?.includes(license) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked === true) {
                                      field.onChange([...current, license])
                                    } else {
                                      const filtered = current.filter((l) => l !== license)
                                      field.onChange(filtered)
                                    }
                                  }}
                                >
                                  <Checkbox.Indicator>
                                    <Check size={16} />
                                  </Checkbox.Indicator>
                                </Checkbox>
                                <Label htmlFor={checkboxId} cursor="pointer">
                                  {license}
                                </Label>
                              </XStack>
                            )
                          })}
                        </YStack>
                      }
                    />
                  )
                }}
              />
            </YStack>

            {/* Military Status */}
            <YStack gap="$3">
              <Text fontWeight="600">Military Status</Text>
              <Controller
                name="military_status"
                control={control}
                render={({ field }) => {
                  const hasValues = !!(field.value && field.value.length > 0)
                  const [isExpanded, setIsExpanded] = useState(hasValues)

                  // Sync expanded state with checkbox values
                  useEffect(() => {
                    setIsExpanded(hasValues)
                  }, [hasValues])

                  return (
                    <ToggleCard
                      icon={<Shield size="$2" color="$color11" />}
                      title="Former/Current Military"
                      description="Select all that apply"
                      checked={hasValues || isExpanded}
                      onCheckedChange={(checked) => {
                        setIsExpanded(checked)
                        if (!checked) {
                          field.onChange([])
                        }
                      }}
                      expandedContent={
                        <YStack gap="$2" pt="$2">
                          {MILITARY_STATUS_OPTIONS.map((status) => {
                            const checkboxId = `military-${status.replace(/\s+/g, '-').toLowerCase()}`
                            return (
                              <XStack key={status} gap="$3" items="center">
                                <Checkbox
                                  id={checkboxId}
                                  checked={field.value?.includes(status) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked === true) {
                                      field.onChange([...current, status])
                                    } else {
                                      field.onChange(current.filter((s) => s !== status))
                                    }
                                  }}
                                >
                                  <Checkbox.Indicator>
                                    <Check size={16} />
                                  </Checkbox.Indicator>
                                </Checkbox>
                                <Label htmlFor={checkboxId} cursor="pointer">
                                  {status}
                                </Label>
                              </XStack>
                            )
                          })}
                        </YStack>
                      }
                    />
                  )
                }}
              />
            </YStack>

            {/* Availability */}
            <YStack gap="$3">
              <Text fontWeight="600">Availability</Text>
              <Controller
                name="availability"
                control={control}
                render={({ field }) => {
                  const hasValues = !!(field.value && field.value.length > 0)
                  const [isExpanded, setIsExpanded] = useState(hasValues)

                  // Sync expanded state with checkbox values
                  useEffect(() => {
                    setIsExpanded(hasValues)
                  }, [hasValues])

                  return (
                    <ToggleCard
                      icon={<Calendar size="$2" color="$color11" />}
                      title="I'm available for work"
                      description="Select all that apply"
                      checked={hasValues || isExpanded}
                      onCheckedChange={(checked) => {
                        setIsExpanded(checked)
                        if (!checked) {
                          field.onChange([])
                        }
                      }}
                      expandedContent={
                        <YStack gap="$2" pt="$2">
                          {AVAILABILITY_OPTIONS.map((option) => {
                            const checkboxId = `availability-${option.replace(/\s+/g, '-').toLowerCase()}`
                            return (
                              <XStack key={option} gap="$3" items="center">
                                <Checkbox
                                  id={checkboxId}
                                  checked={field.value?.includes(option) || false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked === true) {
                                      field.onChange([...current, option])
                                    } else {
                                      field.onChange(current.filter((a) => a !== option))
                                    }
                                  }}
                                >
                                  <Checkbox.Indicator>
                                    <Check size={16} />
                                  </Checkbox.Indicator>
                                </Checkbox>
                                <Label htmlFor={checkboxId} cursor="pointer">
                                  {option}
                                </Label>
                              </XStack>
                            )
                          })}
                        </YStack>
                      }
                    />
                  )
                }}
              />
            </YStack>

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
                onPress={handleSubmit(onSubmit, onFormError)}
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
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
