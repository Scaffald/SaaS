import { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Spinner,
  AnimatePresence,
  Slider,
  Checkbox,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  employmentProfileSchema,
  type EmploymentProfileFormData,
  employmentProfileDefaults,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
} from '../config/employment-schema'
import { DashboardWidget, LocationListInput, ToggleCard } from '@app/ui'
import { Flag, MapPin, Plane, Car, Shield, Calendar } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'

interface EmploymentSectionProps {
  /**
   * User ID to edit. If not provided, edits the current user's profile.
   */
  userId?: string
  /**
   * Mode determines which tRPC endpoints to use
   * - 'user': Uses profile.* endpoints (current user)
   * - 'admin': Uses office.* endpoints (any user)
   */
  mode?: 'user' | 'admin'
  /**
   * Read-only mode (view only)
   */
  readOnly?: boolean
}

/**
 * Shared Employment Section Component
 * Works in both user dashboard and admin office contexts
 */
export function EmploymentSection({
  userId,
  mode = 'user',
  readOnly = false,
}: EmploymentSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastController()

  // Determine which tRPC endpoints to use based on mode
  const useQuery =
    mode === 'admin' && userId
      ? () => api.office.getUserEmployment.useQuery({ userId })
      : () => api.profile.getEmployment.useQuery()

  const useMutation =
    mode === 'admin' && userId
      ? () =>
          api.office.updateUserEmployment.useMutation({
            onSuccess: () => {
              toast.show('Employment Updated', {
                message: 'Employment preferences have been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving employment:', error)
              const message =
                error instanceof Error ? error.message : 'Failed to save employment preferences.'
              toast.show('Error', {
                message,
              })
            },
          })
      : () =>
          api.profile.updateEmployment.useMutation({
            onSuccess: () => {
              toast.show('Employment Updated', {
                message: 'Your employment preferences have been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving employment:', error)
              const message =
                error instanceof Error ? error.message : 'Failed to save employment preferences.'
              toast.show('Error', {
                message,
              })
            },
          })

  const { data: employmentData, isLoading: isLoadingEmployment, refetch } = useQuery()

  const updateEmploymentMutation = useMutation()

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(employmentProfileSchema),
    defaultValues: employmentProfileDefaults,
    mode: 'onChange',
  })

  // Reset form when employment data is loaded
  useEffect(() => {
    if (employmentData) {
      reset(employmentData)
    }
  }, [employmentData, reset])

  const onSubmit = async (data: EmploymentProfileFormData) => {
    if (readOnly) return

    setIsLoading(true)
    try {
      if (mode === 'admin' && userId) {
        await updateEmploymentMutation.mutateAsync({ userId, data })
      } else {
        await updateEmploymentMutation.mutateAsync(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingEmployment) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text>Loading employment preferences...</Text>
      </YStack>
    )
  }

  return (
    <DashboardWidget>
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
                  editable={!readOnly}
                  opacity={readOnly ? 0.7 : 1}
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
                disabled={readOnly}
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
                checked={(field.value as boolean) || false}
                onCheckedChange={field.onChange}
                disabled={readOnly}
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
                            value={[distanceField.value ?? 50]}
                            onValueChange={([value]) => distanceField.onChange(value)}
                            min={5}
                            max={100}
                            step={5}
                            size="$1"
                            disabled={readOnly}
                          >
                            <Slider.Track>
                              <Slider.TrackActive />
                            </Slider.Track>
                            <Slider.Thumb index={0} circular />
                          </Slider>
                          <XStack justify="space-between" items="center">
                            <Text fontSize="$2" color="$color9">
                              5 miles
                            </Text>
                            <Text fontSize="$3" fontWeight="600" color="$color12">
                              {distanceField.value ?? 50} miles
                            </Text>
                            <Text fontSize="$2" color="$color9">
                              100 miles
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
                disabled={readOnly}
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
                disabled={readOnly}
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
              const [isExpanded, setIsExpanded] = useState(
                !!(field.value && field.value.length > 0)
              )

              return (
                <ToggleCard
                  icon={<Car size="$2" color="$color11" />}
                  title="I have a valid driver's license"
                  description="Select all license classes that apply"
                  checked={isExpanded}
                  onCheckedChange={(checked) => {
                    if (readOnly) return
                    setIsExpanded(checked)
                    if (!checked) {
                      field.onChange([])
                    }
                  }}
                  disabled={readOnly}
                  expandedContent={
                    <YStack gap="$2" pt="$2">
                      {DRIVERS_LICENSE_OPTIONS.map((license) => (
                        <XStack key={license} gap="$3" items="center">
                          <Checkbox
                            checked={field.value?.includes(license) || false}
                            onCheckedChange={(checked) => {
                              if (readOnly) return
                              const current = field.value || []
                              if (checked === true) {
                                field.onChange([...current, license])
                              } else {
                                const filtered = current.filter((l) => l !== license)
                                field.onChange(filtered)
                              }
                            }}
                            disabled={readOnly}
                          />
                          <Text
                            onPress={() => {
                              if (readOnly) return
                              const current = field.value || []
                              const isChecked = current.includes(license)
                              if (isChecked) {
                                const filtered = current.filter((l) => l !== license)
                                field.onChange(filtered)
                              } else {
                                field.onChange([...current, license])
                              }
                            }}
                          >
                            Class {license}
                          </Text>
                        </XStack>
                      ))}
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
              const [isExpanded, setIsExpanded] = useState(
                !!(field.value && field.value.length > 0)
              )

              return (
                <ToggleCard
                  icon={<Shield size="$2" color="$color11" />}
                  title="Former/Current Military"
                  description="Select all that apply"
                  checked={isExpanded}
                  onCheckedChange={(checked) => {
                    if (readOnly) return
                    setIsExpanded(checked)
                    if (!checked) {
                      field.onChange([])
                    }
                  }}
                  disabled={readOnly}
                  expandedContent={
                    <YStack gap="$2" pt="$2">
                      {MILITARY_STATUS_OPTIONS.map((status) => (
                        <XStack key={status} gap="$3" items="center">
                          <Checkbox
                            checked={field.value?.includes(status) || false}
                            onCheckedChange={(checked) => {
                              if (readOnly) return
                              const current = field.value || []
                              if (checked === true) {
                                field.onChange([...current, status])
                              } else {
                                field.onChange(current.filter((s) => s !== status))
                              }
                            }}
                            disabled={readOnly}
                          />
                          <Text>{status}</Text>
                        </XStack>
                      ))}
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
              const [isExpanded, setIsExpanded] = useState(
                !!(field.value && field.value.length > 0)
              )

              return (
                <ToggleCard
                  icon={<Calendar size="$2" color="$color11" />}
                  title="I'm available for work"
                  description="Select all that apply"
                  checked={isExpanded}
                  onCheckedChange={(checked) => {
                    if (readOnly) return
                    setIsExpanded(checked)
                    if (!checked) {
                      field.onChange([])
                    }
                  }}
                  disabled={readOnly}
                  expandedContent={
                    <YStack gap="$2" pt="$2">
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <XStack key={option} gap="$3" items="center">
                          <Checkbox
                            checked={field.value?.includes(option) || false}
                            onCheckedChange={(checked) => {
                              if (readOnly) return
                              const current = field.value || []
                              if (checked === true) {
                                field.onChange([...current, option])
                              } else {
                                field.onChange(current.filter((a) => a !== option))
                              }
                            }}
                            disabled={readOnly}
                          />
                          <Text>{option}</Text>
                        </XStack>
                      ))}
                    </YStack>
                  }
                />
              )
            }}
          />
        </YStack>

        {/* Save Button */}
        {!readOnly && (
          <XStack justify="flex-end" pt="$4">
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
                      enterStyle={{ scale: 0 }}
                      exitStyle={{ scale: 0 }}
                    />
                  </Button.Icon>
                )}
              </AnimatePresence>
              <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
            </Button>
          </XStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
