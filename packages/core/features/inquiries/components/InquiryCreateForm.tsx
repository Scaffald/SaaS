import { useState, useMemo, useEffect } from 'react'
import { Platform } from 'react-native'
import { Controller, FormProvider } from 'react-hook-form'
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  ScrollView,
  Separator,
  CustomCheckbox,
} from '@app/ui'
import { Adapt, Sheet, Select, Switch, TextArea } from 'tamagui'
import { Check, Info, HelpCircle } from '@tamagui/lucide-icons'
import { useInquiryForm } from '../hooks/useInquiryForm'
import { useInquiryEdit } from '../hooks/useInquiryEdit'
import { InquiryHelpSidebar } from './InquiryHelpSidebar'
import type { InquiryCreateInput } from '@app/schemas'

interface InquiryCreateFormProps {
  applicationId: string
  inquiryId?: string
  initialData?: InquiryCreateInput
  mode?: 'create' | 'edit'
  onSuccess?: (inquiryId: string) => void
  onCancel?: () => void
}

const WORKDAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
] as const

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
] as const

const WORK_SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'day_week', label: 'Day-Week' },
] as const

const RATE_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
] as const

// Common timezones (simplified list)
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
]

const getDateInputProps = () => {
  if (Platform.OS === 'web') {
    return { type: 'date' as const }
  }
  return {
    inputMode: 'numeric' as const,
    keyboardType: 'numbers-and-punctuation' as const,
  }
}

const getTimeInputProps = () => {
  if (Platform.OS === 'web') {
    return { type: 'time' as const, step: 300 }
  }
  return {
    inputMode: 'numeric' as const,
    keyboardType: 'numbers-and-punctuation' as const,
  }
}

export function InquiryCreateForm({
  applicationId,
  inquiryId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
}: InquiryCreateFormProps) {
  // Always call both hooks to satisfy React hooks rules, then use the appropriate one
  const editHook = useInquiryEdit({
    inquiryId: inquiryId || '',
    initialData,
    onSuccess: () => inquiryId && onSuccess?.(inquiryId),
  })

  const createHook = useInquiryForm({
    applicationId,
    onSuccess,
  })

  // Use edit hook if in edit mode, otherwise use create hook
  const hookResult = mode === 'edit' && inquiryId ? editHook : createHook

  // Extract form handlers - edit hook doesn't have handleSaveDraft
  const { form, handleSubmit, isSubmitting } = hookResult
  const handleSaveDraft = 'handleSaveDraft' in hookResult ? hookResult.handleSaveDraft : async () => {
    // No-op for edit mode - save draft not applicable
  }

  // Pre-populate form if initialData provided
  useEffect(() => {
    if (initialData && form) {
      form.reset(initialData)
    }
  }, [initialData, form])

  const {
    control,
    handleSubmit: handleFormSubmit,
    watch,
    formState: { errors },
  } = form

  const watchedValues = watch()

  const onSubmit = handleFormSubmit(async (data) => {
    await handleSubmit(data)
  })

  const onSaveDraft = handleFormSubmit(async (data) => {
    await handleSaveDraft(data)
  })

  // Format cents to dollars for display
  const formatCentsToDollars = (cents: number | undefined): string => {
    if (cents === undefined || cents === null) return ''
    return (cents / 100).toFixed(2)
  }

  // Parse dollars to cents
  const parseDollarsToCents = (value: string): number | undefined => {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
    if (Number.isNaN(parsed)) return undefined
    return Math.round(parsed * 100)
  }

  return (
    <FormProvider {...form}>
      <XStack gap="$4" flex={1} $sm={{ flexDirection: 'column' }}>
        {/* Main Form */}
        <YStack flex={1} gap="$4">
          <ScrollView>
            <YStack gap="$6" p="$4" $sm={{ gap: '$8', p: '$3' }}>
              {/* Employment Section */}
              <YStack gap="$4">
                <XStack items="center" gap="$2">
                  <Text fontSize="$6" fontWeight="700">
                    Employment
                  </Text>
                </XStack>

                {/* Employment Type */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Employment type
                  </Text>
                  <Controller
                    control={control}
                    name="employmentType"
                    render={({ field }) => (
                      <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                        {EMPLOYMENT_TYPE_OPTIONS.map((option) => {
                          const isSelected = field.value === option.value
                          return (
                            <Button
                              key={option.value}
                              flex={1}
                              theme={isSelected ? 'blue' : 'gray'}
                              variant={isSelected ? undefined : 'outlined'}
                              onPress={() => field.onChange(option.value)}
                              size="$4"
                              $sm={{ height: 48 }}
                            >
                              {option.label}
                            </Button>
                          )
                        })}
                      </XStack>
                    )}
                  />
                  <XStack items="center" gap="$2">
                    <Controller
                      control={control}
                      name="employmentTypeNegotiable"
                      render={({ field }) => (
                        <CustomCheckbox
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          size="medium"
                        />
                      )}
                    />
                    <Text fontSize="$3" color="$color11">
                      Non-negotiable
                    </Text>
                  </XStack>
                </YStack>

                {/* Work Schedule */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Work schedule
                  </Text>
                  <Controller
                    control={control}
                    name="workSchedule"
                    render={({ field }) => (
                      <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                        {WORK_SCHEDULE_OPTIONS.map((option) => {
                          const isSelected = field.value === option.value
                          return (
                            <Button
                              key={option.value}
                              flex={1}
                              theme={isSelected ? 'blue' : 'gray'}
                              variant={isSelected ? undefined : 'outlined'}
                              onPress={() => field.onChange(option.value)}
                              size="$4"
                              $sm={{ height: 48 }}
                            >
                              {option.label}
                            </Button>
                          )
                        })}
                      </XStack>
                    )}
                  />
                  <XStack items="center" gap="$2">
                    <Controller
                      control={control}
                      name="workScheduleNegotiable"
                      render={({ field }) => (
                        <CustomCheckbox
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          size="medium"
                        />
                      )}
                    />
                    <Text fontSize="$3" color="$color11">
                      Non-negotiable
                    </Text>
                  </XStack>
                </YStack>

                {/* Schedule Shifts */}
                <YStack gap="$2">
                  <XStack justify="space-between" items="center">
                    <Text fontWeight="600" fontSize="$4">
                      Schedule shifts
                    </Text>
                    <Controller
                      control={control}
                      name="scheduleShifts"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          size="$4"
                        />
                      )}
                    />
                  </XStack>
                </YStack>

                {/* Working Hours */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Working hours
                  </Text>
                  <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                    <YStack gap="$2" flex={1}>
                      <Controller
                        control={control}
                        name="workingHoursTimezone"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <Select.Trigger>
                              <Select.Value placeholder="Time zone" />
                            </Select.Trigger>
                            <Adapt when="sm" platform="touch">
                              <Sheet modal dismissOnSnapToBottom>
                                <Sheet.Frame>
                                  <Sheet.ScrollView>
                                    <Adapt.Contents />
                                  </Sheet.ScrollView>
                                </Sheet.Frame>
                                <Sheet.Overlay />
                              </Sheet>
                            </Adapt>
                            <Select.Content zIndex={200000}>
                              <Select.Viewport>
                                {TIMEZONE_OPTIONS.map((option, index) => (
                                  <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    index={index}
                                  >
                                    <Select.ItemText>
                                      {option.label}
                                    </Select.ItemText>
                                    <Select.ItemIndicator marginLeft="auto">
                                      <Check size={16} />
                                    </Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select>
                        )}
                      />
                    </YStack>
                    <YStack gap="$2" flex={1}>
                      <Controller
                        control={control}
                        name="workingHoursStart"
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Start time (e.g., 07:00)"
                            {...getTimeInputProps()}
                          />
                        )}
                      />
                      {errors.workingHoursStart && (
                        <Text fontSize="$2" color="$red10">
                          {errors.workingHoursStart.message}
                        </Text>
                      )}
                    </YStack>
                    <YStack gap="$2" flex={1}>
                      <Controller
                        control={control}
                        name="workingHoursEnd"
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="End time (e.g., 16:00)"
                            {...getTimeInputProps()}
                          />
                        )}
                      />
                      {errors.workingHoursEnd && (
                        <Text fontSize="$2" color="$red10">
                          {errors.workingHoursEnd.message}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                  <XStack items="center" gap="$2">
                    <Controller
                      control={control}
                      name="workingHoursNegotiable"
                      render={({ field }) => (
                        <CustomCheckbox
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          size="medium"
                        />
                      )}
                    />
                    <Text fontSize="$3" color="$color11">
                      Non-negotiable
                    </Text>
                  </XStack>
                </YStack>

                {/* Workdays */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Workdays
                  </Text>
                  <Controller
                    control={control}
                    name="workdays"
                    render={({ field }) => (
                      <XStack gap="$2" flexWrap="wrap" $sm={{ gap: '$3' }}>
                        {WORKDAYS.map((day) => {
                          const isSelected = field.value?.includes(day.value)
                          return (
                            <Button
                              key={day.value}
                              theme={isSelected ? 'blue' : 'gray'}
                              variant={isSelected ? undefined : 'outlined'}
                              onPress={() => {
                                const current = field.value || []
                                if (isSelected) {
                                  field.onChange(
                                    current.filter((d) => d !== day.value)
                                  )
                                } else {
                                  field.onChange([...current, day.value])
                                }
                              }}
                              size="$3"
                              px="$3"
                              rounded="$10"
                              $sm={{ height: 48, px: '$4' }}
                            >
                              {day.label}
                            </Button>
                          )
                        })}
                      </XStack>
                    )}
                  />
                  <XStack items="center" gap="$2">
                    <Controller
                      control={control}
                      name="workdaysNegotiable"
                      render={({ field }) => (
                        <CustomCheckbox
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          size="medium"
                        />
                      )}
                    />
                    <Text fontSize="$3" color="$color11">
                      Non-negotiable
                    </Text>
                  </XStack>
                </YStack>

                {/* Date of Employment */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Date of employment
                  </Text>
                  <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                    <YStack gap="$2" flex={1}>
                  <Controller
                    control={control}
                    name="employmentStartDate"
                    render={({ field }) => (
                      <>
                        <Input
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Start date"
                          {...getDateInputProps()}
                        />
                        {errors.employmentStartDate && (
                          <Text fontSize="$2" color="$red10">
                            {errors.employmentStartDate.message}
                          </Text>
                        )}
                      </>
                    )}
                  />
                    </YStack>
                    <YStack gap="$2" flex={1}>
                      <Controller
                        control={control}
                        name="employmentEndDate"
                        render={({ field }) => (
                          <>
                            <Input
                              {...field}
                              placeholder="End date (optional)"
                              {...getDateInputProps()}
                            />
                            {errors.employmentEndDate && (
                              <Text fontSize="$2" color="$red10">
                                {errors.employmentEndDate.message}
                              </Text>
                            )}
                          </>
                        )}
                      />
                      <Text fontSize="$2" color="$color11">
                        End date is not mandatory
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack items="center" gap="$2">
                    <Controller
                      control={control}
                      name="employmentDatesNegotiable"
                      render={({ field }) => (
                        <CustomCheckbox
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          size="medium"
                        />
                      )}
                    />
                    <Text fontSize="$3" color="$color11">
                      Non-negotiable
                    </Text>
                  </XStack>
                </YStack>
              </YStack>

              <Separator />

              {/* Compensation Section */}
              <YStack gap="$4">
                <XStack items="center" gap="$2">
                  <Text fontSize="$6" fontWeight="700">
                    Compensation
                  </Text>
                </XStack>

                {/* Rate Type */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Rate
                  </Text>
                  <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                    <YStack gap="$2" flex={2}>
                      <Controller
                        control={control}
                        name="rateType"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <Select.Trigger>
                              <Select.Value placeholder="Type" />
                            </Select.Trigger>
                            <Adapt when="sm" platform="touch">
                              <Sheet modal dismissOnSnapToBottom>
                                <Sheet.Frame>
                                  <Sheet.ScrollView>
                                    <Adapt.Contents />
                                  </Sheet.ScrollView>
                                </Sheet.Frame>
                                <Sheet.Overlay />
                              </Sheet>
                            </Adapt>
                            <Select.Content zIndex={200000}>
                              <Select.Viewport>
                                {RATE_TYPE_OPTIONS.map((option, index) => (
                                  <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    index={index}
                                  >
                                    <Select.ItemText>
                                      {option.label}
                                    </Select.ItemText>
                                    <Select.ItemIndicator marginLeft="auto">
                                      <Check size={16} />
                                    </Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select>
                        )}
                      />
                    </YStack>
                    <YStack gap="$2" flex={1}>
                      <XStack items="center" gap="$1">
                        <Text>$</Text>
                        <Controller
                          control={control}
                          name="rateMinCents"
                          render={({ field }) => (
                            <Input
                              flex={1}
                              placeholder="30"
                              value={formatCentsToDollars(field.value)}
                              onChangeText={(text) => {
                                const cents = parseDollarsToCents(text)
                                field.onChange(cents)
                              }}
                              keyboardType="numeric"
                            />
                          )}
                        />
                      </XStack>
                      {errors.rateMinCents && (
                        <Text fontSize="$2" color="$red10">
                          {errors.rateMinCents.message}
                        </Text>
                      )}
                    </YStack>
                    <YStack gap="$2" flex={1}>
                      <Text fontSize="$3" color="$color11">
                        to
                      </Text>
                      <XStack items="center" gap="$1">
                        <Text>$</Text>
                        <Controller
                          control={control}
                          name="rateMaxCents"
                          render={({ field }) => (
                            <Input
                              flex={1}
                              placeholder="40 (optional)"
                              value={formatCentsToDollars(field.value)}
                              onChangeText={(text) => {
                                const cents = parseDollarsToCents(text)
                                field.onChange(cents)
                              }}
                              keyboardType="numeric"
                            />
                          )}
                        />
                      </XStack>
                      {errors.rateMaxCents && (
                        <Text fontSize="$2" color="$red10">
                          {errors.rateMaxCents.message}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                  <Text fontSize="$2" color="$color11">
                    Add a range or a single rate
                  </Text>
                  <XStack items="center" gap="$2">
                    <Controller
                      control={control}
                      name="rateNegotiable"
                      render={({ field }) => (
                        <CustomCheckbox
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          size="medium"
                        />
                      )}
                    />
                    <Text fontSize="$3" color="$color11">
                      Non-negotiable
                    </Text>
                  </XStack>
                </YStack>
              </YStack>

              <Separator />

              {/* Capabilities Section */}
              <YStack gap="$4">
                <XStack items="center" gap="$2">
                  <Text fontSize="$6" fontWeight="700">
                    Capabilities
                  </Text>
                </XStack>

                {/* Endurance */}
                <YStack gap="$2">
                  <XStack justify="space-between" items="center">
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$4">
                        Endurance
                      </Text>
                      <Button
                        size="$2"
                        circular
                        chromeless
                        icon={Info}
                        aria-label="Endurance info"
                      />
                    </XStack>
                    <Controller
                      control={control}
                      name="enduranceRequired"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          size="$4"
                        />
                      )}
                    />
                  </XStack>
                </YStack>
              </YStack>

              <Separator />

              {/* Other Section */}
              <YStack gap="$4">
                <XStack items="center" gap="$2">
                  <Text fontSize="$6" fontWeight="700">
                    Other
                  </Text>
                </XStack>

                {/* Willing to Travel */}
                <YStack gap="$2">
                  <XStack justify="space-between" items="center">
                    <Text fontWeight="600" fontSize="$4">
                      Willing to travel
                    </Text>
                    <Controller
                      control={control}
                      name="willingToTravel"
                      render={({ field }) => (
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          size="$4"
                        />
                      )}
                    />
                  </XStack>
                  {watchedValues.willingToTravel && (
                    <YStack gap="$2">
                      <XStack items="center" gap="$1">
                        <Text>up to</Text>
                        <Controller
                          control={control}
                          name="travelDistanceMiles"
                          render={({ field }) => (
                            <Input
                              flex={1}
                              placeholder="50"
                              value={
                                field.value
                                  ? field.value.toString()
                                  : undefined
                              }
                              onChangeText={(text) => {
                                const num = Number.parseInt(text, 10)
                                field.onChange(
                                  Number.isNaN(num) ? undefined : num
                                )
                              }}
                              keyboardType="numeric"
                            />
                          )}
                        />
                        <Text>miles</Text>
                      </XStack>
                    </YStack>
                  )}
                </YStack>

                {/* Willing to Work Overtime */}
                <YStack gap="$2">
                  <XStack justify="space-between" items="center">
                    <Text fontWeight="600" fontSize="$4">
                      Willing to work overtime
                    </Text>
                    <Controller
                      control={control}
                      name="willingToWorkOvertime"
                      render={({ field }) => (
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          size="$4"
                        />
                      )}
                    />
                  </XStack>
                </YStack>

                {/* Has Driver's License */}
                <YStack gap="$2">
                  <XStack justify="space-between" items="center">
                    <Text fontWeight="600" fontSize="$4">
                      Has driver's license
                    </Text>
                    <Controller
                      control={control}
                      name="hasDriversLicense"
                      render={({ field }) => (
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          size="$4"
                        />
                      )}
                    />
                  </XStack>
                </YStack>

                {/* Additional Notes */}
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Additional note
                  </Text>
                  <Controller
                    control={control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <TextArea
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Add any additional notes..."
                        height={100}
                        maxLength={2000}
                      />
                    )}
                  />
                  {errors.additionalNotes && (
                    <Text fontSize="$2" color="$red10">
                      {errors.additionalNotes.message}
                    </Text>
                  )}
                </YStack>
              </YStack>
            </YStack>
          </ScrollView>

          {/* Form Actions */}
          <XStack
            gap="$3"
            p="$4"
            bg="$background"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            justify="flex-end"
            $sm={{ flexDirection: 'column-reverse' }}
          >
            {onCancel && (
              <Button
                variant="outlined"
                onPress={onCancel}
                disabled={isSubmitting}
                $sm={{ height: 48, flex: 1 }}
              >
                Cancel
              </Button>
            )}
            {mode === 'create' && (
              <>
                <Button
                  variant="outlined"
                  onPress={onSaveDraft}
                  disabled={isSubmitting}
                  $sm={{ height: 48, flex: 1 }}
                >
                  Save Draft
                </Button>
                <Button
                  onPress={onSubmit}
                  disabled={isSubmitting}
                  theme="blue"
                  $sm={{ height: 48, flex: 1 }}
                >
                  {isSubmitting ? 'Sending...' : 'Continue'}
                </Button>
              </>
            )}
            {mode === 'edit' && (
              <Button
                onPress={onSubmit}
                disabled={isSubmitting}
                theme="blue"
                $sm={{ height: 48, flex: 1 }}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </XStack>
        </YStack>

        {/* Help Sidebar */}
        <YStack
          width={300}
          p="$4"
          bg="$color2"
          borderLeftWidth={1}
          borderLeftColor="$borderColor"
          $sm={{ display: 'none' }}
        >
          <InquiryHelpSidebar />
        </YStack>
      </XStack>
    </FormProvider>
  )
}

