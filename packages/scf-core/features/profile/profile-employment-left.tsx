import {
  OpenToTravelCard,
  USPassportToggle,
  USResidentToggle,
} from '@scf/core/features/profile/components/employment-fields'
import {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  type EmploymentProfileFormData,
  MILITARY_STATUS_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from '@scf/supabase/client-types'
import {
  useEmployment,
  useUpdateEmploymentMutation,
} from '@scf/core/utils/profile-employment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  ConfirmationDialog,
  Checkbox,
  DashboardWidget,
  LocationListInput,
  SkeletonForm,
  ToggleCard,
} from '@scaffald/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Car, Shield } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { type Control, Controller, useController, useForm } from 'react-hook-form'
import { AnimatePresence, Input, Label, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
  useAdaptiveProfileSync,
} from './utils/profile-sync-store'

type MultiSelectFieldName = 'drivers_license_classes' | 'military_status' | 'availability'

type UpdateEmploymentInput = EmploymentProfileFormData

interface UpdateEmploymentContext {
  previousEmployment?: EmploymentProfileFormData | undefined
}

interface MultiSelectToggleFieldProps {
  control: Control<EmploymentProfileFormData>
  name: MultiSelectFieldName
  icon: ReactNode
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
      iconStart={icon}
      title={title}
      description={description}
      checked={isExpanded || hasValues}
      onChange={(checked) => handleToggleChange(Boolean(checked))}
      testID={testID}
      expandedContent={
        <Stack gap={8} paddingTop={8}>
          {options.map((option) => {
            const checkboxId = `${name}-${option.replace(/\s+/g, '-').toLowerCase()}`
            const isChecked = selectedValues.includes(option)
            return (
              <Row key={option} gap={12} align="center">
                <Checkbox
                  aria-label={option}
                  checked={isChecked}
                  onChange={(value) => handleOptionChange(option, value)}
                  testID={checkboxId}
                />
                <Label cursor="pointer" onPress={() => handleOptionChange(option, !isChecked)}>
                  {option}
                </Label>
              </Row>
            )
          })}
        </Stack>
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
  const toast = useToast()
  const queryClient = useQueryClient()
  const syncStatus = useAdaptiveProfileSync(300)
  const isSyncing = syncStatus === 'syncing'

  // Use SDK hooks to fetch and update employment data
  const {
    data: employmentData,
    isLoading: isLoadingEmployment,
    isFetching: isFetchingEmployment,
  } = useEmployment()
  const updateEmploymentMutation = useUpdateEmploymentMutation({
    async onMutate(input: UpdateEmploymentInput): Promise<UpdateEmploymentContext> {
      resetProfileSyncError()
      startProfileSync()
      await queryClient.cancelQueries({ queryKey: ['profiles', 'employment'] })
      const previousEmployment = queryClient.getQueryData<EmploymentProfileFormData>([
        'profiles',
        'employment',
      ])
      queryClient.setQueryData(
        ['profiles', 'employment'],
        (current: EmploymentProfileFormData | undefined): EmploymentProfileFormData =>
          ({
            ...(current ?? profileEmploymentDefaults),
            ...input,
          }) as EmploymentProfileFormData
      )
      return { previousEmployment }
    },
    onError: (error: unknown, _input: UpdateEmploymentInput, context?: UpdateEmploymentContext) => {
      console.error('Error saving employment:', error)
      if (context?.previousEmployment) {
        queryClient.setQueryData(['profiles', 'employment'], context.previousEmployment)
      }
      failProfileSync()
      toast.show({
        title: 'Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save employment preferences. Please try again.',
        variant: 'error',
      })
    },
    onSuccess: async () => {
      toast.show({
        title: 'Employment Updated',
        message: 'Your employment preferences have been saved successfully!',
      })
      await queryClient.invalidateQueries({ queryKey: ['profiles', 'employment'] })
    },
    onSettled: async (_data: { success: boolean } | undefined, error: unknown) => {
      if (!error) {
        completeProfileSync()
      }
      await invalidateProfileQueries(queryClient)
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(profileEmploymentInputSchema),
    defaultValues: profileEmploymentDefaults,
    mode: 'onChange', // Real-time validation
  })

  const driversLicenseClassesValue = watch('drivers_license_classes')
  const travelDistanceValue = watch('travel_distance_miles')
  const driversLicenseToggleRef = useRef(false)

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

    const previousSerialized = originalDataRef.current
      ? JSON.stringify(originalDataRef.current)
      : null
    const nextSerialized = JSON.stringify(employmentData)

    if (previousSerialized === nextSerialized) {
      return
    }

    reset(employmentData)
    originalDataRef.current = employmentData
  }, [employmentData, isLoadingEmployment, isFetchingEmployment, reset])

  // Browser navigation guard - prevent data loss on page close/navigation
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return
    }
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

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

    if (
      driversLicenseToggleRef.current &&
      (!Array.isArray(data.drivers_license_classes) || data.drivers_license_classes.length === 0)
    ) {
      setError('drivers_license_classes', {
        type: 'manual',
        message: 'Please select at least one license class',
      })
      toast.show({
        title: 'Validation Error',
        message: 'Please select at least one license class',
        variant: 'error',
      })
      return
    }

    // Ensure travel distance is set if user is open to travel
    if (
      data.open_to_travel &&
      (data.travel_distance_miles === undefined || data.travel_distance_miles === null)
    ) {
      setError('travel_distance_miles', {
        type: 'manual',
        message: 'Please select a travel distance',
      })
      toast.show({
        title: 'Validation Error',
        message: 'Please select a travel distance',
        variant: 'error',
      })
      return
    }

    // Use the user's selection for open_to_travel (defaults to true if not set)
    data.open_to_travel = data.open_to_travel ?? true

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
    toast.show({
      title: 'Validation Error',
      message: 'Please check the form for errors',
      variant: 'error',
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
      <Stack gap={16} padding="md">
        <SkeletonForm fields={5} />
      </Stack>
    )
  }

  return (
    <Stack>
      <DashboardWidget>
        <Stack gap={16} padding="md" flex={1}>
          {/* Debug: Show validation errors */}
          {Object.keys(errors).length > 0 && (
            <Stack
              backgroundColor="$red2"
              padding="sm"
              borderRadius={16}
              borderWidth={1}
              borderColor="$red8"
            >
              <Text color="$red11" marginBottom={8}>
                Validation Errors:
              </Text>
              {Object.entries(errors).map(([key, error]) => (
                <Text key={key} color="$red11">
                  • {key}: {error?.message?.toString() || 'Invalid value'}
                </Text>
              ))}
            </Stack>
          )}

          <Stack gap={16}>
            {/* Hourly Rate */}
            <Stack gap={8}>
              <Text>Hourly Rate ($)</Text>
              <Controller
                name="hourly_rate"
                control={control}
                render={({ field }) => (
                  <Row gap={12} align="center">
                    <Input
                      flex={1}
                      placeholder="Enter your hourly rate"
                      value={field.value?.toString() || '0'}
                      onChangeText={(text) => {
                        const numValue = text ? Number.parseFloat(text) : 0
                        field.onChange(Number.isNaN(numValue) ? 0 : numValue)
                      }}
                      keyboardType="numeric"
                      borderColor={errors.hourly_rate ? '$red8' : '$borderColor'}
                    />
                  </Row>
                )}
              />
              {errors.hourly_rate && <Text color="$red10">{errors.hourly_rate.message}</Text>}
            </Stack>

            {/* Preferred Work Locations */}
            <Stack gap={12} paddingVertical={12}>
              <Text>Preferred Work Locations</Text>
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
            </Stack>

            {/* Travel Preferences */}
            <Stack gap={12}>
              <Text>Travel Preferences</Text>
              <Controller
                name="open_to_travel"
                control={control}
                render={({ field: openToTravelField }) => (
                  <OpenToTravelCard
                    checked={openToTravelField.value ?? true}
                    onChange={(checked) => openToTravelField.onChange(Boolean(checked))}
                    travelDistanceValue={travelDistanceValue ?? 25}
                    onTravelDistanceChange={(value) => {
                      setValue('travel_distance_miles', value, { shouldValidate: true })
                    }}
                  />
                )}
              />
              <Controller name="travel_distance_miles" control={control} render={() => <></>} />
              {errors.travel_distance_miles && (
                <Text color="$red10">{errors.travel_distance_miles.message?.toString()}</Text>
              )}
            </Stack>

            {/* Residency */}
            <Stack gap={12}>
              <Text>Residency</Text>
              <Controller
                name="us_resident"
                control={control}
                render={({ field }) => (
                  <USResidentToggle
                    checked={field.value ?? false}
                    onChange={(checked) => field.onChange(Boolean(checked))}
                  />
                )}
              />
              <Controller
                name="us_passport"
                control={control}
                render={({ field }) => (
                  <USPassportToggle
                    checked={field.value ?? false}
                    onChange={(checked) => field.onChange(Boolean(checked))}
                  />
                )}
              />
            </Stack>
            {errors.us_resident && (
              <Text color="$red10">{errors.us_resident.message?.toString()}</Text>
            )}

            {/* Drivers License */}
            <Stack gap={12}>
              <Text>Driver's License</Text>
              <MultiSelectToggleField
                control={control}
                name="drivers_license_classes"
                iconStart={<Car size="sm" color="$gray11" />}
                title="I have a valid driver's license"
                description="Select all license classes that apply"
                options={DRIVERS_LICENSE_OPTIONS}
                testID="drivers-license-toggle"
                onToggleChange={(checked) => {
                  driversLicenseToggleRef.current = checked
                }}
              />
              {errors.drivers_license_classes && (
                <Text color="$red10">{errors.drivers_license_classes.message?.toString()}</Text>
              )}
            </Stack>

            {/* Military Status */}
            <Stack gap={12}>
              <Text>Military Status</Text>
              <MultiSelectToggleField
                control={control}
                name="military_status"
                iconStart={<Shield size="sm" color="$gray11" />}
                title="Former/Current Military"
                description="Select all that apply"
                options={MILITARY_STATUS_OPTIONS}
                testID="military-status-toggle"
              />
            </Stack>

            {/* Availability */}
            <Stack gap={12}>
              <Text>Availability</Text>
              <MultiSelectToggleField
                control={control}
                name="availability"
                iconStart={<Calendar size="sm" color="$gray11" />}
                title="I'm available for work"
                description="Select all that apply"
                options={AVAILABILITY_OPTIONS}
                testID="availability-toggle"
              />
            </Stack>

            {/* Action Buttons */}
            <Row justify="flex-end" gap={12} paddingTop={16}>
              <Button
                variant="outline"
                disabled={!isDirty}
                onPress={() => setShowCancelDialog(true)}
                opacity={!isDirty ? 0.5 : 1}
              >
                Cancel
              </Button>
              <Button
                variant="filled" color="primary"
                onPress={handleSubmit(onSubmit, onFormError)}
                disabled={!isDirty || isLoading}
                opacity={!isDirty || isLoading ? 0.5 : 1}
                space={isSyncing ? '$2' : 0}
              >
                <AnimatePresence>
                  {isSyncing && (
                    <Spinner
                      animation="bouncy"
                      enterStyle={{
                        scale: 0,
                      }}
                      exitStyle={{
                        scale: 0,
                      }}
                    />
                  )}
                </AnimatePresence>
                {isSyncing ? 'Saving...' : 'Save Changes'}
              </Button>
            </Row>

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
          </Stack>
        </Stack>
      </DashboardWidget>
    </Stack>
  )
}
