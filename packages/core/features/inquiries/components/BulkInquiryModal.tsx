import { api } from '@app/core/utils/api'
import { type BulkInquiryInput, bulkInquirySchema } from '@app/schemas'
import {
  Button,
  CustomCheckbox,
  Input,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
} from '@scaffald/tamagui-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Progress, TextArea } from 'tamagui'
import { InquiryHelpSidebar } from './InquiryHelpSidebar'

interface BulkInquiryModalProps {
  open: boolean
  onClose: () => void
  applicationIds: string[]
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
] as const

const WORK_SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'day_week', label: 'Day-Week' },
] as const

export function BulkInquiryModal({ open, onClose, applicationIds }: BulkInquiryModalProps) {
  const toast = useToastController()
  const [showResults, setShowResults] = useState(false)
  const [bulkResults, setBulkResults] = useState<{
    total: number
    successful: number
    failed: number
    results: Array<{
      applicationId: string
      success: boolean
      inquiryId?: string
      error?: string
    }>
  } | null>(null)

  const form = useForm<BulkInquiryInput>({
    resolver: zodResolver(bulkInquirySchema),
    mode: 'onChange',
    defaultValues: {
      employmentType: undefined,
      employmentTypeNegotiable: true,
      workSchedule: undefined,
      workScheduleNegotiable: true,
      scheduleShifts: false,
      workingHoursStart: undefined,
      workingHoursEnd: undefined,
      workingHoursTimezone: 'America/New_York',
      workingHoursNegotiable: true,
      workdays: [],
      workdaysNegotiable: true,
      employmentStartDate: '',
      employmentEndDate: undefined,
      employmentDatesNegotiable: true,
      rateType: 'hourly',
      rateMinCents: 0,
      rateMaxCents: undefined,
      rateNegotiable: true,
      enduranceRequired: false,
      willingToTravel: undefined,
      travelDistanceMiles: undefined,
      willingToWorkOvertime: undefined,
      hasDriversLicense: undefined,
      additionalNotes: undefined,
    },
  })

  const createBulk = api.inquiries.createBulk.useMutation({
    onSuccess: (result: {
      total: number
      successful: number
      failed: number
      results: Array<{
        applicationId: string
        success: boolean
        inquiryId?: string
        error?: string
      }>
    }) => {
      setBulkResults(result)
      setShowResults(true)

      if (result.failed > 0) {
        toast.show('Bulk inquiry partially completed', {
          message: `Successfully sent to ${result.successful} candidates. ${result.failed} failed.`,
          duration: 5000,
        })
      } else {
        toast.show('Bulk inquiry sent', {
          message: `Successfully sent inquiry to ${result.successful} candidates.`,
          duration: 3000,
        })
        // Close after successful completion
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    },
    onError: (error: { message?: string }) => {
      toast.show('Failed to send bulk inquiry', {
        message: error.message ?? 'Please try again.',
        duration: 5000,
      })
    },
  })

  const { control, handleSubmit, watch } = form

  const watchedValues = watch()
  const isSubmitting = createBulk.isPending

  const onSubmit = handleSubmit(async (data) => {
    await createBulk.mutateAsync({
      applicationIds,
      inquiryData: data as BulkInquiryInput,
    })
  })

  const handleClose = () => {
    if (!isSubmitting) {
      setShowResults(false)
      setBulkResults(null)
      form.reset()
      onClose()
    }
  }

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

  if (showResults && bulkResults) {
    return (
      <Sheet modal open={open} onOpenChange={handleClose}>
        <Sheet.Frame>
          <ScrollView>
            <YStack gap="$4" p="$4">
              <Text fontSize="$7" fontWeight="600">
                Bulk Inquiry Results
              </Text>

              {/* Summary */}
              <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
                <XStack gap="$2" items="center">
                  <Text fontSize="$5" fontWeight="600" color="$green10">
                    ✓ {bulkResults.successful} Successful
                  </Text>
                </XStack>
                {bulkResults.failed > 0 && (
                  <XStack gap="$2" items="center">
                    <Text fontSize="$5" fontWeight="600" color="$red10">
                      ✗ {bulkResults.failed} Failed
                    </Text>
                  </XStack>
                )}
                <Text fontSize="$3" color="$color11">
                  Total: {bulkResults.total} candidates
                </Text>
              </YStack>

              {/* Failed details */}
              {bulkResults.failed > 0 && (
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600" color="$red10">
                    Failed Inquiries
                  </Text>
                  {bulkResults.results
                    .filter((r) => !r.success)
                    .map((result) => (
                      <YStack key={result.applicationId} p="$3" bg="$red2" rounded="$3" gap="$1">
                        <Text fontSize="$3" fontWeight="600">
                          Application: {result.applicationId}
                        </Text>
                        <Text fontSize="$2" color="$red11">
                          {result.error || 'Unknown error'}
                        </Text>
                      </YStack>
                    ))}
                </YStack>
              )}

              {/* Actions */}
              <XStack gap="$3" justify="flex-end" pt="$2">
                <Button variant="outlined" onPress={handleClose}>
                  Close
                </Button>
              </XStack>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    )
  }

  return (
    <Sheet modal open={open} onOpenChange={handleClose}>
      <Sheet.Frame>
          <FormProvider {...form}>
            <YStack p="$4" flex={1}>
              <XStack gap="$4" flex={1} $sm={{ flexDirection: 'column' }}>
                {/* Main Form */}
                <YStack flex={1} gap="$4">
                  <ScrollView>
                    <YStack gap="$6" p="$4" $sm={{ gap: '$8', p: '$3' }}>
                      {/* Header */}
                      <YStack gap="$2">
                        <Text fontSize="$8" fontWeight="700">
                          Send Inquiry to {applicationIds.length} Candidates
                        </Text>
                        <Text fontSize="$3" color="$color11">
                          The same inquiry will be sent to all selected candidates
                        </Text>
                      </YStack>

                      {/* Progress indicator */}
                      {isSubmitting && (
                        <YStack gap="$2" p="$4" bg="$blue2" rounded="$4">
                          <Text fontSize="$4" fontWeight="600">
                            Sending inquiries...
                          </Text>
                          <Progress value={75} />
                          <Text fontSize="$2" color="$color11">
                            Please wait while we send inquiries to all candidates
                          </Text>
                        </YStack>
                      )}

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
                                  onCheckedChange={(checked) => field.onChange(!checked)}
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
                        </YStack>
                      </YStack>

                      <Separator />

                      {/* Compensation Section */}
                      <YStack gap="$4">
                        <Text fontSize="$6" fontWeight="700">
                          Compensation
                        </Text>

                        {/* Rate Type */}
                        <YStack gap="$2">
                          <Text fontWeight="600" fontSize="$4">
                            Rate type
                          </Text>
                          <Controller
                            control={control}
                            name="rateType"
                            render={({ field }) => (
                              <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                                <Button
                                  flex={1}
                                  theme={field.value === 'hourly' ? 'blue' : 'gray'}
                                  variant={field.value === 'hourly' ? undefined : 'outlined'}
                                  onPress={() => field.onChange('hourly')}
                                  size="$4"
                                  $sm={{ height: 48 }}
                                >
                                  Hourly
                                </Button>
                                <Button
                                  flex={1}
                                  theme={field.value === 'salary' ? 'blue' : 'gray'}
                                  variant={field.value === 'salary' ? undefined : 'outlined'}
                                  onPress={() => field.onChange('salary')}
                                  size="$4"
                                  $sm={{ height: 48 }}
                                >
                                  Salary
                                </Button>
                              </XStack>
                            )}
                          />
                        </YStack>

                        {/* Rate Range */}
                        <XStack gap="$2" $sm={{ flexDirection: 'column' }}>
                          <YStack gap="$2" flex={1}>
                            <Text fontWeight="600" fontSize="$4">
                              Minimum rate
                            </Text>
                            <Controller
                              control={control}
                              name="rateMinCents"
                              render={({ field }) => (
                                <Input
                                  placeholder={
                                    watchedValues.rateType === 'hourly' ? '$0.00/hr' : '$0,000/yr'
                                  }
                                  value={formatCentsToDollars(field.value)}
                                  onChangeText={(text) => {
                                    const cents = parseDollarsToCents(text)
                                    field.onChange(cents)
                                  }}
                                  keyboardType="numeric"
                                />
                              )}
                            />
                          </YStack>
                          <YStack gap="$2" flex={1}>
                            <Text fontWeight="600" fontSize="$4">
                              Maximum rate (optional)
                            </Text>
                            <Controller
                              control={control}
                              name="rateMaxCents"
                              render={({ field }) => (
                                <Input
                                  placeholder={
                                    watchedValues.rateType === 'hourly' ? '$0.00/hr' : '$0,000/yr'
                                  }
                                  value={formatCentsToDollars(field.value)}
                                  onChangeText={(text) => {
                                    const cents = parseDollarsToCents(text)
                                    field.onChange(cents)
                                  }}
                                  keyboardType="numeric"
                                />
                              )}
                            />
                          </YStack>
                        </XStack>
                      </YStack>

                      <Separator />

                      {/* Other Section */}
                      <YStack gap="$4">
                        <Text fontSize="$6" fontWeight="700">
                          Additional Notes
                        </Text>
                        <Controller
                          control={control}
                          name="additionalNotes"
                          render={({ field }) => (
                            <TextArea
                              placeholder="Add any additional information or requirements..."
                              value={field.value || ''}
                              onChangeText={field.onChange}
                              numberOfLines={4}
                              height={120}
                            />
                          )}
                        />
                      </YStack>

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
                        <Button
                          variant="outlined"
                          onPress={handleClose}
                          disabled={isSubmitting}
                          $sm={{ height: 48, flex: 1 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onPress={onSubmit}
                          disabled={isSubmitting}
                          theme="blue"
                          $sm={{ height: 48, flex: 1 }}
                        >
                          {isSubmitting
                            ? 'Sending...'
                            : `Send to ${applicationIds.length} Candidates`}
                        </Button>
                      </XStack>
                    </YStack>
                  </ScrollView>
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
            </YStack>
          </FormProvider>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
