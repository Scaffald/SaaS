import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, Input, H4, AnimatePresence, Slider, Label } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller, useController, type Control } from 'react-hook-form'
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
  useAdaptiveProfileSync,
} from './utils/profile-sync-store'
import { UIButton as Button, CustomCheckbox, DashboardWidget, LocationListInput, ToggleCard, ConfirmationDialog, SkeletonForm } from '@app/ui'
import { Flag, MapPin, Plane, DollarSign, Car, Shield, Calendar } from '@tamagui/lucide-icons'

type MultiSelectFieldName = 'drivers_license_classes' | 'military_status' | 'availability'

type UpdateEmploymentInput = EmploymentProfileFormData

interface UpdateEmploymentContext {
  previousEmployment?: EmploymentProfileFormData | undefined
}

interface MultiSelectToggleFieldProps {
  control: Control<EmploymentProfileFormData>
  name: MultiSelectFieldName
  icon: React.ReactNode
  title: string
  description: string
  options: readonly string[]
  testID?: string
  onToggleChange?: (checked: boolean) => void
}

function MultiSelectToggleField({
  control,
  name,
  icon,
  title,
  description,
  options,
  testID,
  onToggleChange,
}: MultiSelectToggleFieldProps) {
  const {
    field: { value, onChange },
  } = useController({
    control,
    name,
  })

  const selectedValues = value ?? []
  const hasValues = selectedValues.length > 0
  const [isExpanded, setIsExpanded] = useState(hasValues)

  useEffect(() => {
    setIsExpanded(hasValues)
  }, [hasValues])

  useEffect(() => {
    onToggleChange?.(hasValues || isExpanded)
  }, [hasValues, isExpanded, onToggleChange])

  const handleToggleChange = (checked: boolean) => {
    setIsExpanded(checked)
    if (!checked) {
      onChange([])
    }
    onToggleChange?.(checked)
  }

  const handleOptionChange = (option: string, checked: boolean) => {
    const nextChecked = checked === true
    if (nextChecked) {
      if (!selectedValues.includes(option)) {
        onChange([...selectedValues, option])
      }
      return
    }

    onChange(selectedValues.filter((item) => item !== option))
  }

  return (
    <ToggleCard
      icon={icon}
      title={title}
      description={description}
      checked={isExpanded || hasValues}
      onCheckedChange={(checked) => handleToggleChange(Boolean(checked))}
      testID={testID}
      expandedContent={
        <YStack gap="$2" pt="$2">
          {options.map((option) => {
            const checkboxId = `${name}-${option.replace(/\s+/g, '-').toLowerCase()}`
            const isChecked = selectedValues.includes(option)
            return (
              <XStack key={option} gap="$3" items="center">
                <CustomCheckbox
                  aria-label={option}
                  checked={isChecked}
                  onCheckedChange={(value) => handleOptionChange(option, value)}
                  testID={checkboxId}
                />
                <Label cursor="pointer" onPress={() => handleOptionChange(option, !isChecked)}>
                  {option}
                </Label>
              </XStack>
            )
          })}
        </YStack>
      }
    />
  )
}

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
  const syncStatus = useAdaptiveProfileSync(300)
  const isSyncing = syncStatus === 'syncing'

  // Use tRPC to fetch and update employment data
  const {
    data: employmentData,
    isLoading: isLoadingEmployment,
    isFetching: isFetchingEmployment,
  } = api.profile.getEmployment.useQuery()
  const updateEmploymentMutation = api.profile.updateEmployment.useMutation({
    async onMutate(input: UpdateEmploymentInput): Promise<UpdateEmploymentContext> {
      resetProfileSyncError()
      startProfileSync()
      await utils.profile.getEmployment.cancel()
      const previousEmployment = utils.profile.getEmployment.getData()
      utils.profile.getEmployment.setData(undefined, (current: EmploymentProfileFormData | undefined) => ({
        ...(current ?? profileEmploymentDefaults),
        ...input,
      }))
      return { previousEmployment }
    },
    onError: (error: unknown, _input: UpdateEmploymentInput, context?: UpdateEmploymentContext) => {
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
    onSuccess: async () => {
      toast.show('Employment Updated', {
        message: 'Your employment preferences have been saved successfully!',
      })
      await utils.profile.getEmployment.invalidate()
    },
    onSettled: async (_data: { success: boolean } | undefined, error: unknown) => {
      if (!error) {
        completeProfileSync()
      }
      await invalidateProfileQueries(utils)
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setError,
    clearErrors,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(profileEmploymentInputSchema),
    defaultValues: profileEmploymentDefaults,
    mode: 'onChange', // Real-time validation
  })

  const _openToTravel = watch('open_to_travel')
  const usResidentValue = watch('us_resident')
  const usPassportValue = watch('us_passport')
  const authorizedCountriesValue = watch('authorized_countries')
  const driversLicenseClassesValue = watch('drivers_license_classes')
  const travelDistanceValue = watch('travel_distance_miles')
  const driversLicenseToggleRef = useRef(false)

  useEffect(() => {
    const hasResidencyStatus =
      Boolean(usResidentValue) ||
      Boolean(usPassportValue) ||
      (Array.isArray(authorizedCountriesValue) && authorizedCountriesValue.length > 0)

    if (hasResidencyStatus) {
      clearErrors(['us_resident', 'us_passport', 'authorized_countries'])
    }
  }, [usResidentValue, usPassportValue, authorizedCountriesValue, clearErrors])

  useEffect(() => {
    if (Array.isArray(driversLicenseClassesValue) && driversLicenseClassesValue.length > 0) {
      clearErrors('drivers_license_classes')
    }
  }, [driversLicenseClassesValue, clearErrors])

  useEffect(() => {
    if (travelDistanceValue !== undefined && travelDistanceValue !== null) {
      clearErrors('travel_distance_miles')
    }
  }, [travelDistanceValue, clearErrors])

  // Reset form when employment data is loaded
  useEffect(() => {
    if (!employmentData || isLoadingEmployment || isFetchingEmployment) {
      return
    }

    const previousSerialized = originalDataRef.current ? JSON.stringify(originalDataRef.current) : null
    const nextSerialized = JSON.stringify(employmentData)

    if (previousSerialized === nextSerialized) {
      return
    }

    reset(employmentData)
    originalDataRef.current = employmentData
  }, [employmentData, isLoadingEmployment, isFetchingEmployment, reset])

  const onSubmit = async (data: EmploymentProfileFormData) => {
    console.log('✅ Form submission started')
    console.log('📋 Form data:', JSON.stringify(data, null, 2))
    clearErrors([
      'us_resident',
      'us_passport',
      'authorized_countries',
      'drivers_license_classes',
      'travel_distance_miles',
    ])

    const hasResidencyStatus =
      Boolean(data.us_resident) ||
      Boolean(data.us_passport) ||
      (Array.isArray(data.authorized_countries) && data.authorized_countries.length > 0)

    if (!hasResidencyStatus) {
      setError('us_resident', {
        type: 'manual',
        message: 'Please indicate your work authorization status',
      })
      toast.show('Validation Error', {
        message: 'Please indicate your work authorization status',
      })
      return
    }

    if (
      driversLicenseToggleRef.current &&
      (!Array.isArray(data.drivers_license_classes) || data.drivers_license_classes.length === 0)
    ) {
      setError('drivers_license_classes', {
        type: 'manual',
        message: 'Please select at least one license class',
      })
      toast.show('Validation Error', {
        message: 'Please select at least one license class',
      })
      return
    }

    if (data.open_to_travel && (data.travel_distance_miles === undefined || data.travel_distance_miles === null)) {
      setError('travel_distance_miles', {
        type: 'manual',
        message: 'Please select a travel distance',
      })
      toast.show('Validation Error', {
        message: 'Please select a travel distance',
      })
      return
    }

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
      <YStack gap="$4" p="$4">
        <SkeletonForm fields={5} />
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
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    cardPressDisabled
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
                                <Slider.Track bg="$color4">
                                  <Slider.TrackActive bg="$blue9" />
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
              {errors.travel_distance_miles && (
                <Text color="$red10" fontSize="$2">
                  {errors.travel_distance_miles.message?.toString()}
                </Text>
              )}
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
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
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
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                )}
              />
            </YStack>
            {errors.us_resident && (
              <Text color="$red10" fontSize="$2">
                {errors.us_resident.message?.toString()}
              </Text>
            )}

            {/* Drivers License */}
            <YStack gap="$3">
              <Text fontWeight="600">Driver's License</Text>
              <MultiSelectToggleField
                control={control}
                name="drivers_license_classes"
                icon={<Car size="$2" color="$color11" />}
                title="I have a valid driver's license"
                description="Select all license classes that apply"
                options={DRIVERS_LICENSE_OPTIONS}
                testID="drivers-license-toggle"
                onToggleChange={(checked) => {
                  driversLicenseToggleRef.current = checked
                }}
              />
              {errors.drivers_license_classes && (
                <Text color="$red10" fontSize="$2">
                  {errors.drivers_license_classes.message?.toString()}
                </Text>
              )}
            </YStack>

            {/* Military Status */}
            <YStack gap="$3">
              <Text fontWeight="600">Military Status</Text>
              <MultiSelectToggleField
                control={control}
                name="military_status"
                icon={<Shield size="$2" color="$color11" />}
                title="Former/Current Military"
                description="Select all that apply"
                options={MILITARY_STATUS_OPTIONS}
                testID="military-status-toggle"
              />
            </YStack>

            {/* Availability */}
            <YStack gap="$3">
              <Text fontWeight="600">Availability</Text>
              <MultiSelectToggleField
                control={control}
                name="availability"
                icon={<Calendar size="$2" color="$color11" />}
                title="I'm available for work"
                description="Select all that apply"
                options={AVAILABILITY_OPTIONS}
                testID="availability-toggle"
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
                variant="primary"
                onPress={handleSubmit(onSubmit, onFormError)}
                disabled={!isDirty || isLoading}
                opacity={!isDirty || isLoading ? 0.5 : 1}
                space={isSyncing ? '$2' : 0}
              >
                <AnimatePresence>
                  {isSyncing && (
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
                <Button.Text>{isSyncing ? 'Saving...' : 'Save Changes'}</Button.Text>
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
